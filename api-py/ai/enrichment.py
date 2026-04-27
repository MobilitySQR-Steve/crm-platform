"""
Account enrichment service — port of api/src/lib/enrichment/enrich.ts.

Conservative merge policy: only fills null / empty / UNKNOWN fields.
Never overwrites manually-set values.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

from django.conf import settings
from django.utils import timezone as djtz

from crm.models import (
    Account,
    CrossBorderMovesBand,
    EmployeeBand,
    EnrichmentKind,
    EnrichmentRun,
    EnrichmentStatus,
    TriggerEvent,
)

from .client import EnrichmentDisabledError, get_anthropic_client
from .labels import (
    EMPLOYEE_BAND_LABELS,
    MOVES_BAND_LABELS,
    TRIGGER_EVENT_LABELS,
)
from .prompts import ENRICHMENT_SYSTEM
from .schemas import ENRICHMENT_TOOL_SCHEMA

logger = logging.getLogger(__name__)

TOOL_NAME = "submit_enrichment"
RECENT_THRESHOLD_HOURS = 24
MAX_WEB_SEARCHES = 5

# String fields filled only when existing is null/empty.
_STRING_FIELDS = (
    "domain",
    "website",
    "linkedin_url",
    "hq_country",
    "hq_city",
    "industry",
    "trigger_note",
)
# Map TS camelCase tool field name → Django snake_case model field name.
_FIELD_MAP = {
    "domain": "domain",
    "website": "website",
    "linkedinUrl": "linkedin_url",
    "hqCountry": "hq_country",
    "hqCity": "hq_city",
    "industry": "industry",
    "triggerNote": "trigger_note",
}


@dataclass
class EnrichResult:
    skipped: bool
    run_id: int | None = None
    status: str | None = None
    fields_updated: list[str] | None = None
    confidence: float | None = None
    rationale: str | None = None
    citations: list[str] | None = None
    reason: str | None = None  # populated when skipped=True


def enrich_account(
    account_id: int,
    *,
    force: bool = False,
    triggered_by: str | None = None,
) -> EnrichResult:
    client = get_anthropic_client()
    if client is None:
        raise EnrichmentDisabledError()

    try:
        account = Account.objects.get(pk=account_id)
    except Account.DoesNotExist as exc:
        raise ValueError(f"Account {account_id} not found") from exc

    # Idempotency — skip if recently enriched (unless force=True)
    if not force and account.last_enriched_at:
        hours_since = (djtz.now() - account.last_enriched_at).total_seconds() / 3600
        if hours_since < RECENT_THRESHOLD_HOURS:
            return EnrichResult(
                skipped=True,
                reason=f"enriched {round(hours_since)}h ago; pass force=True to re-enrich",
            )

    run = EnrichmentRun.objects.create(
        account=account,
        kind=EnrichmentKind.ENRICH,
        status=EnrichmentStatus.RUNNING,
        model_used=settings.ENRICHMENT_MODEL,
    )

    try:
        user_message = _build_user_message(account)
        logger.info(
            "enrichment starting account_id=%s run_id=%s model=%s",
            account_id, run.id, settings.ENRICHMENT_MODEL,
        )
        response = client.messages.create(
            model=settings.ENRICHMENT_MODEL,
            max_tokens=8192,
            thinking={"type": "adaptive"},
            output_config={"effort": "medium"},
            system=[
                {"type": "text", "text": ENRICHMENT_SYSTEM, "cache_control": {"type": "ephemeral"}},
            ],
            tools=[
                {"type": "web_search_20260209", "name": "web_search", "max_uses": MAX_WEB_SEARCHES},
                {
                    "name": TOOL_NAME,
                    "description": "Submit the enriched account profile. Call exactly once after research is complete.",
                    "input_schema": ENRICHMENT_TOOL_SCHEMA,
                },
            ],
            tool_choice={"type": "auto"},
            messages=[{"role": "user", "content": user_message}],
        )

        tool_block = next(
            (b for b in response.content if getattr(b, "type", None) == "tool_use" and b.name == TOOL_NAME),
            None,
        )
        if tool_block is None:
            raise RuntimeError(
                f"Model did not call {TOOL_NAME} (stop_reason={response.stop_reason}). "
                "It may have run out of tokens, refused, or hit the web_search cap."
            )

        # tool_block.input is a dict shaped like ENRICHMENT_TOOL_SCHEMA properties
        data = tool_block.input
        confidence = float(data.get("confidence", 0))
        rationale = str(data.get("rationale", ""))[:2000]
        citations = list(data.get("citations") or [])

        updates, fields_updated = _merge_enrichment(account, data)

        for field, value in updates.items():
            setattr(account, field, value)
        account.last_enriched_at = djtz.now()
        account.enrichment_confidence = confidence
        account.save(
            update_fields=[*updates.keys(), "last_enriched_at", "enrichment_confidence", "updated_at"],
        )

        status = EnrichmentStatus.SUCCESS if fields_updated else EnrichmentStatus.PARTIAL

        run.status = status
        run.finished_at = djtz.now()
        run.fields_updated = fields_updated
        run.confidence = confidence
        run.raw_payload = {
            "rationale": rationale,
            "citations": citations,
            "stop_reason": response.stop_reason,
            "usage": _serialize_usage(response.usage),
            "triggered_by": triggered_by,
        }
        run.save()

        logger.info(
            "enrichment complete account_id=%s run_id=%s fields=%s confidence=%.2f status=%s",
            account_id, run.id, fields_updated, confidence, status,
        )

        return EnrichResult(
            skipped=False,
            run_id=run.id,
            status=status,
            fields_updated=fields_updated,
            confidence=confidence,
            rationale=rationale,
            citations=citations,
        )

    except Exception as exc:
        message = str(exc)
        logger.exception("enrichment failed account_id=%s run_id=%s", account_id, run.id)
        try:
            run.status = EnrichmentStatus.FAILED
            run.finished_at = djtz.now()
            run.error_message = message[:5000]
            run.save(update_fields=["status", "finished_at", "error_message"])
        except Exception:
            pass
        raise


# ── Helpers ─────────────────────────────────────────────────────


def _build_user_message(account: Account) -> str:
    known: list[str] = [f"Name: {account.name}"]
    if account.domain:
        known.append(f"Domain: {account.domain}")
    if account.website:
        known.append(f"Website: {account.website}")
    if account.hq_country:
        known.append(f"HQ country: {account.hq_country}")
    if account.hq_city:
        known.append(f"HQ city: {account.hq_city}")
    if account.industry:
        known.append(f"Industry: {account.industry}")
    if account.employee_band != EmployeeBand.UNKNOWN:
        known.append(
            f"Employee band: {EMPLOYEE_BAND_LABELS[account.employee_band]} "
            "(already set — verify, do not overwrite)"
        )
    if account.cross_border_moves_band != CrossBorderMovesBand.UNKNOWN:
        known.append(
            f"Cross-border moves: {MOVES_BAND_LABELS[account.cross_border_moves_band]} (already set)"
        )
    if account.countries_with_employees:
        known.append(
            f"Countries with employees: {', '.join(account.countries_with_employees)} (already set)"
        )
    if account.current_tooling_tags:
        known.append(f"Current tooling: {', '.join(account.current_tooling_tags)} (already set)")
    if account.trigger_event != TriggerEvent.UNKNOWN:
        known.append(f"Trigger event: {TRIGGER_EVENT_LABELS[account.trigger_event]} (already set)")

    return (
        "Research and enrich this account. Existing data we already have:\n\n"
        + "\n".join(known)
        + "\n\nFill in any blanks you can find evidence for. Do not overwrite the "
        "existing fields. Focus on:\n"
        "- Mobility-specific signals (cross-border moves band, countries with employees, current tooling)\n"
        "- Recent buying triggers (news in the last 6 months)\n"
        "- Confirming the basics (industry, HQ city, official website, LinkedIn)\n\n"
        f"When done, call {TOOL_NAME}."
    )


def _merge_enrichment(account: Account, data: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    """Conservative merge — fills blanks only, never overwrites."""
    updates: dict[str, Any] = {}
    fields_updated: list[str] = []

    # String fields — fill only when blank
    for camel_field in ["domain", "website", "linkedinUrl", "hqCountry", "hqCity", "industry", "triggerNote"]:
        snake_field = _FIELD_MAP[camel_field]
        existing = getattr(account, snake_field)
        new_value = data.get(camel_field)
        if (existing is None or existing == "") and new_value:
            updates[snake_field] = new_value.strip() if isinstance(new_value, str) else new_value
            fields_updated.append(camel_field)

    # Enum fields — fill only when UNKNOWN
    if account.employee_band == EmployeeBand.UNKNOWN:
        new_band = data.get("employeeBand")
        if new_band and new_band != EmployeeBand.UNKNOWN and new_band in EmployeeBand.values:
            updates["employee_band"] = new_band
            fields_updated.append("employeeBand")

    if account.cross_border_moves_band == CrossBorderMovesBand.UNKNOWN:
        new_band = data.get("crossBorderMovesBand")
        if new_band and new_band != CrossBorderMovesBand.UNKNOWN and new_band in CrossBorderMovesBand.values:
            updates["cross_border_moves_band"] = new_band
            fields_updated.append("crossBorderMovesBand")

    if account.trigger_event == TriggerEvent.UNKNOWN:
        new_trig = data.get("triggerEvent")
        if new_trig and new_trig != TriggerEvent.UNKNOWN and new_trig in TriggerEvent.values:
            updates["trigger_event"] = new_trig
            fields_updated.append("triggerEvent")

    # Array fields — fill only when empty
    if not account.countries_with_employees:
        countries = data.get("countriesWithEmployees")
        if countries:
            updates["countries_with_employees"] = [c.upper() for c in countries if isinstance(c, str)]
            fields_updated.append("countriesWithEmployees")
    if not account.current_tooling_tags:
        tools = data.get("currentToolingTags")
        if tools:
            updates["current_tooling_tags"] = [t for t in tools if isinstance(t, str)]
            fields_updated.append("currentToolingTags")

    return updates, fields_updated


def _serialize_usage(usage) -> dict[str, Any]:
    """Anthropic SDK Usage object → JSON-serializable dict."""
    if usage is None:
        return {}
    if hasattr(usage, "model_dump"):
        return usage.model_dump()
    if hasattr(usage, "__dict__"):
        return {k: v for k, v in usage.__dict__.items() if not k.startswith("_")}
    return {}
