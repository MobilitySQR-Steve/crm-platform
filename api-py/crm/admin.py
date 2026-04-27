"""Django Admin registrations — gives the team a free CRUD UI for ops."""

from django.contrib import admin

from .models import Account, Activity, Contact, EnrichmentRun, Opportunity


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ("name", "domain", "hq_country", "industry", "pursuit_status", "source", "owner", "last_enriched_at")
    list_filter = ("pursuit_status", "source", "employee_band", "cross_border_moves_band", "trigger_event")
    search_fields = ("name", "domain", "industry")
    autocomplete_fields = ("owner",)
    readonly_fields = ("created_at", "updated_at", "last_enriched_at", "enrichment_confidence")
    fieldsets = (
        ("Identity", {"fields": ("name", "domain", "website", "linkedin_url", "hq_country", "hq_city", "industry")}),
        ("Fit signals", {"fields": ("employee_band", "cross_border_moves_band", "countries_with_employees", "current_tooling_tags", "trigger_event", "trigger_note")}),
        ("Pursuit", {"fields": ("pursuit_status", "source", "owner")}),
        ("Enrichment", {"fields": ("enrichment_confidence", "last_enriched_at")}),
        ("Timestamps", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "email", "title", "persona", "is_primary", "account")
    list_filter = ("persona", "is_primary")
    search_fields = ("first_name", "last_name", "email", "title", "account__name")
    autocomplete_fields = ("account",)


@admin.register(Opportunity)
class OpportunityAdmin(admin.ModelAdmin):
    list_display = ("name", "account", "stage", "amount_usd", "expected_close_date", "owner")
    list_filter = ("stage",)
    search_fields = ("name", "account__name")
    autocomplete_fields = ("account", "owner")


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ("type", "subject", "account", "user", "occurred_at")
    list_filter = ("type",)
    search_fields = ("subject", "body", "account__name")
    autocomplete_fields = ("account", "opportunity", "user")
    readonly_fields = ("created_at",)


@admin.register(EnrichmentRun)
class EnrichmentRunAdmin(admin.ModelAdmin):
    list_display = ("kind", "status", "account", "started_at", "finished_at", "confidence", "model_used")
    list_filter = ("kind", "status", "model_used")
    search_fields = ("account__name", "error_message")
    autocomplete_fields = ("account",)
    readonly_fields = ("started_at", "finished_at", "fields_updated", "confidence", "model_used", "raw_payload", "error_message")
