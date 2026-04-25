import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config.js';

let cached: Anthropic | null = null;

/**
 * Lazy singleton — only constructed when an enrichment endpoint is called.
 * Returns null if ANTHROPIC_API_KEY isn't set; callers should 503.
 */
export function getAnthropicClient(): Anthropic | null {
  if (!config.ANTHROPIC_API_KEY) return null;
  if (!cached) {
    cached = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
  }
  return cached;
}

export class EnrichmentDisabledError extends Error {
  constructor() {
    super('Enrichment is disabled — ANTHROPIC_API_KEY not set');
    this.name = 'EnrichmentDisabledError';
  }
}
