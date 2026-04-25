import {
  type Account,
  CrossBorderMovesBand,
  EmployeeBand,
  EnrichmentKind,
  EnrichmentStatus,
  TriggerEvent,
} from '@prisma/client';
import { db } from '../../db.js';
import { config } from '../../config.js';
import { logger } from '../logger.js';
import { EnrichmentDisabledError, getAnthropicClient } from './client.js';
import { ENRICHMENT_SYSTEM } from './prompts.js';
import { ENRICHMENT_TOOL_SCHEMA, EnrichmentOutput } from './schema.js';

const TOOL_NAME = 'submit_enrichment';
const RECENT_THRESHOLD_HOURS = 24;
const MAX_WEB_SEARCHES = 5;

export interface EnrichOptions {
  /** Re-enrich even if `lastEnrichedAt` is within the freshness window. */
  force?: boolean;
  /** Free-form attribution for the audit log (e.g. user id, "cron"). */
  triggeredBy?: string;
}

export interface EnrichResult {
  runId: string;
  status: EnrichmentStatus;
  fieldsUpdated: string[];
  confidence: number;
  rationale: string;
  citations: string[];
  skipped?: false;
}

export interface EnrichSkipped {
  skipped: true;
  reason: string;
}

export async function enrichAccount(
  accountId: string,
  opts: EnrichOptions = {},
): Promise<EnrichResult | EnrichSkipped> {
  const client = getAnthropicClient();
  if (!client) throw new EnrichmentDisabledError();

  const account = await db.account.findUnique({ where: { id: accountId } });
  if (!account) throw new Error(`Account ${accountId} not found`);

  // Idempotency — skip if recently enriched (unless force=true)
  if (!opts.force && account.lastEnrichedAt) {
    const hoursSince = (Date.now() - account.lastEnrichedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince < RECENT_THRESHOLD_HOURS) {
      return {
        skipped: true,
        reason: `enriched ${Math.round(hoursSince)}h ago; pass force=true to re-enrich`,
      };
    }
  }

  // Open audit row
  const run = await db.enrichmentRun.create({
    data: {
      accountId,
      kind: EnrichmentKind.ENRICH,
      status: EnrichmentStatus.RUNNING,
      modelUsed: config.ENRICHMENT_MODEL,
    },
  });

  try {
    const userMessage = buildUserMessage(account);

    logger.info({ accountId, runId: run.id, model: config.ENRICHMENT_MODEL }, 'enrichment starting');
    const response = await client.messages.create({
      model: config.ENRICHMENT_MODEL,
      max_tokens: 8192,
      thinking: { type: 'adaptive' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      output_config: { effort: 'medium' } as any,
      system: [
        { type: 'text', text: ENRICHMENT_SYSTEM, cache_control: { type: 'ephemeral' } },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [
        { type: 'web_search_20260209', name: 'web_search', max_uses: MAX_WEB_SEARCHES },
        {
          name: TOOL_NAME,
          description: 'Submit the enriched account profile. Call exactly once after research is complete.',
          input_schema: ENRICHMENT_TOOL_SCHEMA,
        },
      ] as any,
      tool_choice: { type: 'auto' },
      messages: [{ role: 'user', content: userMessage }],
    });

    // Find the submit_enrichment tool call
    const toolBlock = response.content.find(
      (b): b is Extract<typeof b, { type: 'tool_use' }> =>
        b.type === 'tool_use' && b.name === TOOL_NAME,
    );
    if (!toolBlock) {
      throw new Error(
        `Model did not call ${TOOL_NAME} (stop_reason=${response.stop_reason}). ` +
        'It may have run out of tokens, refused, or hit the web_search cap.',
      );
    }

    const parsed = EnrichmentOutput.safeParse(toolBlock.input);
    if (!parsed.success) {
      throw new Error(
        `Invalid enrichment output from model: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
      );
    }

    // Conservative merge — never overwrite manually-set fields
    const { updates, fieldsUpdated } = mergeEnrichment(account, parsed.data);

    await db.account.update({
      where: { id: accountId },
      data: {
        ...updates,
        lastEnrichedAt: new Date(),
        enrichmentConfidence: parsed.data.confidence,
      },
    });

    const status = fieldsUpdated.length === 0 ? EnrichmentStatus.PARTIAL : EnrichmentStatus.SUCCESS;

    await db.enrichmentRun.update({
      where: { id: run.id },
      data: {
        status,
        finishedAt: new Date(),
        fieldsUpdated,
        confidence: parsed.data.confidence,
        rawPayload: {
          rationale: parsed.data.rationale,
          citations: parsed.data.citations,
          stopReason: response.stop_reason,
          usage: response.usage as unknown as object,
          triggeredBy: opts.triggeredBy ?? null,
        },
      },
    });

    logger.info(
      { accountId, runId: run.id, fieldsUpdated, confidence: parsed.data.confidence, status },
      'enrichment complete',
    );

    return {
      runId: run.id,
      status,
      fieldsUpdated,
      confidence: parsed.data.confidence,
      rationale: parsed.data.rationale,
      citations: parsed.data.citations,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error({ accountId, runId: run.id, err: errorMessage }, 'enrichment failed');
    await db.enrichmentRun
      .update({
        where: { id: run.id },
        data: {
          status: EnrichmentStatus.FAILED,
          finishedAt: new Date(),
          errorMessage,
        },
      })
      .catch(() => {});
    throw err;
  }
}

// ── Helpers ───────────────────────────────────────────────────────

function buildUserMessage(account: Account): string {
  const known: string[] = [];
  known.push(`Name: ${account.name}`);
  if (account.domain) known.push(`Domain: ${account.domain}`);
  if (account.website) known.push(`Website: ${account.website}`);
  if (account.hqCountry) known.push(`HQ country: ${account.hqCountry}`);
  if (account.hqCity) known.push(`HQ city: ${account.hqCity}`);
  if (account.industry) known.push(`Industry: ${account.industry}`);
  if (account.employeeBand !== EmployeeBand.UNKNOWN) {
    known.push(`Employee band: ${account.employeeBand} (already set — verify, do not overwrite)`);
  }
  if (account.crossBorderMovesBand !== CrossBorderMovesBand.UNKNOWN) {
    known.push(`Cross-border moves: ${account.crossBorderMovesBand} (already set)`);
  }
  if (account.countriesWithEmployees.length > 0) {
    known.push(`Countries with employees: ${account.countriesWithEmployees.join(', ')} (already set)`);
  }
  if (account.currentToolingTags.length > 0) {
    known.push(`Current tooling: ${account.currentToolingTags.join(', ')} (already set)`);
  }
  if (account.triggerEvent !== TriggerEvent.UNKNOWN) {
    known.push(`Trigger event: ${account.triggerEvent} (already set)`);
  }

  return `Research and enrich this account. Existing data we already have:

${known.join('\n')}

Fill in any blanks you can find evidence for. Do not overwrite the existing fields. Focus on:
- Mobility-specific signals (cross-border moves band, countries with employees, current tooling)
- Recent buying triggers (news in the last 6 months)
- Confirming the basics (industry, HQ city, official website, LinkedIn)

When done, call ${TOOL_NAME}.`;
}

interface MergeResult {
  updates: Record<string, unknown>;
  fieldsUpdated: string[];
}

function mergeEnrichment(existing: Account, enriched: EnrichmentOutput): MergeResult {
  const updates: Record<string, unknown> = {};
  const fieldsUpdated: string[] = [];

  // Nullable string fields — fill only when empty
  const stringFields = [
    'domain', 'website', 'linkedinUrl', 'hqCountry', 'hqCity', 'industry', 'triggerNote',
  ] as const;
  for (const field of stringFields) {
    if (!existing[field] && enriched[field]) {
      updates[field] = enriched[field];
      fieldsUpdated.push(field);
    }
  }

  // Enum fields — fill only when UNKNOWN
  if (existing.employeeBand === EmployeeBand.UNKNOWN
      && enriched.employeeBand && enriched.employeeBand !== EmployeeBand.UNKNOWN) {
    updates.employeeBand = enriched.employeeBand;
    fieldsUpdated.push('employeeBand');
  }
  if (existing.crossBorderMovesBand === CrossBorderMovesBand.UNKNOWN
      && enriched.crossBorderMovesBand && enriched.crossBorderMovesBand !== CrossBorderMovesBand.UNKNOWN) {
    updates.crossBorderMovesBand = enriched.crossBorderMovesBand;
    fieldsUpdated.push('crossBorderMovesBand');
  }
  if (existing.triggerEvent === TriggerEvent.UNKNOWN
      && enriched.triggerEvent && enriched.triggerEvent !== TriggerEvent.UNKNOWN) {
    updates.triggerEvent = enriched.triggerEvent;
    fieldsUpdated.push('triggerEvent');
  }

  // Array fields — fill only when empty (no merge to avoid duplicates / stale entries)
  if (existing.countriesWithEmployees.length === 0
      && enriched.countriesWithEmployees && enriched.countriesWithEmployees.length > 0) {
    updates.countriesWithEmployees = enriched.countriesWithEmployees.map((s) => s.toUpperCase());
    fieldsUpdated.push('countriesWithEmployees');
  }
  if (existing.currentToolingTags.length === 0
      && enriched.currentToolingTags && enriched.currentToolingTags.length > 0) {
    updates.currentToolingTags = enriched.currentToolingTags;
    fieldsUpdated.push('currentToolingTags');
  }

  return { updates, fieldsUpdated };
}
