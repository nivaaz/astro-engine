/**
 * Plain text formatter — compact prompt-ready output for AI context.
 *
 * One-liner per event, grouped by date, with a "Current Sky" summary header.
 */

import type { AstrologyEvent, FormatterOptions } from "./types.js";
import { PLANET_SYMBOLS, ASPECT_SYMBOLS, SIGN_SYMBOLS } from "./symbols.js";

function formatDegree(degree: number): string {
  const d = Math.floor(degree);
  const m = Math.floor((degree - d) * 60);
  return `${d}°${String(m).padStart(2, "0")}'`;
}

function formatBodies(bodies: readonly string[]): string {
  return bodies
    .map((b) => {
      const sym = PLANET_SYMBOLS[b as keyof typeof PLANET_SYMBOLS];
      return sym ? `${sym} ${b}` : b;
    })
    .join(" ");
}

function formatAspectDetail(event: AstrologyEvent): string {
  if (!event.aspect) return "";
  const sym = ASPECT_SYMBOLS[event.aspect.type as keyof typeof ASPECT_SYMBOLS] ?? "";
  const orb = event.aspect.orb.toFixed(1);
  const phase = event.aspect.phase === "applying" ? "a" : event.aspect.phase === "separating" ? "s" : "e";
  return ` ${sym}${orb}° ${phase}`;
}

function formatEventLine(event: AstrologyEvent): string {
  const signSym = SIGN_SYMBOLS[event.sign as keyof typeof SIGN_SYMBOLS] ?? "";
  const bodies = formatBodies(event.bodies);
  const degree = formatDegree(event.degree);
  const aspect = formatAspectDetail(event);
  const retro = event.isRetrograde ? " ℞" : "";

  let description = "";

  switch (event.type) {
    case "aspect":
      description = `${bodies}${aspect}${retro}`;
      break;
    case "ingress":
      description = `${formatBodies(event.bodies)} → ${signSym} ${event.sign}${retro}`;
      break;
    case "station":
      description = `${formatBodies(event.bodies)} ${event.station === "retrograde" ? "℞ station" : "station direct"} ${signSym} ${event.sign} ${degree}`;
      break;
    case "lunation": {
      const lunationName = event.lunation?.replace(/_/g, " ") ?? "lunation";
      description = `${lunationName} ${signSym} ${event.sign} ${degree}`;
      break;
    }
    case "eclipse":
      description = `${event.eclipse?.replace(/_/g, " ") ?? "eclipse"} ${signSym} ${event.sign} ${degree}`;
      break;
    case "void_of_course":
      description = `Moon VOC${retro}`;
      break;
    case "cazimi":
      description = `${formatBodies(event.bodies)} cazimi ${signSym} ${event.sign} ${degree}`;
      break;
    case "combust":
      description = `${formatBodies(event.bodies)} combust ${signSym} ${event.sign} ${degree}`;
      break;
    default:
      description = `${bodies} ${signSym} ${event.sign} ${degree}${retro}`;
  }

  return description;
}

function formatTime(utcString: string): string {
  const date = new Date(utcString);
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes} UTC`;
}

/**
 * Format events as compact plain text for AI prompt context.
 */
export function formatAsPlainText(
  events: readonly AstrologyEvent[],
  options?: FormatterOptions,
): string {
  if (events.length === 0) {
    return "# Astro Engine — No events\n\nNo events found for the specified period.";
  }

  const now = new Date().toISOString();
  const title = options?.title ?? "Astro Engine — Sky Context";
  const lines: string[] = [];

  lines.push(`# ${title}`);
  lines.push(`Generated: ${now}`);
  lines.push(`Events: ${events.length}`);
  lines.push("");

  // Group by date
  const byDate = new Map<string, AstrologyEvent[]>();
  for (const event of events) {
    const dateStr = event.exactAtUtc.slice(0, 10);
    if (!byDate.has(dateStr)) byDate.set(dateStr, []);
    byDate.get(dateStr)!.push(event);
  }

  for (const [dateStr, dayEvents] of byDate) {
    lines.push(`## ${dateStr}`);
    for (const event of dayEvents) {
      const time = formatTime(event.exactAtUtc);
      const sig =
        event.significance === "major"
          ? " ★"
          : event.significance === "notable"
            ? " ●"
            : "";
      lines.push(`  ${time} — ${formatEventLine(event)}${sig}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
