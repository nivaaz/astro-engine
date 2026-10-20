import type { CivilTimeInput, UtcInstant } from "@sukara/astro-schema";

export type CivilTimeResolution =
  | Readonly<{ kind: "resolved"; instant: UtcInstant }>
  | Readonly<{ kind: "ambiguous"; earlier: UtcInstant; later: UtcInstant }>
  | Readonly<{ kind: "nonexistent" }>
  | Readonly<{ kind: "invalid" }>;

function utcMilliseconds(parts: readonly number[]): number {
  const [year, month, day, hour, minute, second = 0] = parts;
  const value = new Date(0);
  value.setUTCFullYear(year!, month! - 1, day!);
  value.setUTCHours(hour!, minute!, second, 0);
  return value.getTime();
}

/** Enumerate nearby offsets, then accept only exact civil-time round trips. */
export function resolveLocalCivilTime(
  date: string,
  time: string,
  timezone: string,
): CivilTimeResolution {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^\d{2}:\d{2}$/.test(time) ||
    (timezone !== "UTC" && !timezone.includes("/"))
  )
    return { kind: "invalid" };

  const wall = utcMilliseconds([
    ...date.split("-").map(Number),
    ...time.split(":").map(Number),
  ]);
  if (new Date(wall).toISOString().slice(0, 16) !== `${date}T${time}`)
    return { kind: "invalid" };

  try {
    const formatter = new Intl.DateTimeFormat("en-CA-u-ca-iso8601-nu-latn", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    const localWall = (instant: number): number => {
      const parts = Object.fromEntries(
        formatter
          .formatToParts(new Date(instant))
          .map(({ type, value }) => [type, value]),
      );
      return utcMilliseconds(
        ["year", "month", "day", "hour", "minute", "second"].map((key) =>
          Number(parts[key]),
        ),
      );
    };
    // Include both sides of hour/half-hour changes and 24-hour date-line skips.
    const offsets = new Set<number>();
    for (let hours = -48; hours <= 48; hours += 6) {
      const sample = wall + hours * 3_600_000;
      offsets.add(localWall(sample) - sample);
    }
    const candidates = [...offsets]
      .map((offset) => wall - offset)
      .filter((instant) => localWall(instant) === wall)
      .sort((left, right) => left - right)
      .map((instant) => new Date(instant).toISOString() as UtcInstant);
    if (candidates.length === 0) return { kind: "nonexistent" };
    if (candidates.length === 1)
      return { kind: "resolved", instant: candidates[0]! };
    return {
      kind: "ambiguous",
      earlier: candidates[0]!,
      later: candidates.at(-1)!,
    };
  } catch {
    return { kind: "invalid" };
  }
}

export function localCivilToUtc(
  date: string,
  time: string,
  timezone: string,
  fold: CivilTimeInput["fold"] = "reject-ambiguous",
): UtcInstant | null {
  const result = resolveLocalCivilTime(date, time, timezone);
  if (result.kind === "resolved") return result.instant;
  if (result.kind === "ambiguous" && fold !== "reject-ambiguous")
    return result[fold];
  return null;
}
