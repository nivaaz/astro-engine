/**
 * CSV formatter — spreadsheet-friendly event export.
 */

import type { AstrologyEvent, FormatterOptions } from "./types.js";

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const CSV_HEADERS = [
  "id",
  "type",
  "stream",
  "significance",
  "exactAtUtc",
  "bodies",
  "aspect_type",
  "aspect_orb",
  "aspect_phase",
  "sign",
  "degree",
  "isRetrograde",
  "passNumber",
  "totalPasses",
  "ingressTo",
  "station",
  "lunation",
];

function eventToRow(event: AstrologyEvent): string {
  const values = [
    event.id,
    event.type,
    event.stream,
    event.significance,
    event.exactAtUtc,
    event.bodies.join(";"),
    event.aspect?.type ?? "",
    event.aspect?.orb.toFixed(2) ?? "",
    event.aspect?.phase ?? "",
    event.sign,
    event.degree.toFixed(2),
    String(event.isRetrograde),
    event.passNumber?.toString() ?? "",
    event.totalPasses?.toString() ?? "",
    event.ingressTo ?? "",
    event.station ?? "",
    event.lunation ?? "",
  ];

  return values.map(escapeCSV).join(",");
}

/**
 * Format events as CSV.
 */
export function formatAsCSV(
  events: readonly AstrologyEvent[],
  _options?: FormatterOptions,
): string {
  const rows = [CSV_HEADERS.join(","), ...events.map(eventToRow)];
  return rows.join("\n");
}
