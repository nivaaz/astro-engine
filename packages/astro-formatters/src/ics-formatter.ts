/**
 * ICS (iCalendar) formatter — RFC 5545 compliant.
 *
 * Generates standards-compliant VCALENDAR/VEVENT feeds
 * for Apple Calendar, Google Calendar, Outlook, CalDAV.
 */

import type { AstrologyEvent, FormatterOptions } from "./types.js";
import { PLANET_SYMBOLS, ASPECT_SYMBOLS, SIGN_SYMBOLS } from "./symbols.js";

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatICSDate(utcString: string): string {
  const d = new Date(utcString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

export function formatDateOnly(utcString: string): string {
  const d = new Date(utcString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

function formatEventSummary(event: AstrologyEvent): string {
  const bodies = event.bodies
    .map((b) => {
      const sym = PLANET_SYMBOLS[b as keyof typeof PLANET_SYMBOLS];
      return sym ? `${sym} ${b}` : b;
    })
    .join(" ");

  const signSym = SIGN_SYMBOLS[event.sign as keyof typeof SIGN_SYMBOLS] ?? "";
  const signInfo = `${signSym} ${event.sign} ${Math.floor(event.degree)}°`;

  switch (event.type) {
    case "aspect": {
      const aspectSym = event.aspect
        ? ASPECT_SYMBOLS[event.aspect.type as keyof typeof ASPECT_SYMBOLS] ?? ""
        : "";
      const orb = event.aspect ? ` (${event.aspect.orb.toFixed(1)}°)` : "";
      return `${bodies} ${aspectSym}${orb} at ${signInfo}`;
    }
    case "ingress":
      return `${bodies} enters ${signInfo}`;
    case "station":
      return `${bodies} stations ${event.station} at ${signInfo}`;
    case "lunation": {
      const lunName = event.lunation?.replace(/_/g, " ") ?? "lunation";
      return `${lunName} at ${signInfo}`;
    }
    case "eclipse":
      return `${event.eclipse?.replace(/_/g, " ") ?? "eclipse"} at ${signInfo}`;
    case "void_of_course":
      return "Moon void of course";
    case "cazimi":
      return `${bodies} cazimi at ${signInfo}`;
    case "combust":
      return `${bodies} combust at ${signInfo}`;
    default:
      return `${bodies} at ${signInfo}`;
  }
}

function foldLine(line: string): string {
  // RFC 5545: lines must be <= 75 octets. Fold with CRLF + space.
  if (Buffer.byteLength(line, "utf-8") <= 75) return line;

  const result: string[] = [];
  let current = "";
  for (const char of line) {
    const test = current + char;
    if (Buffer.byteLength(test, "utf-8") > 75) {
      result.push(current);
      current = " " + char; // continuation line starts with space
    } else {
      current = test;
    }
  }
  if (current) result.push(current);
  return result.join("\r\n");
}

function buildVEvent(event: AstrologyEvent, options?: FormatterOptions): string {
  const summary = escapeICS(formatEventSummary(event));
  const dtStart = formatICSDate(event.exactAtUtc);
  const durationHours = options?.durationHours ?? 1;
  const dtEnd = new Date(new Date(event.exactAtUtc).getTime() + durationHours * 3600_000);
  const dtEndStr = formatICSDate(dtEnd.toISOString());

  const descriptionParts = [
    `Type: ${event.type}`,
    `Stream: ${event.stream}`,
    `Significance: ${event.significance}`,
    `Bodies: ${event.bodies.join(", ")}`,
    `Sign: ${event.sign} ${Math.floor(event.degree)}°`,
  ];
  if (event.aspect) {
    descriptionParts.push(
      `Aspect: ${event.aspect.type} (orb: ${event.aspect.orb.toFixed(1)}°, ${event.aspect.phase})`,
    );
  }
  if (event.isRetrograde) descriptionParts.push("Retrograde: yes");
  if (event.passNumber) descriptionParts.push(`Pass: ${event.passNumber}/${event.totalPasses}`);
  descriptionParts.push(`\nJSON:\n${JSON.stringify(event, null, 2)}`);

  const description = escapeICS(descriptionParts.join("\n"));

  const lines = [
    "BEGIN:VEVENT",
    `UID:${event.id}@astro-engine`,
    `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEndStr}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `CATEGORIES:${event.stream}`,
    `CATEGORIES:${event.significance}`,
    `STATUS:CONFIRMED`,
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
  ];

  return lines.map(foldLine).join("\r\n");
}

/**
 * Format events as an ICS (iCalendar) feed.
 */
export function formatAsICS(
  events: readonly AstrologyEvent[],
  options?: FormatterOptions,
): string {
  const title = options?.title ?? "Astro Engine Transits";
  const events_ = events.map((e) => buildVEvent(e, options));

  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//Sukara Technology//Astro Engine//EN`,
    `X-WR-CALNAME:${escapeICS(title)}`,
    "X-WR-TIMEZONE:UTC",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events_,
    "END:VCALENDAR",
  ];

  return calendar.join("\r\n");
}
