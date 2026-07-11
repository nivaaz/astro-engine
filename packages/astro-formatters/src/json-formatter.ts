/**
 * JSON Formatter — pretty-printed JSON with metadata.
 */

import type { AstrologyEvent, FormatterOptions } from "./types.js";

interface JSONOutput {
  readonly metadata: {
    readonly count: number;
    readonly generatedAt: string;
    readonly format: "json";
  };
  readonly events: readonly AstrologyEvent[];
}

/**
 * Format astrology events as pretty-printed JSON.
 *
 * @param events - Array of AstrologyEvent objects
 * @param options - Formatting options (indentation level)
 * @returns JSON string with metadata wrapper
 */
export function formatAsJSON(
  events: readonly AstrologyEvent[],
  options?: FormatterOptions,
): string {
  const indent = options?.indent ?? 2;

  const output: JSONOutput = {
    metadata: {
      count: events.length,
      generatedAt: new Date().toISOString(),
      format: "json",
    },
    events,
  };

  return JSON.stringify(output, null, indent);
}