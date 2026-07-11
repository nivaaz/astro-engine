import type { FormatOptions } from "./document.js";
import {
  freshness,
  parseCanonicalDocument,
  validateOptions,
} from "./document.js";

export interface CanonicalJsonEnvelope {
  readonly kind: string;
  readonly freshness: "current" | "stale" | "unknown";
  readonly data: unknown;
}

function canonicalize(value: unknown): unknown {
  if (typeof value === "number") return Object.is(value, -0) ? 0 : value;
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
}

export function formatJson(
  input: unknown,
  options: FormatOptions = {},
): string {
  validateOptions(options);
  const document = parseCanonicalDocument(input);
  const envelope: CanonicalJsonEnvelope = {
    kind: document.kind,
    freshness: freshness(document, options),
    data: document.value,
  };
  return `${JSON.stringify(canonicalize(envelope), null, 2)}\n`;
}
