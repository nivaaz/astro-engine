import type { EventSearchResult } from "@sukara/astro-schema";

export function EventCoverage({
  result,
  timezone,
}: Readonly<{ result: EventSearchResult; timezone: string }>) {
  if (result.complete) return null;
  const last = result.events.at(-1);
  let zone = timezone;
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
  } catch {
    zone = "UTC";
  }
  const formatter = new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: zone,
  });
  return (
    <p className="privacy-note event-coverage" role="status">
      Result limit reached: {result.events.length} events returned
      {last ? ` through ${formatter.format(new Date(last.exactAt))}` : ""}.{" "}
      Later events in the requested window are not shown.
    </p>
  );
}
