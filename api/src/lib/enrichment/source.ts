import {
  type Account,
  AccountSource,
  EnrichmentKind,
  EnrichmentStatus,
  PursuitStatus,
} from '@prisma/client';
import { db } from '../../db.js';
import { config } from '../../config.js';
import { logger } from '../logger.js';
import { EnrichmentDisabledError, getAnthropicClient } from './client.js';
import { SOURCING_SYSTEM } from './prompts.js';
import { SOURCING_TOOL_SCHEMA, SourcingOutput } from './schema.js';

const TOOL_NAME = 'submit_candidates';
const MAX_WEB_SEARCHES = 5;
const MAX_EXISTING_TO_SHOW = 200; // capped to keep prompt small + cacheable

export interface SourceOptions {
  /** Number of candidates to ask the model for (1-20). */
  count: number;
  /** Free-form attribution for the audit log (e.g. user id, "cron"). */
  triggeredBy?: string;
  /** Extra instructions appended to the user message (e.g. "focus on Benelux"). */
  hint?: string;
}

export interface SourceResult {
  requested: number;
  returned: number;
  created: Account[];
  skipped: Array<{ name: string; reason: string }>;
}

export async function sourceAccounts(opts: SourceOptions): Promise<SourceResult> {
  const client = getAnthropicClient();
  if (!client) throw new EnrichmentDisabledError();

  const count = Math.max(1, Math.min(20, Math.round(opts.count)));

  const existing = await db.account.findMany({
    select: { name: true, domain: true },
    take: MAX_EXISTING_TO_SHOW,
    orderBy: { createdAt: 'desc' },
  });

  const existingDomains = new Set(
    existing.map((a) => a.domain?.toLowerCase()).filter((d): d is string => !!d),
  );
  const existingNames = new Set(existing.map((a) => a.name.toLowerCase()));

  const existingList = existing.length === 0
    ? '(empty pipeline — first batch)'
    : existing.map((a) => `- ${a.name}${a.domain ? ` (${a.domain})` : ''}`).join('\n');

  const userMessage = `Find ${count} new MobilitySQR ICP-matching companies to add to the pipeline.

These accounts are already in the pipeline — DO NOT suggest any of these:

${existingList}

${opts.hint ? `Additional guidance: ${opts.hint}\n\n` : ''}When done, call ${TOOL_NAME} with ${count} candidates.`;

  logger.info({ count, model: config.ENRICHMENT_MODEL, hint: opts.hint }, 'sourcing starting');
  const response = await client.messages.create({
    model: config.ENRICHMENT_MODEL,
    max_tokens: 8192,
    thinking: { type: 'adaptive' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    output_config: { effort: 'medium' } as any,
    system: [
      { type: 'text', text: SOURCING_SYSTEM, cache_control: { type: 'ephemeral' } },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [
      { type: 'web_search_20260209', name: 'web_search', max_uses: MAX_WEB_SEARCHES },
      {
        name: TOOL_NAME,
        description: 'Submit candidate accounts. Call exactly once after research is complete.',
        input_schema: SOURCING_TOOL_SCHEMA,
      },
    ] as any,
    tool_choice: { type: 'auto' },
    messages: [{ role: 'user', content: userMessage }],
  });

  const toolBlock = response.content.find(
    (b): b is Extract<typeof b, { type: 'tool_use' }> =>
      b.type === 'tool_use' && b.name === TOOL_NAME,
  );
  if (!toolBlock) {
    throw new Error(
      `Model did not call ${TOOL_NAME} (stop_reason=${response.stop_reason}).`,
    );
  }

  const parsed = SourcingOutput.safeParse(toolBlock.input);
  if (!parsed.success) {
    throw new Error(
      `Invalid sourcing output: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
    );
  }

  const created: Account[] = [];
  const skipped: Array<{ name: string; reason: string }> = [];

  for (const candidate of parsed.data.candidates) {
    const domainLower = candidate.domain?.toLowerCase() ?? null;
    const nameLower = candidate.name.toLowerCase();

    if (domainLower && existingDomains.has(domainLower)) {
      skipped.push({ name: candidate.name, reason: 'duplicate_domain' });
      continue;
    }
    if (existingNames.has(nameLower)) {
      skipped.push({ name: candidate.name, reason: 'duplicate_name' });
      continue;
    }

    const account = await db.account.create({
      data: {
        name: candidate.name,
        domain: candidate.domain ?? null,
        website: candidate.website ?? null,
        hqCountry: candidate.hqCountry?.toUpperCase() ?? null,
        industry: candidate.industry ?? null,
        employeeBand: candidate.employeeBand ?? 'UNKNOWN',
        triggerEvent: candidate.triggerEvent ?? 'UNKNOWN',
        triggerNote: candidate.rationale,
        source: AccountSource.ENRICHMENT,
        pursuitStatus: PursuitStatus.NEW,
      },
    });

    await db.enrichmentRun.create({
      data: {
        accountId: account.id,
        kind: EnrichmentKind.SOURCE,
        status: EnrichmentStatus.SUCCESS,
        finishedAt: new Date(),
        modelUsed: config.ENRICHMENT_MODEL,
        rawPayload: {
          rationale: candidate.rationale,
          stopReason: response.stop_reason,
          usage: response.usage as unknown as object,
          triggeredBy: opts.triggeredBy ?? null,
        },
      },
    });

    created.push(account);
    if (domainLower) existingDomains.add(domainLower);
    existingNames.add(nameLower);
  }

  logger.info(
    { requested: count, returned: parsed.data.candidates.length, created: created.length, skipped: skipped.length },
    'sourcing complete',
  );

  return {
    requested: count,
    returned: parsed.data.candidates.length,
    created,
    skipped,
  };
}
