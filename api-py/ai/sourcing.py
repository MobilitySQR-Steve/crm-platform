"""
Sourcing service — port of api/src/lib/enrichment/source.ts.
Asks Claude to find N new ICP-matching companies; deduplicates against
the existing pipeline; creates Account rows + audit EnrichmentRun entries.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from django.conf import settings
from django.utils import timezone as djtz

from crm.models import (
    Account,
    AccountSource,
    EnrichmentKind,
    EnrichmentRun,
    EnrichmentStatus,
    PursuitStatus,
)

from .client import EnrichmentDisabledError, get_anthropic_client
from .prompts import SOURCING_SYSTEM
from .schemas import SOURCING_TOOL_SCHEMA

logger = logging.getLogger(__name__)

TOOL_NAME = "submit_candidates"
MAX_WEB_SEARCHES = 5
MAX_EXISTING_TO_SHOW = 200


@dataclass
class SourceResult:
    requested: int
    returned: int
    created: list[Account]
    skipped: list[dict[str, str]]


def source_accounts(
    *,
    count: int,
    triggered_by: str | None = None,
    hint: str | None = None,
) -> SourceResult:
    client = get_anthropic_client()
    if client is None:
        raise EnrichmentDisabledError()

    count = max(1, min(20, round(count)))

    existing = list(
        Account.objects.order_by("-created_at").values("name", "domain")[:MAX_EXISTING_TO_SHOW]
    )
    existing_domains = {(e["domain"] or "").lower() for e in existing if e["domain"]}
    existing_names = {e["name"].lower() for e in existing if e["name"]}

    if existing:
        existing_list = "\n".join(
            f"- {e['name']}" + (f" ({e['domain']})" if e["domain"] else "")
            for e in existing
        )
    else:
        existing_list = "(empty pipeline — first batch)"

    user_message = (
        f"Find {count} new MobilitySQR ICP-matching companies to add to the pipeline.\n\n"
        "These accounts are already in the pipeline — DO NOT suggest any of these:\n\n"
        f"{existing_list}\n\n"
        + (f"Additional guidance: {hint}\n\n" if hint else "")
        + f"When done, call {TOOL_NAME} with {count} candidates."
    )

    logger.info("sourcing starting count=%s model=%s hint=%r", count, settings.ENRICHMENT_MODEL, hint)
    response = client.messages.create(
        model=settings.ENRICHMENT_MODEL,
        max_tokens=8192,
        thinking={"type": "adaptive"},
        output_config={"effort": "medium"},
        system=[{"type": "text", "text": SOURCING_SYSTEM, "cache_control": {"type": "ephemeral"}}],
        tools=[
            {"type": "web_search_20260209", "name": "web_search", "max_uses": MAX_WEB_SEARCHES},
            {
                "name": TOOL_NAME,
                "description": "Submit candidate accounts. Call exactly once after research is complete.",
                "input_schema": SOURCING_TOOL_SCHEMA,
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
        raise RuntimeError(f"Model did not call {TOOL_NAME} (stop_reason={response.stop_reason})")

    payload = tool_block.input
    candidates = payload.get("candidates") or []

    created: list[Account] = []
    skipped: list[dict[str, str]] = []

    for candidate in candidates:
        name = (candidate.get("name") or "").strip()
        if not name:
            skipped.append({"name": "(blank)", "reason": "missing_name"})
            continue
        domain = (candidate.get("domain") or "").strip().lower() or None

        if domain and domain in existing_domains:
            skipped.append({"name": name, "reason": "duplicate_domain"})
            continue
        if name.lower() in existing_names:
            skipped.append({"name": name, "reason": "duplicate_name"})
            continue

        account = Account.objects.create(
            name=name,
            domain=domain,
            website=candidate.get("website") or None,
            hq_country=(candidate.get("hqCountry") or "").upper() or None,
            industry=candidate.get("industry") or None,
            employee_band=candidate.get("employeeBand") or "UNKNOWN",
            trigger_event=candidate.get("triggerEvent") or "UNKNOWN",
            trigger_note=candidate.get("rationale") or None,
            source=AccountSource.ENRICHMENT,
            pursuit_status=PursuitStatus.NEW,
        )
        EnrichmentRun.objects.create(
            account=account,
            kind=EnrichmentKind.SOURCE,
            status=EnrichmentStatus.SUCCESS,
            finished_at=djtz.now(),
            model_used=settings.ENRICHMENT_MODEL,
            raw_payload={
                "rationale": candidate.get("rationale"),
                "stop_reason": response.stop_reason,
                "usage": _serialize_usage(response.usage),
                "triggered_by": triggered_by,
            },
        )
        created.append(account)
        if domain:
            existing_domains.add(domain)
        existing_names.add(name.lower())

    logger.info(
        "sourcing complete requested=%s returned=%s created=%s skipped=%s",
        count, len(candidates), len(created), len(skipped),
    )
    return SourceResult(
        requested=count,
        returned=len(candidates),
        created=created,
        skipped=skipped,
    )


def _serialize_usage(usage) -> dict[str, Any]:
    if usage is None:
        return {}
    if hasattr(usage, "model_dump"):
        return usage.model_dump()
    if hasattr(usage, "__dict__"):
        return {k: v for k, v in usage.__dict__.items() if not k.startswith("_")}
    return {}
