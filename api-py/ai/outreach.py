"""
Outreach drafting service — port of api/src/lib/outreach/draft.ts.
Generates a personalized first-touch email using the account's
enrichment data + trigger event as the hook.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

from django.conf import settings

from crm.models import (
    Account,
    CrossBorderMovesBand,
    EmployeeBand,
    TriggerEvent,
)

from .client import (
    NoTriggerNoteError,
    OutreachDisabledError,
    get_anthropic_client,
)
from .labels import (
    EMPLOYEE_BAND_LABELS,
    MOVES_BAND_LABELS,
    TRIGGER_EVENT_LABELS,
)
from .prompts import OUTREACH_SYSTEM
from .schemas import DRAFT_TOOL_SCHEMA

logger = logging.getLogger(__name__)

TOOL_NAME = "submit_draft"


@dataclass
class DraftResult:
    subject: str
    body: str
    call_to_action: str
    rationale: str
    model_used: str
    sender: dict[str, str]
    recipient: dict[str, str | None] | None


def draft_outreach(account_id: int, *, triggered_by: str | None = None) -> DraftResult:
    client = get_anthropic_client()
    if client is None:
        raise OutreachDisabledError()

    try:
        account = (
            Account.objects.select_related("owner")
            .prefetch_related("contacts")
            .get(pk=account_id)
        )
    except Account.DoesNotExist as exc:
        raise ValueError(f"Account {account_id} not found") from exc

    if not (account.trigger_note or "").strip():
        raise NoTriggerNoteError()

    sender = account.owner
    if sender is None:
        raise RuntimeError("Account has no owner — assign one before drafting outreach.")

    primary_contact = next((c for c in account.contacts.all() if c.is_primary), None)
    user_message = _build_user_message(account, sender, primary_contact)

    logger.info("drafting outreach account_id=%s model=%s", account_id, settings.ENRICHMENT_MODEL)
    response = client.messages.create(
        model=settings.ENRICHMENT_MODEL,
        max_tokens=2048,
        thinking={"type": "adaptive"},
        output_config={"effort": "medium"},
        system=[{"type": "text", "text": OUTREACH_SYSTEM, "cache_control": {"type": "ephemeral"}}],
        tools=[
            {
                "name": TOOL_NAME,
                "description": "Submit the drafted outreach email. Call exactly once.",
                "input_schema": DRAFT_TOOL_SCHEMA,
            }
        ],
        # tool_choice must be 'auto' when adaptive thinking is on; the system
        # prompt is explicit enough that the model reliably calls submit_draft.
        tool_choice={"type": "auto"},
        messages=[{"role": "user", "content": user_message}],
    )

    tool_block = next(
        (b for b in response.content if getattr(b, "type", None) == "tool_use" and b.name == TOOL_NAME),
        None,
    )
    if tool_block is None:
        raise RuntimeError(f"Model did not call {TOOL_NAME} (stop_reason={response.stop_reason})")

    data = tool_block.input
    return DraftResult(
        subject=str(data.get("subject", ""))[:200],
        body=str(data.get("body", "")),
        call_to_action=str(data.get("callToAction", ""))[:300],
        rationale=str(data.get("rationale", ""))[:1000],
        model_used=settings.ENRICHMENT_MODEL,
        sender={
            "first_name": sender.first_name,
            "last_name": sender.last_name,
            "email": sender.email,
        },
        recipient=(
            {
                "first_name": primary_contact.first_name,
                "last_name": primary_contact.last_name,
                "title": primary_contact.title,
            }
            if primary_contact
            else None
        ),
    )


def _build_user_message(account: Account, sender, recipient) -> str:
    lines: list[str] = [f"Account: {account.name}"]
    if account.industry:
        lines.append(f"Industry: {account.industry}")
    hq = ", ".join(filter(None, [account.hq_city, account.hq_country]))
    if hq:
        lines.append(f"HQ: {hq}")
    lines.append(f"Employee band: {EMPLOYEE_BAND_LABELS[account.employee_band]}")
    lines.append(f"Cross-border moves: {MOVES_BAND_LABELS[account.cross_border_moves_band]}")
    if account.countries_with_employees:
        lines.append(f"Countries with employees: {', '.join(account.countries_with_employees)}")
    if account.current_tooling_tags:
        lines.append(f"Current tooling: {', '.join(account.current_tooling_tags)}")
    lines.extend(
        [
            "",
            f"Trigger event: {TRIGGER_EVENT_LABELS[account.trigger_event]}",
            "Trigger note (the hook — anchor your opening on this):",
            f"  {account.trigger_note}",
            "",
        ]
    )
    if recipient:
        title_str = f", {recipient.title}" if recipient.title else ""
        lines.append(f"Primary contact: {recipient.first_name} {recipient.last_name}{title_str}")
    else:
        lines.append('No specific contact — open with "Hi there".')
    lines.extend(
        [
            "",
            f"Sender (sign off as): {sender.first_name} {sender.last_name}",
            f"Sender email: {sender.email}",
            "",
            f"Now call {TOOL_NAME} with the drafted email.",
        ]
    )
    return "\n".join(lines)
