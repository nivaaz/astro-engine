"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type {
  CurrentSky,
  EventSearchResult,
  UtcInstant,
} from "@sukara/astro-schema";
import { MAX_EVENT_RESULTS } from "@sukara/astro-schema";
import { CopyChartButton } from "../../components/copy-chart-button";
import { SiteHeader } from "../../components/site-header";
import { EventCoverage } from "../../components/event-coverage";
import {
  eventLabel,
  formatEventDate,
  groupEventsByLocalDate,
} from "../../lib/events-presentation";
import { parseSkyTransportResponse } from "../../lib/sky-transport";

type Mode = "loading" | "fixture" | "provider" | "unavailable" | "error";
type EventPayload = Readonly<{
  mode: "fixture" | "provider";
  currentSky: CurrentSky;
  upcomingEvents: EventSearchResult;
}>;

function formatTime(value: string, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-AU", {
      timeStyle: "short",
      timeZone: timezone,
    }).format(new Date(value));
  } catch {
    return new Intl.DateTimeFormat("en-AU", {
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(value));
  }
}

function providerValue<T>(body: unknown, ok: boolean): T {
  if (
    !ok ||
    typeof body !== "object" ||
    body === null ||
    !("ok" in body) ||
    body.ok !== true ||
    !("value" in body)
  )
    throw new Error("Calculation unavailable");
  return body.value as T;
}

async function loadPayload(): Promise<EventPayload> {
  const response = await fetch("/api/sky", { cache: "no-store" });
  const body: unknown = await response.json();
  const fixture = parseSkyTransportResponse(body);
  if (response.ok && fixture !== null) return fixture;
  const currentSky = providerValue<CurrentSky>(body, response.ok);
  const end = new Date(
    Date.parse(currentSky.metadata.calculatedAt) + 30 * 86_400_000,
  ).toISOString();
  const eventsResponse = await fetch("/api/sky", {
    method: "POST",
    cache: "no-store",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      operation: "events",
      request: {
        window: { start: currentSky.metadata.calculatedAt, end },
        limit: MAX_EVENT_RESULTS,
      },
    }),
  });
  const eventsBody: unknown = await eventsResponse.json();
  const upcomingEvents = providerValue<EventSearchResult>(
    eventsBody,
    eventsResponse.ok,
  );
  return { mode: "provider", currentSky, upcomingEvents };
}

export default function EventsPage() {
  const [mode, setMode] = useState<Mode>("loading");
  const [payload, setPayload] = useState<EventPayload | null>(null);
  const [timezoneOverride, setTimezoneOverride] = useState<string | null>(null);
  const browserTimezone = useSyncExternalStore(
    () => () => undefined,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    () => "UTC",
  );
  const timezone = timezoneOverride ?? browserTimezone;
  const [message, setMessage] = useState(
    "Loading the canonical 30-day event search…",
  );

  useEffect(() => {
    void loadPayload()
      .then((value) => {
        setPayload(value);
        setMode(value.mode);
        setMessage(
          value.mode === "fixture"
            ? "Fixture data loaded for interface verification."
            : "Provider data loaded with canonical provenance.",
        );
      })
      .catch(() => {
        setMode("error");
        setMessage(
          "The licensed calculation provider is not configured for this environment.",
        );
      });
  }, []);

  const groups = payload
    ? groupEventsByLocalDate(payload.upcomingEvents.events, timezone)
    : [];

  return (
    <main>
      <SiteHeader activeRoute="events" />
      <section className="route-hero">
        <p className="eyebrow">Bounded major events</p>
        <h1>Upcoming events</h1>
        <p className="lede">
          See the next 30 days of major events, grouped by calendar date in your
          browser timezone.
        </p>
        <details className="methodology-disclosure">
          <summary>About this feed</summary>
          <p>
            Moon aspects and quarter lunations are excluded from this
            presentation; new and full lunations remain. Eclipse computation is
            deferred until a canonical eclipse event exists.
          </p>
        </details>
      </section>
      <section
        className={`notice ${mode === "fixture" ? "notice-fixture" : ""}`}
        role="status"
        aria-live="polite"
      >
        <span className="status-dot" aria-hidden="true" />
        <div>
          <strong>
            {mode === "fixture"
              ? "Fixture"
              : mode === "provider"
                ? "Current"
                : mode === "loading"
                  ? "Loading"
                  : "Unavailable"}
          </strong>
          <p>{message}</p>
        </div>
      </section>
      <section
        className="data-section route-section"
        aria-labelledby="events-page-title"
      >
        <div className="section-heading">
          <div>
            <p className="section-index">01 / Local dates</p>
            <h2 id="events-page-title">Next 30 days</h2>
          </div>
          <label className="timezone-field">
            Timezone
            <input
              value={timezone}
              onChange={(event) => setTimezoneOverride(event.target.value)}
              aria-label="Timezone"
            />
          </label>
        </div>
        {payload && (
          <EventCoverage result={payload.upcomingEvents} timezone={timezone} />
        )}
        {payload && groups.length > 0 ? (
          <div className="timeline">
            {groups.map((group) => (
              <section className="event-date-group" key={group.localDate}>
                <h3>{formatEventDate(group.localDate)}</h3>
                {group.events.map((event) => (
                  <article key={event.id}>
                    <time dateTime={event.exactAt}>
                      {formatTime(event.exactAt, timezone)}
                    </time>
                    <span className="timeline-line" aria-hidden="true">
                      <i />
                    </span>
                    <div>
                      <p>{event.kind}</p>
                      <h4>{eventLabel(event)}</h4>
                      <CopyChartButton
                        variant="quiet"
                        request={{
                          context:
                            event.kind === "lunation" ? "lunation" : "event",
                          chartType: eventLabel(event),
                          instant: event.exactAt as UtcInstant,
                        }}
                      />
                    </div>
                    <b>
                      {String(group.events.indexOf(event) + 1).padStart(2, "0")}
                    </b>
                  </article>
                ))}
              </section>
            ))}
          </div>
        ) : payload ? (
          <EmptyEvents
            message={
              payload.upcomingEvents.complete
                ? "No relevant events in this bounded window."
                : "No relevant events in the returned portion"
            }
          />
        ) : (
          <EmptyEvents
            message={
              mode === "loading"
                ? "Awaiting calculation"
                : "Provider unavailable"
            }
          />
        )}
      </section>
      <footer>
        <div>
          <span className="brand-mark" aria-hidden="true">
            ✣
          </span>
          <strong>Astro Engine</strong>
        </div>
        <p>
          Coordinates, context, structure.
          <br />
          Never interpretations.
        </p>
        <div className="footer-links">
          <a href="/">Back to current sky</a>
          <a href="/saturn-return">Explore Saturn return</a>
        </div>
      </footer>
    </main>
  );
}

function EmptyEvents({
  message = "No relevant events in this bounded window.",
}: {
  message?: string;
}) {
  return (
    <div className="empty-state">
      <span aria-hidden="true">×</span>
      <strong>{message}</strong>
      <p>No astronomical values are substituted or estimated.</p>
    </div>
  );
}
