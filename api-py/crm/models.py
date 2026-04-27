"""
CRM data models — direct port of the Prisma schema in api/prisma/schema.prisma.

Conventions:
- snake_case fields and table names (Django default — easier for Python
  team to maintain). The TS-era tables (camelCase columns) are NOT
  reused; Django creates fresh tables alongside or in a fresh DB.
- Enums are TextChoices subclasses (string values that match the TS
  Prisma enums byte-for-byte, so the React frontend's enum constants
  in src/constants/enums.js work without changes).
- ULID-style cuid IDs are dropped in favor of Django's default
  BigAutoField. The frontend should treat IDs as opaque strings either
  way; if URL stability matters during the migration the team can
  switch to UUIDField.
"""

from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone


# ── Enums (string-valued TextChoices match the TS enum strings) ──

class EmployeeBand(models.TextChoices):
    UNKNOWN = "UNKNOWN", "Unknown"
    LT_100 = "LT_100", "< 100"
    B_100_250 = "B_100_250", "100–250"
    B_250_700 = "B_250_700", "250–700"
    B_700_1000 = "B_700_1000", "700–1,000"
    GT_1000 = "GT_1000", "1,000+"


class CrossBorderMovesBand(models.TextChoices):
    UNKNOWN = "UNKNOWN", "Unknown"
    LT_10 = "LT_10", "< 10 / yr"
    B_10_50 = "B_10_50", "10–50 / yr"
    B_50_250 = "B_50_250", "50–250 / yr"
    B_250_500 = "B_250_500", "250–500 / yr"
    GT_500 = "GT_500", "500+ / yr"


class TriggerEvent(models.TextChoices):
    UNKNOWN = "UNKNOWN", "Unknown"
    NEW_MARKET = "NEW_MARKET", "New market opened"
    INTL_HIRING = "INTL_HIRING", "International hiring"
    AUDIT_FINDING = "AUDIT_FINDING", "Audit / compliance finding"
    OUTGREW_TOOL = "OUTGREW_TOOL", "Outgrew current tool"
    RFP = "RFP", "RFP"
    INBOUND = "INBOUND", "Inbound"
    OTHER = "OTHER", "Other"


class AccountSource(models.TextChoices):
    MANUAL = "MANUAL", "Manual"
    ENRICHMENT = "ENRICHMENT", "Auto-enrichment"
    REFERRAL = "REFERRAL", "Referral"
    INBOUND = "INBOUND", "Inbound"
    CONFERENCE = "CONFERENCE", "Conference"
    IMPORT = "IMPORT", "Import"


class PursuitStatus(models.TextChoices):
    NEW = "NEW", "New"
    RESEARCHING = "RESEARCHING", "Researching"
    CONTACTING = "CONTACTING", "Contacting"
    ACTIVE_OPP = "ACTIVE_OPP", "Active opportunity"
    CUSTOMER = "CUSTOMER", "Customer"
    DISQUALIFIED = "DISQUALIFIED", "Disqualified"


class OpportunityStage(models.TextChoices):
    PROSPECT = "PROSPECT", "Prospect"
    DISCOVERY = "DISCOVERY", "Discovery"
    DEMO = "DEMO", "Demo"
    PROPOSAL = "PROPOSAL", "Proposal"
    NEGOTIATION = "NEGOTIATION", "Negotiation"
    CLOSED_WON = "CLOSED_WON", "Closed won"
    CLOSED_LOST = "CLOSED_LOST", "Closed lost"
    ON_HOLD = "ON_HOLD", "On hold"


class ContactPersona(models.TextChoices):
    ECONOMIC_BUYER = "ECONOMIC_BUYER", "Economic Buyer"
    CHAMPION = "CHAMPION", "Champion"
    TECHNICAL = "TECHNICAL", "Technical Evaluator"
    END_USER = "END_USER", "End User"
    EXEC_SPONSOR = "EXEC_SPONSOR", "Executive Sponsor"
    OTHER = "OTHER", "Other"


class ActivityType(models.TextChoices):
    CALL = "CALL", "Call"
    EMAIL = "EMAIL", "Email"
    MEETING = "MEETING", "Meeting"
    NOTE = "NOTE", "Note"
    SYSTEM = "SYSTEM", "System"


class EnrichmentKind(models.TextChoices):
    ENRICH = "ENRICH", "Enrich existing"
    SOURCE = "SOURCE", "Source new"


class EnrichmentStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    RUNNING = "RUNNING", "Running"
    SUCCESS = "SUCCESS", "Success"
    PARTIAL = "PARTIAL", "Partial"
    FAILED = "FAILED", "Failed"


# ── Models ───────────────────────────────────────────────────────


class Account(models.Model):
    # Identity
    name = models.CharField(max_length=200)
    domain = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    website = models.URLField(max_length=500, blank=True, null=True)
    linkedin_url = models.URLField(max_length=500, blank=True, null=True)
    hq_country = models.CharField(max_length=2, blank=True, null=True)  # ISO 3166-1 alpha-2
    hq_city = models.CharField(max_length=120, blank=True, null=True)
    industry = models.CharField(max_length=120, blank=True, null=True)

    # Fit signals
    employee_band = models.CharField(
        max_length=12, choices=EmployeeBand.choices, default=EmployeeBand.UNKNOWN,
    )
    cross_border_moves_band = models.CharField(
        max_length=12, choices=CrossBorderMovesBand.choices, default=CrossBorderMovesBand.UNKNOWN,
    )
    countries_with_employees = models.JSONField(default=list)  # list[str] of ISO codes
    current_tooling_tags = models.JSONField(default=list)  # list[str]
    trigger_event = models.CharField(
        max_length=20, choices=TriggerEvent.choices, default=TriggerEvent.UNKNOWN,
    )
    trigger_note = models.TextField(blank=True, null=True)

    # Pursuit
    pursuit_status = models.CharField(
        max_length=16, choices=PursuitStatus.choices, default=PursuitStatus.NEW, db_index=True,
    )
    source = models.CharField(
        max_length=12, choices=AccountSource.choices, default=AccountSource.MANUAL, db_index=True,
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_accounts",
    )

    # Enrichment audit
    enrichment_confidence = models.FloatField(blank=True, null=True)
    last_enriched_at = models.DateTimeField(blank=True, null=True, db_index=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return self.name


class Contact(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name="contacts")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True, db_index=True)
    phone = models.CharField(max_length=40, blank=True, null=True)
    title = models.CharField(max_length=200, blank=True, null=True)
    linkedin_url = models.URLField(max_length=500, blank=True, null=True)
    persona = models.CharField(
        max_length=16, choices=ContactPersona.choices, default=ContactPersona.OTHER,
    )
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_primary", "last_name"]

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name} ({self.account.name})"

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()


class Opportunity(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name="opportunities")
    name = models.CharField(max_length=200)
    stage = models.CharField(
        max_length=14, choices=OpportunityStage.choices, default=OpportunityStage.PROSPECT, db_index=True,
    )
    amount_usd = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    expected_close_date = models.DateField(blank=True, null=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_opportunities",
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        verbose_name_plural = "opportunities"

    def __str__(self) -> str:
        return f"{self.name} ({self.account.name})"


class Activity(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name="activities")
    opportunity = models.ForeignKey(
        Opportunity, on_delete=models.SET_NULL, null=True, blank=True, related_name="activities",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="activities",
    )
    type = models.CharField(max_length=8, choices=ActivityType.choices)
    subject = models.CharField(max_length=200)
    body = models.TextField(blank=True, null=True)
    occurred_at = models.DateTimeField(default=timezone.now, db_index=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-occurred_at"]
        verbose_name_plural = "activities"

    def __str__(self) -> str:
        return f"{self.type}: {self.subject}"


class EnrichmentRun(models.Model):
    account = models.ForeignKey(
        Account, on_delete=models.SET_NULL, null=True, blank=True, related_name="enrichment_runs",
    )
    kind = models.CharField(max_length=8, choices=EnrichmentKind.choices, db_index=True)
    status = models.CharField(max_length=8, choices=EnrichmentStatus.choices, default=EnrichmentStatus.PENDING)
    started_at = models.DateTimeField(default=timezone.now, db_index=True)
    finished_at = models.DateTimeField(blank=True, null=True)
    fields_updated = models.JSONField(default=list)  # list[str]
    confidence = models.FloatField(blank=True, null=True)
    model_used = models.CharField(max_length=80, blank=True, null=True)
    raw_payload = models.JSONField(blank=True, null=True)  # rationale, citations, usage, stop_reason
    error_message = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self) -> str:
        target = self.account.name if self.account else "(no account)"
        return f"{self.kind} {self.status} — {target}"

    @property
    def duration_seconds(self) -> Decimal | None:
        if not self.finished_at:
            return None
        return Decimal((self.finished_at - self.started_at).total_seconds())
