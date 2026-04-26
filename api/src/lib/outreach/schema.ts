import { z } from 'zod';

export const DraftOutput = z.object({
  subject: z.string().min(1).max(80),
  body: z.string().min(20).max(2000),
  callToAction: z.string().min(1).max(200),
  rationale: z.string().min(1).max(500),
});
export type DraftOutput = z.infer<typeof DraftOutput>;

export const DRAFT_TOOL_SCHEMA = {
  type: 'object',
  properties: {
    subject: {
      type: 'string',
      description: 'Email subject line. Under 60 characters. Not clickbait, not generic.',
    },
    body: {
      type: 'string',
      description:
        'Full email body, including greeting and sign-off. 3 short paragraphs, under 150 words total. Plain text — no markdown, no HTML.',
    },
    callToAction: {
      type: 'string',
      description:
        'The specific ask in the closing paragraph (e.g. "15-min call next Tuesday to walk through your H-1B renewal stack"). Used for tracking what we asked for.',
    },
    rationale: {
      type: 'string',
      description:
        '1-2 sentence explanation of WHY you chose this hook angle. Helps the seller adjust if it lands wrong.',
    },
  },
  required: ['subject', 'body', 'callToAction', 'rationale'],
} as const;
