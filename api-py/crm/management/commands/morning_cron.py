"""
Morning cron job — re-enrich N oldest accounts + source N new ones.

Run manually:
    python manage.py morning_cron                # full run with defaults
    python manage.py morning_cron --dry-run      # log the plan, no Claude calls
    REENRICH=10 SOURCE=10 python manage.py morning_cron

In production, schedule via AWS EventBridge → ECS RunTask (or Lambda
that invokes the management command via the Django app entry point).
See api-py/DEPLOY-AWS.md for the recipe.
"""

from __future__ import annotations

import logging
import os
import time
from dataclasses import asdict, dataclass

from django.core.management.base import BaseCommand
from django.db.models import F

from ai.enrichment import enrich_account
from ai.sourcing import source_accounts
from crm.models import Account

logger = logging.getLogger(__name__)


@dataclass
class CronStats:
    re_enrich_requested: int = 0
    re_enrich_succeeded: int = 0
    re_enrich_skipped: int = 0
    re_enrich_failed: int = 0
    source_created: int = 0
    source_skipped: int = 0
    enrich_new_succeeded: int = 0
    enrich_new_failed: int = 0
    elapsed_seconds: int = 0


class Command(BaseCommand):
    help = "Re-enrich oldest N accounts + source N new ICP-matching accounts."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Log the plan without calling Claude. Free.",
        )
        parser.add_argument(
            "--reenrich",
            type=int,
            default=int(os.getenv("MORNING_CRON_REENRICH", "5")),
            help="Number of oldest accounts to re-enrich (default 5).",
        )
        parser.add_argument(
            "--source",
            type=int,
            default=int(os.getenv("MORNING_CRON_SOURCE", "5")),
            help="Number of new accounts to source (default 5).",
        )
        parser.add_argument(
            "--no-enrich-new",
            dest="enrich_new",
            action="store_false",
            default=os.getenv("MORNING_CRON_ENRICH_NEW", "true").lower() != "false",
            help="Skip enriching the just-sourced accounts.",
        )

    def handle(self, *args, **opts):
        dry_run = opts["dry_run"]
        re_enrich_count = opts["reenrich"]
        source_count = opts["source"]
        enrich_new = opts["enrich_new"]

        started = time.monotonic()
        stats = CronStats()
        self.stdout.write(self.style.NOTICE(
            f"morning cron starting (dry_run={dry_run}, "
            f"reenrich={re_enrich_count}, source={source_count}, enrich_new={enrich_new})"
        ))

        # ── Phase 1: re-enrich oldest accounts ────────────────────
        if re_enrich_count > 0:
            # nulls first via Django's nulls_first ordering helper.
            candidates = list(
                Account.objects.order_by(F("last_enriched_at").asc(nulls_first=True))[:re_enrich_count]
            )
            self.stdout.write(f"phase 1: re-enrichment ({len(candidates)} candidates)")
            for acct in candidates:
                stats.re_enrich_requested += 1
                if dry_run:
                    self.stdout.write(
                        f"  [dry-run] would re-enrich {acct.name} "
                        f"(last_enriched={acct.last_enriched_at})"
                    )
                    continue
                try:
                    result = enrich_account(acct.id, triggered_by="cron")
                    if result.skipped:
                        stats.re_enrich_skipped += 1
                        self.stdout.write(f"  skipped {acct.name}: {result.reason}")
                    else:
                        stats.re_enrich_succeeded += 1
                        self.stdout.write(self.style.SUCCESS(
                            f"  enriched {acct.name}: fields={result.fields_updated} "
                            f"conf={result.confidence:.2f}"
                        ))
                except Exception as exc:
                    stats.re_enrich_failed += 1
                    self.stderr.write(self.style.ERROR(f"  failed {acct.name}: {exc}"))

        # ── Phase 2: source N new accounts ───────────────────────
        new_account_ids: list[int] = []
        if source_count > 0:
            self.stdout.write(f"phase 2: sourcing ({source_count} requested)")
            if dry_run:
                self.stdout.write(f"  [dry-run] would source {source_count} new accounts")
            else:
                try:
                    src = source_accounts(count=source_count, triggered_by="cron")
                    stats.source_created = len(src.created)
                    stats.source_skipped = len(src.skipped)
                    new_account_ids = [a.id for a in src.created]
                    self.stdout.write(self.style.SUCCESS(
                        f"  created {len(src.created)} ({', '.join(a.name for a in src.created)}) "
                        f"/ skipped {len(src.skipped)}"
                    ))
                except Exception as exc:
                    self.stderr.write(self.style.ERROR(f"  sourcing failed: {exc}"))

        # ── Phase 3: enrich the just-sourced accounts ────────────
        if enrich_new and new_account_ids:
            self.stdout.write(f"phase 3: enriching {len(new_account_ids)} new accounts")
            for acct_id in new_account_ids:
                try:
                    enrich_account(acct_id, force=True, triggered_by="cron")
                    stats.enrich_new_succeeded += 1
                except Exception as exc:
                    stats.enrich_new_failed += 1
                    self.stderr.write(self.style.ERROR(
                        f"  new-account enrichment failed (id={acct_id}): {exc}"
                    ))

        stats.elapsed_seconds = int(time.monotonic() - started)

        # ── Summary ──────────────────────────────────────────────
        self.stdout.write("")
        self.stdout.write(self.style.NOTICE("━━━ Morning Cron Summary ━━━"))
        for key, value in asdict(stats).items():
            self.stdout.write(f"  {key:<24}{value}")
