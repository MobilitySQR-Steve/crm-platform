"""
CRUD viewsets for Account, Contact, Opportunity, Activity.

Each viewset matches the corresponding TS Fastify route's behavior:
- Same URL paths
- Same query-param filters
- Same response shape (via custom OffsetLimitPagination + camel-case
  conversion middleware)
- Same status codes (201 on create, 204 on delete, 404 on missing)
"""

from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from crm_project.pagination import OffsetLimitPagination

from .models import (
    Account, AccountSource, Activity, Contact, ContactPersona,
    EnrichmentRun, Opportunity, OpportunityStage, PursuitStatus,
)
from .serializers import (
    AccountDetailSerializer, AccountListSerializer, ActivitySerializer,
    ContactSerializer, OpportunityListSerializer,
)


# ── Accounts ────────────────────────────────────────────────────


class AccountViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = OffsetLimitPagination

    def get_serializer_class(self):
        if self.action == "retrieve":
            return AccountDetailSerializer
        return AccountListSerializer

    def get_queryset(self):
        qs = (
            Account.objects.all()
            .select_related("owner")
            .annotate(
                _opp_count=Count("opportunities", distinct=True),
                _contact_count=Count("contacts", distinct=True),
                _activity_count=Count("activities", distinct=True),
            )
            .order_by("-updated_at")
        )

        params = self.request.query_params

        q = params.get("q") or ""
        if q.strip():
            from django.db.models import Q
            qs = qs.filter(
                Q(name__icontains=q) | Q(domain__icontains=q) | Q(industry__icontains=q)
            )

        owner_id = params.get("ownerId")
        if owner_id:
            qs = qs.filter(owner_id=owner_id)

        pursuit = params.get("pursuit")
        if pursuit and pursuit in PursuitStatus.values:
            qs = qs.filter(pursuit_status=pursuit)

        source = params.get("source")
        if source and source in AccountSource.values:
            qs = qs.filter(source=source)

        return qs

    def perform_create(self, serializer):
        # Default owner to the calling user; default source to MANUAL.
        defaults = {}
        if "owner_id" not in serializer.validated_data or serializer.validated_data.get("owner_id") is None:
            defaults["owner"] = self.request.user
        serializer.save(**defaults)

    def update(self, request, *args, **kwargs):
        # Force PATCH semantics on PUT too (frontend only sends PATCH, but
        # be tolerant). Django/DRF default partial=False would 400 on missing
        # required fields.
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)


# ── Opportunities ───────────────────────────────────────────────


class OpportunityViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = OffsetLimitPagination
    serializer_class = OpportunityListSerializer

    def get_queryset(self):
        qs = (
            Opportunity.objects.select_related("account", "owner")
            .order_by("-updated_at")
        )

        params = self.request.query_params
        if params.get("accountId"):
            qs = qs.filter(account_id=params["accountId"])
        if params.get("ownerId"):
            qs = qs.filter(owner_id=params["ownerId"])
        stage = params.get("stage")
        if stage and stage in OpportunityStage.values:
            qs = qs.filter(stage=stage)

        return qs

    def perform_create(self, serializer):
        # Default owner to the calling user.
        defaults = {}
        if not serializer.validated_data.get("owner_id"):
            defaults["owner"] = self.request.user
        serializer.save(**defaults)

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)


# ── Contacts ────────────────────────────────────────────────────


class ContactViewSet(viewsets.ModelViewSet):
    """
    Contacts are scoped to an account. The list endpoint requires
    accountId (matches TS behavior — no global contact listing).
    """

    permission_classes = [IsAuthenticated]
    serializer_class = ContactSerializer
    pagination_class = None  # contacts per-account; no pagination

    def get_queryset(self):
        qs = Contact.objects.all().order_by("-is_primary", "last_name")
        if self.action == "list":
            account_id = self.request.query_params.get("accountId")
            if account_id:
                qs = qs.filter(account_id=account_id)
            else:
                qs = qs.none()  # require accountId for the list view
        return qs

    def list(self, request, *args, **kwargs):
        if not request.query_params.get("accountId"):
            return Response({"error": "invalid_query", "message": "accountId is required"},
                            status=status.HTTP_400_BAD_REQUEST)
        qs = self.get_queryset()
        return Response({"items": ContactSerializer(qs, many=True).data})

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)


# ── Activities ──────────────────────────────────────────────────


class ActivityViewSet(viewsets.GenericViewSet):
    """
    Append-only timeline. List + create only — no update/delete (matches
    TS behavior).
    """

    permission_classes = [IsAuthenticated]
    serializer_class = ActivitySerializer
    pagination_class = OffsetLimitPagination

    def get_queryset(self):
        qs = (
            Activity.objects.select_related("user", "account", "opportunity")
            .order_by("-occurred_at")
        )
        params = self.request.query_params
        if params.get("accountId"):
            qs = qs.filter(account_id=params["accountId"])
        if params.get("opportunityId"):
            qs = qs.filter(opportunity_id=params["opportunityId"])
        return qs

    def list(self, request):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(ActivitySerializer(page, many=True).data)
        return Response({"items": ActivitySerializer(qs, many=True).data})

    def create(self, request):
        serializer = ActivitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Verify account exists
        account = get_object_or_404(Account, pk=serializer.validated_data["account_id"])
        activity = serializer.save(user=request.user, account=account)
        return Response(ActivitySerializer(activity).data, status=status.HTTP_201_CREATED)
