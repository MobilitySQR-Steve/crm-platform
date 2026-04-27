"""
DRF serializers for Account, Contact, Opportunity, Activity, EnrichmentRun.

Output shapes match the original TS Fastify backend so the React
frontend works unchanged. Camel-case JSON ↔ snake_case Python is
handled by the global CamelCaseJSONRenderer/Parser (see settings.py).
"""

from rest_framework import serializers

from users.serializers import UserPublicSerializer

from .models import Account, Activity, Contact, EnrichmentRun, Opportunity


# ── Atom serializers (used as nested fields) ────────────────────


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = (
            "id", "account_id", "first_name", "last_name", "email", "phone",
            "title", "linkedin_url", "persona", "is_primary",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class OpportunityListSerializer(serializers.ModelSerializer):
    """Used for listing endpoints — includes nested account + owner summary."""

    account = serializers.SerializerMethodField()
    owner = UserPublicSerializer(read_only=True)
    account_id = serializers.IntegerField(write_only=False, required=False)
    owner_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Opportunity
        fields = (
            "id", "account_id", "account", "name", "stage", "amount_usd",
            "expected_close_date", "owner_id", "owner", "created_at", "updated_at",
        )
        read_only_fields = ("id", "account", "owner", "created_at", "updated_at")

    def get_account(self, obj):
        if not obj.account_id:
            return None
        return {
            "id": obj.account.id,
            "name": obj.account.name,
            "domain": obj.account.domain,
            "hq_country": obj.account.hq_country,
            "industry": obj.account.industry,
        }


class ActivitySerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    account_id = serializers.IntegerField(required=True)
    opportunity_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Activity
        fields = (
            "id", "account_id", "opportunity_id", "user", "type",
            "subject", "body", "occurred_at", "created_at",
        )
        read_only_fields = ("id", "user", "created_at")


class EnrichmentRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnrichmentRun
        fields = (
            "id", "kind", "status", "started_at", "finished_at",
            "fields_updated", "confidence", "model_used", "error_message",
        )
        read_only_fields = fields


# ── Account list / create / update ──────────────────────────────


class AccountListSerializer(serializers.ModelSerializer):
    """Compact shape used by GET /accounts list view."""

    owner = UserPublicSerializer(read_only=True)
    owner_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    _count = serializers.SerializerMethodField()

    class Meta:
        model = Account
        fields = (
            "id", "name", "domain", "website", "linkedin_url",
            "hq_country", "hq_city", "industry",
            "employee_band", "cross_border_moves_band",
            "countries_with_employees", "current_tooling_tags",
            "trigger_event", "trigger_note",
            "pursuit_status", "source",
            "owner_id", "owner",
            "enrichment_confidence", "last_enriched_at",
            "created_at", "updated_at",
            "_count",
        )
        read_only_fields = ("id", "owner", "enrichment_confidence", "last_enriched_at",
                            "created_at", "updated_at", "_count")

    def get__count(self, obj):
        # The viewset annotates these; fall back to live counts otherwise.
        return {
            "opportunities": getattr(obj, "_opp_count", obj.opportunities.count()),
            "contacts": getattr(obj, "_contact_count", obj.contacts.count()),
            "activities": getattr(obj, "_activity_count", obj.activities.count()),
        }


class AccountDetailSerializer(AccountListSerializer):
    """Full nested shape used by GET /accounts/:id."""

    contacts = ContactSerializer(many=True, read_only=True)
    opportunities = OpportunityListSerializer(many=True, read_only=True)
    activities = serializers.SerializerMethodField()
    enrichment_runs = serializers.SerializerMethodField()

    class Meta(AccountListSerializer.Meta):
        fields = AccountListSerializer.Meta.fields + (
            "contacts", "opportunities", "activities", "enrichment_runs",
        )

    def get_activities(self, obj):
        # Recent 25 only — matches TS backend
        recent = obj.activities.order_by("-occurred_at")[:25]
        return ActivitySerializer(recent, many=True).data

    def get_enrichment_runs(self, obj):
        # Recent 10 only — matches TS backend
        recent = obj.enrichment_runs.order_by("-started_at")[:10]
        return EnrichmentRunSerializer(recent, many=True).data
