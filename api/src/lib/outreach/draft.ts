import { type Account, type Contact, type User } from '@prisma/client';
import { db } from '../../db.js';
import { config } from '../../config.js';
import { logger } from '../logger.js';
import { getAnthropicClient } from '../enrichment/client.js';
import {
  EMPLOYEE_BAND_LABELS,
  MOVES_BAND_LABELS,
  TRIGGER_EVENT_LABELS,
} from './labels.js';
import { OUTREACH_SYSTEM } from './prompts.js';
import { DRAFT_TOOL_SCHEMA, DraftOutput } from './schema.js';

const TOOL_NAME = 'submit_draft';

export class OutreachDisabledError extends Error {
  constructor() {
    super('Outreach drafting is disabled — ANTHROPIC_API_KEY not set');
    this.name = 'OutreachDisabledError';
  }
}

export class NoTriggerNoteError extends Error {
  constructor() {
    super(
      'Account has no trigger note — run enrichment first or add one manually before drafting outreach.',
    );
    this.name = 'NoTriggerNoteError';
  }
}

export interface DraftOptions {
  triggeredBy?: string;
}

export interface DraftResult extends DraftOutput {
  modelUsed: string;
  /** Sender name as it appears in the body sign-off — for the UI to display. */
  sender: { firstName: string; lastName: string; email: string };
  /** Recipient name if a primary contact existed, null otherwise. */
  recipient: { firstName: string; lastName: string; title: string | null } | null;
}

export async function draftOutreach(
  accountId: string,
  _opts: DraftOptions = {},
): Promise<DraftResult> {
  const client = getAnthropicClient();
  if (!client) throw new OutreachDisabledError();

  const account = await db.account.findUnique({
    where: { id: accountId },
    include: {
      owner: true,
      contacts: { where: { isPrimary: true }, take: 1 },
    },
  });
  if (!account) throw new Error(`Account ${accountId} not found`);
  if (!account.triggerNote || !account.triggerNote.trim()) {
    throw new NoTriggerNoteError();
  }

  const sender = account.owner;
  if (!sender) {
    throw new Error('Account has no owner — assign one before drafting outreach.');
  }

  const recipient = account.contacts[0] ?? null;
  const userMessage = buildUserMessage(account, sender, recipient);

  logger.info({ accountId, model: config.ENRICHMENT_MODEL }, 'drafting outreach');
  const response = await client.messages.create({
    model: config.ENRICHMENT_MODEL,
    max_tokens: 2048,
    thinking: { type: 'adaptive' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    output_config: { effort: 'medium' } as any,
    system: [
      { type: 'text', text: OUTREACH_SYSTEM, cache_control: { type: 'ephemeral' } },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [
      {
        name: TOOL_NAME,
        description: 'Submit the drafted outreach email. Call exactly once.',
        input_schema: DRAFT_TOOL_SCHEMA,
      },
    ] as any,
    // Adaptive thinking is incompatible with both {type:'tool', name} and
    // {type:'any'} — the API treats both as "forcing tool use". Only
    // 'auto' is allowed alongside thinking. The system prompt explicitly
    // instructs the model to call submit_draft, which it reliably does.
    tool_choice: { type: 'auto' },
    messages: [{ role: 'user', content: userMessage }],
  });

  const toolBlock = response.content.find(
    (b): b is Extract<typeof b, { type: 'tool_use' }> =>
      b.type === 'tool_use' && b.name === TOOL_NAME,
  );
  if (!toolBlock) {
    throw new Error(`Model did not call ${TOOL_NAME}; stop_reason=${response.stop_reason}`);
  }

  const parsed = DraftOutput.safeParse(toolBlock.input);
  if (!parsed.success) {
    throw new Error(
      `Invalid draft output: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
    );
  }

  return {
    ...parsed.data,
    modelUsed: config.ENRICHMENT_MODEL,
    sender: { firstName: sender.firstName, lastName: sender.lastName, email: sender.email },
    recipient: recipient
      ? { firstName: recipient.firstName, lastName: recipient.lastName, title: recipient.title }
      : null,
  };
}

function buildUserMessage(
  account: Account,
  sender: User,
  recipient: Contact | null,
): string {
  const lines: string[] = [];
  lines.push(`Account: ${account.name}`);
  if (account.industry) lines.push(`Industry: ${account.industry}`);
  if (account.hqCity || account.hqCountry) {
    lines.push(`HQ: ${[account.hqCity, account.hqCountry].filter(Boolean).join(', ')}`);
  }
  lines.push(`Employee band: ${EMPLOYEE_BAND_LABELS[account.employeeBand]}`);
  lines.push(`Cross-border moves: ${MOVES_BAND_LABELS[account.crossBorderMovesBand]}`);
  if (account.countriesWithEmployees.length > 0) {
    lines.push(`Countries with employees: ${account.countriesWithEmployees.join(', ')}`);
  }
  if (account.currentToolingTags.length > 0) {
    lines.push(`Current tooling: ${account.currentToolingTags.join(', ')}`);
  }
  lines.push('');
  lines.push(`Trigger event: ${TRIGGER_EVENT_LABELS[account.triggerEvent]}`);
  lines.push(`Trigger note (the hook — anchor your opening on this):`);
  lines.push(`  ${account.triggerNote}`);
  lines.push('');
  if (recipient) {
    lines.push(
      `Primary contact: ${recipient.firstName} ${recipient.lastName}` +
        (recipient.title ? `, ${recipient.title}` : ''),
    );
  } else {
    lines.push(`No specific contact — open with "Hi there".`);
  }
  lines.push('');
  lines.push(`Sender (sign off as): ${sender.firstName} ${sender.lastName}`);
  lines.push(`Sender email: ${sender.email}`);
  lines.push('');
  lines.push(`Now call ${TOOL_NAME} with the drafted email.`);

  return lines.join('\n');
}
