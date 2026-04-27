"""DRF views for /enrichment/* and /outreach/*."""

from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsAdminRole

from .client import (
    EnrichmentDisabledError,
    NoTriggerNoteError,
    OutreachDisabledError,
)
from .enrichment import enrich_account
from .outreach import draft_outreach
from .sourcing import source_accounts


# ── Enrichment ──────────────────────────────────────────────────


class EnrichAccountView(APIView):
    """POST /enrichment/account/<id> — kick off enrichment for one account."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk: int):
        force = bool((request.data or {}).get("force", False))
        try:
            result = enrich_account(
                int(pk),
                force=force,
                triggered_by=f"user:{request.user.id}",
            )
        except EnrichmentDisabledError as exc:
            return Response(
                {"error": "enrichment_disabled", "message": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except ValueError as exc:
            if "not found" in str(exc).lower():
                return Response({"error": "not_found"}, status=status.HTTP_404_NOT_FOUND)
            return Response(
                {"error": "enrichment_failed", "message": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception as exc:
            return Response(
                {"error": "enrichment_failed", "message": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if result.skipped:
            return Response({"skipped": True, "reason": result.reason})
        return Response(
            {
                "skipped": False,
                "run_id": result.run_id,
                "status": result.status,
                "fields_updated": result.fields_updated,
                "confidence": result.confidence,
                "rationale": result.rationale,
                "citations": result.citations,
            }
        )


class SourceAccountsView(APIView):
    """POST /enrichment/source — admin-only; sources N new accounts."""

    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request):
        body = request.data or {}
        try:
            count = int(body.get("count", 10))
        except (TypeError, ValueError):
            return Response({"error": "invalid_body", "message": "count must be int"},
                            status=status.HTTP_400_BAD_REQUEST)
        hint = body.get("hint")
        if hint is not None and not isinstance(hint, str):
            return Response({"error": "invalid_body", "message": "hint must be string"},
                            status=status.HTTP_400_BAD_REQUEST)
        if hint and len(hint) > 500:
            return Response({"error": "invalid_body", "message": "hint too long"},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            result = source_accounts(
                count=count,
                hint=hint,
                triggered_by=f"user:{request.user.id}",
            )
        except EnrichmentDisabledError as exc:
            return Response(
                {"error": "enrichment_disabled", "message": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as exc:
            return Response(
                {"error": "sourcing_failed", "message": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "requested": result.requested,
                "returned": result.returned,
                "created": [
                    {
                        "id": a.id,
                        "name": a.name,
                        "domain": a.domain,
                        "hq_country": a.hq_country,
                        "industry": a.industry,
                    }
                    for a in result.created
                ],
                "skipped": result.skipped,
            }
        )


# ── Outreach ────────────────────────────────────────────────────


class DraftOutreachView(APIView):
    """POST /outreach/account/<id>/draft — generate an outreach email."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk: int):
        try:
            result = draft_outreach(int(pk), triggered_by=f"user:{request.user.id}")
        except OutreachDisabledError as exc:
            return Response(
                {"error": "outreach_disabled", "message": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except NoTriggerNoteError as exc:
            return Response(
                {"error": "no_trigger_note", "message": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except ValueError as exc:
            if "not found" in str(exc).lower():
                return Response({"error": "not_found"}, status=status.HTTP_404_NOT_FOUND)
            return Response(
                {"error": "draft_failed", "message": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception as exc:
            return Response(
                {"error": "draft_failed", "message": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "subject": result.subject,
                "body": result.body,
                "call_to_action": result.call_to_action,
                "rationale": result.rationale,
                "model_used": result.model_used,
                "sender": result.sender,
                "recipient": result.recipient,
            }
        )
