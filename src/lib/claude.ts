import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

export function claude(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY');
  _client = new Anthropic({ apiKey });
  return _client;
}

export const CLAUDE_MODEL =
  process.env.ANTHROPIC_MODEL || 'claude-opus-4-7';

/**
 * Extract the first balanced JSON object/array from a string.
 * Tolerant to surrounding prose and ```json fences.
 */
export function extractJson<T = unknown>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;

  const start = candidate.search(/[\[{]/);
  if (start < 0) throw new Error('No JSON found in model output');

  let depth = 0;
  let inStr = false;
  let esc = false;
  let openCh = candidate[start];
  let closeCh = openCh === '{' ? '}' : ']';
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === openCh) depth++;
    else if (ch === closeCh) {
      depth--;
      if (depth === 0) {
        const raw = candidate.slice(start, i + 1);
        return JSON.parse(raw) as T;
      }
    }
  }
  throw new Error('Unbalanced JSON in model output');
}
