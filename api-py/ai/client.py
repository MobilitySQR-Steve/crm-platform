"""
Lazy Anthropic client singleton + error classes shared by the
enrichment, sourcing, and outreach services.

Returns None when ANTHROPIC_API_KEY isn't set so the server still
boots; routes 503 instead of crashing.
"""

from __future__ import annotations

from anthropic import Anthropic
from django.conf import settings


_cached_client: Anthropic | None = None


def get_anthropic_client() -> Anthropic | None:
    global _cached_client
    if not settings.ANTHROPIC_API_KEY:
        return None
    if _cached_client is None:
        _cached_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _cached_client


class EnrichmentDisabledError(Exception):
    def __init__(self):
        super().__init__("Enrichment is disabled — ANTHROPIC_API_KEY not set")


class OutreachDisabledError(Exception):
    def __init__(self):
        super().__init__("Outreach drafting is disabled — ANTHROPIC_API_KEY not set")


class NoTriggerNoteError(Exception):
    def __init__(self):
        super().__init__(
            "Account has no trigger note — run enrichment first or add one manually "
            "before drafting outreach."
        )
