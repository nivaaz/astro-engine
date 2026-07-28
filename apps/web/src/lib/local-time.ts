import type { UtcInstant } from "@sukara/astro-schema";

export function localCivilToUtc(
  date: string,
  time: string,
  timezone: string,
): UtcInstant | null {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if ([year, month, day, hour, minute].some((part) => !Number.isFinite(part)))
    return null;
  let guess = Date.UTC(year!, month! - 1, day!, hour!, minute!);
  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const parts = Object.fromEntries(
        new Intl.DateTimeFormat("en-CA", {
          timeZone: timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23",
        })
          .formatToParts(new Date(guess))
          .map(({ type, value }) => [type, value]),
      );
      const represented = Date.UTC(
        Number(parts["year"]),
        Number(parts["month"]) - 1,
        Number(parts["day"]),
        Number(parts["hour"]),
        Number(parts["minute"]),
        Number(parts["second"]),
      );
      guess -= represented - Date.UTC(year!, month! - 1, day!, hour!, minute!);
    }
  } catch {
    return null;
  }
  return new Date(guess).toISOString() as UtcInstant;
}
