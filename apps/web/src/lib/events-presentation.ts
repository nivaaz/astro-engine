import type { MajorEvent } from "@sukara/astro-schema";

export interface EventDateGroup {
  readonly localDate: string;
  readonly events: readonly MajorEvent[];
}

const MOON_BODY = "moon";
const RELEVANT_LUNATION_PHASES = new Set(["new", "full"]);

/** Presentation-only projection; the canonical search result is never mutated. */
export function filterRelevantEvents(
  events: readonly MajorEvent[],
): readonly MajorEvent[] {
  return events.filter((event) => {
    if (
      event.kind === "aspect" &&
      (event.bodyA === MOON_BODY || event.bodyB === MOON_BODY)
    )
      return false;
    return (
      event.kind !== "lunation" || RELEVANT_LUNATION_PHASES.has(event.phase)
    );
  });
}

function validTimezone(timezone: string): string {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
    return timezone;
  } catch {
    return "UTC";
  }
}

function localDateKey(exactAt: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: validTimezone(timezone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(exactAt));
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
  return `${values["year"]}-${values["month"]}-${values["day"]}`;
}

export function groupEventsByLocalDate(
  events: readonly MajorEvent[],
  timezone: string,
): readonly EventDateGroup[] {
  const groups = new Map<string, MajorEvent[]>();
  for (const event of filterRelevantEvents(events)) {
    const key = localDateKey(event.exactAt, timezone);
    const group = groups.get(key);
    if (group) group.push(event);
    else groups.set(key, [event]);
  }
  return [...groups.entries()].map(([localDate, grouped]) => ({
    localDate,
    events: grouped,
  }));
}

export function formatEventDate(localDate: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    // localDate is already derived in the requested timezone; formatting the
    // key at UTC noon prevents a second timezone shift near day boundaries.
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${localDate}T12:00:00Z`));
}

export function eventLabel(event: MajorEvent): string {
  const title = (value: string) =>
    value
      .replaceAll("-", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  if (event.kind === "ingress")
    return `${title(event.body)} enters ${title(event.sign)}`;
  if (event.kind === "station")
    return `${title(event.body)} stations ${event.direction}`;
  if (event.kind === "aspect")
    return `${title(event.bodyA)} ${event.aspect} ${title(event.bodyB)}`;
  return `${title(event.phase)} Moon`;
}
