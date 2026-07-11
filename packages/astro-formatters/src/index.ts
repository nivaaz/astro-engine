/**
 * @astro-engine/formatters
 *
 * Format astrology data into multiple output formats.
 * All formatters are pure functions — no side effects.
 */

export { formatAsJSON } from "./json-formatter.js";
export { formatAsMarkdown } from "./markdown-formatter.js";
export { formatAsPlainText } from "./plain-formatter.js";
export { formatAsICS } from "./ics-formatter.js";
export { formatAsHTML } from "./html-formatter.js";
export { formatAsCSV } from "./csv-formatter.js";
export { PLANET_SYMBOLS, ASPECT_SYMBOLS, SIGN_SYMBOLS, PLANET_NAMES, SIGN_NAMES, STREAM_NAMES } from "./symbols.js";

export type {
  Planet,
  ZodiacSign,
  AspectType,
  EventType,
  EventStream,
  Significance,
  ExportFormat,
  PlanetPosition,
  Aspect,
  AstrologyEvent,
  FormatterOptions,
} from "./types.js";

import type { AstrologyEvent, ExportFormat, FormatterOptions } from "./types.js";
import { formatAsJSON } from "./json-formatter.js";
import { formatAsMarkdown } from "./markdown-formatter.js";
import { formatAsPlainText } from "./plain-formatter.js";
import { formatAsICS } from "./ics-formatter.js";
import { formatAsHTML } from "./html-formatter.js";
import { formatAsCSV } from "./csv-formatter.js";

/**
 * Unified formatter — dispatch to the right format by name.
 */
export function formatEvent(
  event: AstrologyEvent,
  format: ExportFormat,
  options?: FormatterOptions,
): string {
  return formatEvents([event], format, options);
}

/**
 * Unified formatter for arrays of events.
 */
export function formatEvents(
  events: readonly AstrologyEvent[],
  format: ExportFormat,
  options?: FormatterOptions,
): string {
  switch (format) {
    case "json":
      return formatAsJSON(events, options);
    case "markdown":
      return formatAsMarkdown(events, options);
    case "plain":
      return formatAsPlainText(events, options);
    case "ics":
      return formatAsICS(events, options);
    case "html":
      return formatAsHTML(events, options);
    case "csv":
      return formatAsCSV(events, options);
    default:
      return formatAsJSON(events, options);
  }
}
