// Morning cron job — re-enrich N oldest accounts + source N new ones.
//
// Usage:
//   npm run -w api morning:dry              # log the plan, don't call Claude
//   npm run -w api morning:run              # full run with default counts (5+5)
//   MORNING_CRON_REENRICH=10 MORNING_CRON_SOURCE=10 npm run -w api morning:run
//
// Counts default to 5+5 to keep daily cost ~$1.50. Override via env vars
// when you want to ramp up. In Step 6 this is wired to Render's cron.

import { db } from '../src/db.js';
import { logger } from '../src/lib/logger.js';
import { enrichAccount, sourceAccounts } from '../src/lib/enrichment/index.js';

interface MorningCronOptions {
  reEnrichCount: number;
  sourceCount: number;
  enrichNew: boolean;
  dryRun: boolean;
}

interface CronStats {
  reEnrichRequested: number;
  reEnrichSucceeded: number;
  reEnrichSkipped: number;
  reEnrichFailed: number;
  sourceCreated: number;
  sourceSkipped: number;
  enrichNewSucceeded: number;
  enrichNewFailed: number;
  elapsedSeconds: number;
}

async function morningCron(opts: MorningCronOptions): Promise<CronStats> {
  const startedAt = Date.now();
  logger.info({ opts }, 'morning cron starting');

  const stats: CronStats = {
    reEnrichRequested: 0,
    reEnrichSucceeded: 0,
    reEnrichSkipped: 0,
    reEnrichFailed: 0,
    sourceCreated: 0,
    sourceSkipped: 0,
    enrichNewSucceeded: 0,
    enrichNewFailed: 0,
    elapsedSeconds: 0,
  };

  // ── Phase 1: re-enrich the N oldest accounts ──────────────────
  // nulls:'first' means never-enriched accounts get priority.
  if (opts.reEnrichCount > 0) {
    const candidates = await db.account.findMany({
      select: { id: true, name: true, lastEnrichedAt: true },
      orderBy: [{ lastEnrichedAt: { sort: 'asc', nulls: 'first' } }],
      take: opts.reEnrichCount,
    });
    logger.info(
      { count: candidates.length, names: candidates.map((c) => c.name) },
      'phase 1: re-enrichment',
    );
    for (const acct of candidates) {
      stats.reEnrichRequested++;
      if (opts.dryRun) {
        logger.info(
          { accountId: acct.id, name: acct.name, lastEnrichedAt: acct.lastEnrichedAt },
          '[dry-run] would re-enrich',
        );
        continue;
      }
      try {
        const result = await enrichAccount(acct.id, { triggeredBy: 'cron' });
        if (result.skipped) {
          stats.reEnrichSkipped++;
          logger.info({ name: acct.name, reason: result.reason }, 'skipped');
        } else {
          stats.reEnrichSucceeded++;
          logger.info(
            { name: acct.name, fieldsUpdated: result.fieldsUpdated, confidence: result.confidence },
            'enriched',
          );
        }
      } catch (err) {
        stats.reEnrichFailed++;
        logger.error(
          { name: acct.name, err: err instanceof Error ? err.message : String(err) },
          're-enrichment failed',
        );
      }
    }
  }

  // ── Phase 2: source N new accounts ────────────────────────────
  let newAccountIds: string[] = [];
  if (opts.sourceCount > 0) {
    logger.info({ count: opts.sourceCount }, 'phase 2: sourcing');
    if (opts.dryRun) {
      logger.info({ count: opts.sourceCount }, '[dry-run] would source new accounts');
    } else {
      try {
        const result = await sourceAccounts({ count: opts.sourceCount, triggeredBy: 'cron' });
        stats.sourceCreated = result.created.length;
        stats.sourceSkipped = result.skipped.length;
        newAccountIds = result.created.map((a) => a.id);
        logger.info(
          { created: result.created.length, skipped: result.skipped.length, names: result.created.map((a) => a.name) },
          'sourcing complete',
        );
      } catch (err) {
        logger.error(
          { err: err instanceof Error ? err.message : String(err) },
          'sourcing failed',
        );
      }
    }
  }

  // ── Phase 3: enrich the just-sourced accounts ─────────────────
  if (opts.enrichNew && newAccountIds.length > 0) {
    logger.info({ count: newAccountIds.length }, 'phase 3: enriching new accounts');
    for (const id of newAccountIds) {
      try {
        await enrichAccount(id, { force: true, triggeredBy: 'cron' });
        stats.enrichNewSucceeded++;
      } catch (err) {
        stats.enrichNewFailed++;
        logger.error(
          { accountId: id, err: err instanceof Error ? err.message : String(err) },
          'new-account enrichment failed',
        );
      }
    }
  }

  stats.elapsedSeconds = Math.round((Date.now() - startedAt) / 1000);
  return stats;
}

// ── CLI entry point ─────────────────────────────────────────────

const args = new Set(process.argv.slice(2));
const isDryRun = args.has('--dry-run');

const reEnrichCount = parseInt(process.env.MORNING_CRON_REENRICH ?? '5', 10);
const sourceCount = parseInt(process.env.MORNING_CRON_SOURCE ?? '5', 10);
const enrichNew = (process.env.MORNING_CRON_ENRICH_NEW ?? 'true').toLowerCase() !== 'false';

morningCron({ reEnrichCount, sourceCount, enrichNew, dryRun: isDryRun })
  .then((stats) => {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━ Morning Cron Summary ━━━━━━━━━━━━━━━━');
    console.table(stats);
    process.exit(0);
  })
  .catch((err) => {
    logger.fatal({ err: err instanceof Error ? err.message : err }, 'morning cron crashed');
    process.exit(1);
  })
  .finally(() => {
    void db.$disconnect();
  });
