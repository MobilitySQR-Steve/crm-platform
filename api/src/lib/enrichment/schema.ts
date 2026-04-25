import { z } from 'zod';
import {
  CrossBorderMovesBand,
  EmployeeBand,
  TriggerEvent,
} from '@prisma/client';

// ── Enrichment output (one account, full enrichment) ─────────────

export const EnrichmentOutput = z.object({
  domain: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
  linkedinUrl: z.string().url().nullable().optional(),
  hqCountry: z.string().length(2).nullable().optional(),
  hqCity: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  employeeBand: z.nativeEnum(EmployeeBand).optional(),
  crossBorderMovesBand: z.nativeEnum(CrossBorderMovesBand).optional(),
  countriesWithEmployees: z.array(z.string().length(2)).optional(),
  currentToolingTags: z.array(z.string().min(1).max(60)).optional(),
  triggerEvent: z.nativeEnum(TriggerEvent).optional(),
  triggerNote: z.string().max(1000).nullable().optional(),
  confidence: z.number().min(0).max(1),
  rationale: z.string().max(2000),
  citations: z.array(z.string().url()).default([]),
});
export type EnrichmentOutput = z.infer<typeof EnrichmentOutput>;

// JSON Schema mirror, hand-written to avoid the zod-to-json-schema dep.
// Anthropic tool input_schema must be the full JSON Schema object.
export const ENRICHMENT_TOOL_SCHEMA = {
  type: 'object',
  properties: {
    domain: { type: ['string', 'null'], description: 'Normalized domain like "notion.so" — no protocol, no path' },
    website: { type: ['string', 'null'], description: 'Full website URL with https://' },
    linkedinUrl: { type: ['string', 'null'], description: 'Company LinkedIn page URL' },
    hqCountry: { type: ['string', 'null'], description: 'HQ country as ISO 3166-1 alpha-2 (e.g. "US", "GB", "DE")' },
    hqCity: { type: ['string', 'null'], description: 'HQ city name' },
    industry: { type: ['string', 'null'], description: 'Industry / sector (e.g. "Software", "FinTech", "Manufacturing")' },
    employeeBand: {
      type: 'string',
      enum: Object.keys(EmployeeBand),
      description: 'Employee count band. Use UNKNOWN if you cannot find evidence.',
    },
    crossBorderMovesBand: {
      type: 'string',
      enum: Object.keys(CrossBorderMovesBand),
      description: 'Cross-border employee moves per year. UNKNOWN if no evidence — DO NOT GUESS.',
    },
    countriesWithEmployees: {
      type: 'array',
      items: { type: 'string', description: 'ISO 3166-1 alpha-2 country code' },
      description: 'List of ISO country codes where the company has employees or offices.',
    },
    currentToolingTags: {
      type: 'array',
      items: { type: 'string' },
      description: 'Mobility / HR / payroll tooling they reportedly use. Examples: "Spreadsheets", "Topia", "Equus", "Deel", "Vialto", "Sirva". Empty if unknown.',
    },
    triggerEvent: {
      type: 'string',
      enum: Object.keys(TriggerEvent),
      description: 'A recent buying signal. Use UNKNOWN if none.',
    },
    triggerNote: { type: ['string', 'null'], description: 'One-sentence description of the trigger with date/source if known.' },
    confidence: { type: 'number', minimum: 0, maximum: 1, description: 'Overall confidence in this enrichment (0=guessed, 1=fully sourced).' },
    rationale: { type: 'string', description: 'Brief explanation of how you arrived at the answer — what sources you weighed.' },
    citations: {
      type: 'array',
      items: { type: 'string' },
      description: 'URLs you used as evidence.',
    },
  },
  required: ['confidence', 'rationale', 'citations'],
} as const;

// ── Sourcing output (a list of new candidate accounts) ───────────

export const SourcingCandidate = z.object({
  name: z.string().min(1).max(200),
  domain: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
  hqCountry: z.string().length(2).nullable().optional(),
  industry: z.string().nullable().optional(),
  employeeBand: z.nativeEnum(EmployeeBand).optional(),
  triggerEvent: z.nativeEnum(TriggerEvent).optional(),
  rationale: z.string().max(500),
});
export type SourcingCandidate = z.infer<typeof SourcingCandidate>;

export const SourcingOutput = z.object({
  candidates: z.array(SourcingCandidate),
});
export type SourcingOutput = z.infer<typeof SourcingOutput>;

export const SOURCING_TOOL_SCHEMA = {
  type: 'object',
  properties: {
    candidates: {
      type: 'array',
      description: 'New ICP-matching companies to add to the pipeline.',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          domain: { type: ['string', 'null'], description: 'Normalized domain like "acme.com"' },
          website: { type: ['string', 'null'] },
          hqCountry: { type: ['string', 'null'], description: 'ISO 3166-1 alpha-2' },
          industry: { type: ['string', 'null'] },
          employeeBand: { type: 'string', enum: Object.keys(EmployeeBand) },
          triggerEvent: { type: 'string', enum: Object.keys(TriggerEvent) },
          rationale: { type: 'string', description: 'One sentence: why this is a good MobilitySQR fit + the buying trigger.' },
        },
        required: ['name', 'rationale'],
      },
    },
  },
  required: ['candidates'],
} as const;
