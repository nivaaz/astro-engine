import {
  CurrentSkySchema,
  EventSearchResultSchema,
  HumanDesignTransitResultSchema,
  SaturnReturnResultSchema,
  UtcInstantSchema,
  WholeSignChartSchema,
  type CurrentSky,
  type EventSearchResult,
  type HumanDesignTransitResult,
  type SaturnReturnResult,
  type UtcInstant,
  type WholeSignChart,
} from "@sukara/astro-schema";

export type CanonicalDocument =
  | Readonly<{ kind: "current-sky"; value: CurrentSky }>
  | Readonly<{ kind: "upcoming-events"; value: EventSearchResult }>
  | Readonly<{ kind: "whole-sign-chart"; value: WholeSignChart }>
  | Readonly<{ kind: "saturn-return"; value: SaturnReturnResult }>
  | Readonly<{
      kind: "human-design-transits";
      value: HumanDesignTransitResult;
    }>;

export interface FormatOptions {
  /** Explicit comparison instant. Omit it when freshness is unknown. */
  readonly referenceInstant?: UtcInstant;
}

const DOCUMENT_SCHEMAS = [
  ["current-sky", CurrentSkySchema],
  ["upcoming-events", EventSearchResultSchema],
  ["whole-sign-chart", WholeSignChartSchema],
  ["saturn-return", SaturnReturnResultSchema],
  ["human-design-transits", HumanDesignTransitResultSchema],
] as const;

export function parseCanonicalDocument(input: unknown): CanonicalDocument {
  for (const [kind, schema] of DOCUMENT_SCHEMAS) {
    const parsed = schema.safeParse(input);
    if (parsed.success) {
      return { kind, value: parsed.data } as CanonicalDocument;
    }
  }
  throw new TypeError("Input is not a supported canonical Astro Engine object");
}

export function validateOptions(options: FormatOptions): void {
  if (options.referenceInstant !== undefined) {
    UtcInstantSchema.parse(options.referenceInstant);
  }
}

export function freshness(
  document: CanonicalDocument,
  options: FormatOptions,
): "current" | "stale" | "unknown" {
  const reference = options.referenceInstant;
  if (reference === undefined) return "unknown";
  const { start, end } = document.value.metadata.validFor;
  const timestamp = Date.parse(reference);
  return timestamp >= Date.parse(start) && timestamp < Date.parse(end)
    ? "current"
    : "stale";
}
