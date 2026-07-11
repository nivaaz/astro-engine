/**
 * Markdown Formatter — grouped by stream with symbols.
 */

import type { AstrologyEvent, FormatterOptions, EventStream } from "./types.js";
import {
  PLANET_SYMBOLS,
  ASPECT_SYMBOLS,
  SIGN_SYMBOLS,
  SIGN_NAMES,
  PLANET_NAMES,
  STREAM_NAMES,
} from "./symbols.js";

const STREAM_ORDER: readonly EventStream[] = [
  "slow_sky",
  "lunation",
  "planetary",
  "daily_moon",
];

/** Format a date in a human-friendly way. */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Format time in UTC. */
function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  });
}

/** Format a single event as a markdown list item. */
function formatEvent(event: AstrologyEvent): string {
  const symbols = event.bodies
    .map((b) => `${PLANET_SYMBOLS[b] ?? "?"} ${PLANET_NAMES[b] ?? b}`)
    .join(", ");

  const signInfo = `${SIGN_SYMBOLS[event.sign] ?? ""} ${event.degree}° ${SIGN_NAMES[event.sign] ?? event.sign}`;

  let detail = "";

  switch (event.type) {
    case "aspect": {
      if (event.aspect) {
        const aspSym = ASPECT_SYMBOLS[event.aspect.type] ?? event.aspect.type;
        detail = ` | ${aspSym} orb ${event.aspect.orb}° ${event.aspect.phase}`;
      }
      break;
    }
    case "ingress": {
      detail = event.ingressTo
        ? ` → ${SIGN_SYMBOLS[event.ingressTo] ?? ""} ${SIGN_NAMES[event.ingressTo] ?? event.ingressTo}`
        : "";
      break;
    }
    case "station": {
      detail = event.station ? ` | ${event.station}` : "";
      break;
    }
    case "lunation": {
      detail = event.lunation
        ? ` | ${event.lunation.replace(/_/g, " ")}`
        : "";
      break;
    }
    default:
      break;
  }

  const retroTag = event.isRetrograde ? " ℞" : "";

  return `- **${formatDate(event.exactAtUtc)}** ${formatTime(event.exactAtUtc)} UTC — ${symbols} @ ${signInfo}${detail}${retroTag}`;
}

/** Group events by stream. */
function groupByStream(
  events: readonly AstrologyEvent[],
): Map<EventStream, AstrologyEvent[]> {
  const groups = new Map<EventStream, AstrologyEvent[]>();
  for (const event of events) {
    const list = groups.get(event.stream) ?? [];
    list.push(event);
    groups.set(event.stream, list);
  }
  return groups;
}

/**
 * Format astrology events as Markdown.
 *
 * Events are grouped by stream with section headers.
 *
 * @param events - Array of AstrologyEvent objects
 * @param options - Formatting options
 * @returns Markdown string
 */
export function formatAsMarkdown(
  events: readonly AstrologyEvent[],
  options?: FormatterOptions,
): string {
  const groups = groupByStream(events);
  const lines: string[] = [];

  // Title
  const title = options?.title ?? "Astrology Events";
  lines.push(`# ${title}`);
  lines.push("");
  lines.push(`> ${events.length} event${events.length !== 1 ? "s" : ""} · Generated ${new Date().toISOString()}`);
  lines.push("");

  // Sections in canonical stream order
  for (const stream of STREAM_ORDER) {
    const streamEvents = groups.get(stream);
    if (!streamEvents || streamEvents.length === 0) continue;

    const heading = STREAM_NAMES[stream] ?? stream;
    lines.push(`## ${heading}`);
    lines.push("");

    // Sort by date within each stream
    const sorted = [...streamEvents].sort(
      (a, b) => a.exactAtUtc.localeCompare(b.exactAtUtc),
    );

    for (const event of sorted) {
      lines.push(formatEvent(event));
    }

    lines.push("");
  }

  return lines.join("\n");
}