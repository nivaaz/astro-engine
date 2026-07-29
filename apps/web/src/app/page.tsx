"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type {
  CurrentSky,
  EventSearchResult,
  HumanDesignTransitResult,
  UtcInstant,
  WholeSignChart,
} from "@sukara/astro-schema";
import { formatArcminutes } from "@sukara/astro-formatters";
import { CopyChartButton } from "../components/copy-chart-button";
import { SiteHeader } from "../components/site-header";
import {
  parseSkyTransportResponse,
  type SkyTransportResponse,
} from "../lib/sky-transport";
import { cityLabel, findMajorCity, MAJOR_CITIES } from "../lib/major-cities";
import {
  eventLabel,
  formatEventDate,
  groupEventsByLocalDate,
} from "../lib/events-presentation";

type DataMode = "loading" | "fixture" | "provider" | "unavailable" | "error";

type SkyPayload = SkyTransportResponse;

const GLYPHS: Readonly<Record<string, string>> = {
  sun: "☉",
  moon: "☽",
  mercury: "☿",
  venus: "♀",
  mars: "♂",
  jupiter: "♃",
  saturn: "♄",
  uranus: "♅",
  neptune: "♆",
  pluto: "♇",
};
const title = (value: string) =>
  value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function subscribeOnline(callback: () => void): () => void {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

const EMPTY_LOCATION = {
  latitude: "",
  longitude: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
};

function validLocalContext(
  input: Readonly<{ latitude: string; longitude: string; timezone: string }>,
): boolean {
  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)
    return false;
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)
    return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: input.timezone }).format();
    return input.timezone === "UTC" || input.timezone.includes("/");
  } catch {
    return false;
  }
}

function formatTime(value: string, timezone?: string): string {
  try {
    return new Intl.DateTimeFormat("en-AU", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone,
    }).format(new Date(value));
  } catch {
    return new Intl.DateTimeFormat("en-AU", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(value));
  }
}

function formatClock(value: string, timezone: string): string {
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

async function postOperation<T>(input: unknown): Promise<T> {
  const response = await fetch("/api/sky", {
    method: "POST",
    cache: "no-store",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body: unknown = await response.json();
  return providerEnvelopeValue<T>(body, response.ok);
}

function providerEnvelopeValue<T>(body: unknown, responseOk = true): T {
  if (
    !responseOk ||
    typeof body !== "object" ||
    body === null ||
    !("ok" in body) ||
    body.ok !== true ||
    !("value" in body)
  )
    throw new Error("Calculation unavailable");
  return body.value as T;
}

export default function HomePage() {
  const [mode, setMode] = useState<DataMode>("loading");
  const [payload, setPayload] = useState<SkyPayload | null>(null);
  const [message, setMessage] = useState(
    "Connecting to the calculation provider…",
  );
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
  const [referenceInstant, setReferenceInstant] = useState<UtcInstant | null>(
    null,
  );
  const [location, setLocation] = useState(EMPTY_LOCATION);
  const [locationCity, setLocationCity] = useState("");
  const [wholeSign, setWholeSign] = useState<WholeSignChart | null>(null);
  const [calculationMessage, setCalculationMessage] = useState("");

  function chooseLocationCity(value: string) {
    setLocationCity(value);
    const city = findMajorCity(value);
    if (city === undefined) {
      if (value.trim() !== "")
        setLocation({ ...location, latitude: "", longitude: "", timezone: "" });
      return;
    }
    setLocation({
      latitude: String(city.latitude),
      longitude: String(city.longitude),
      timezone: city.timezone,
    });
  }

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/sky", { cache: "no-store" });
        const body: unknown = await response.json();
        const parsed = parseSkyTransportResponse(body);
        if (response.ok && parsed !== null) {
          setPayload(parsed);
          setReferenceInstant(new Date().toISOString() as UtcInstant);
          setMode(parsed.mode);
          setMessage("Fixture data loaded for interface verification.");
          return;
        }
        const currentSky = providerEnvelopeValue<CurrentSky>(body, response.ok);
        const instant = currentSky.metadata.calculatedAt;
        const end = new Date(
          Date.parse(instant) + 30 * 86_400_000,
        ).toISOString();
        const [upcomingEvents, humanDesign] = await Promise.all([
          postOperation<EventSearchResult>({
            operation: "events",
            request: { window: { start: instant, end }, limit: 100 },
          }),
          postOperation<HumanDesignTransitResult>({
            operation: "human-design",
            instant,
          }),
        ]);
        setPayload({
          mode: "provider",
          currentSky,
          upcomingEvents,
          humanDesign,
        });
        setReferenceInstant(new Date().toISOString() as UtcInstant);
        setMode("provider");
        setMessage("Provider data loaded with canonical provenance.");
      } catch {
        setMode("error");
        setMessage(
          "The licensed calculation provider is not configured for this environment.",
        );
      }
    })();
  }, []);

  const stale =
    payload && referenceInstant
      ? Date.parse(referenceInstant) >=
        Date.parse(payload.currentSky.metadata.validFor.end)
      : false;
  const locationValid =
    location.latitude !== "" &&
    location.longitude !== "" &&
    validLocalContext(location);
  const status = !online
    ? "Offline"
    : stale
      ? "Stale"
      : mode === "fixture"
        ? "Fixture"
        : mode === "provider"
          ? "Current"
          : mode === "loading"
            ? "Loading"
            : "Unavailable";

  function useMyLocation() {
    setMessage("Requesting location permission…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocationCity("");
        setLocation({
          latitude: coords.latitude.toFixed(5),
          longitude: coords.longitude.toFixed(5),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        });
        setMessage("Location is held in this tab only.");
      },
      () =>
        setMessage("Location was not available. Enter coordinates manually."),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  async function calculateLocalStructure() {
    if (!locationValid) return;
    setCalculationMessage("Calculating local structure…");
    try {
      const value = await postOperation<WholeSignChart>({
        operation: "whole-sign",
        instant: new Date().toISOString(),
        location: {
          latitude: Number(location.latitude),
          longitude: Number(location.longitude),
          timezone: location.timezone,
        },
      });
      setWholeSign(value);
      setCalculationMessage(
        "Whole Sign structure calculated from fixture coordinates.",
      );
    } catch {
      setCalculationMessage(
        "Local structure is unavailable without a configured provider.",
      );
    }
  }

  return (
    <main>
      <SiteHeader activeRoute="sky" home>
        <a className="home-only-nav" href="#human-design">
          Human Design
        </a>
      </SiteHeader>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Open symbolic infrastructure</p>
          <h1>
            The sky,
            <br />
            <em>without the story.</em>
          </h1>
          <p className="lede">
            Deterministic tropical coordinates, Whole Sign structure, and Human
            Design transit gates for builders and careful observers.
          </p>
        </div>
        <div className="instrument" aria-label="Current Moon phase instrument">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="moon-disc" aria-hidden="true" />
          <div className="instrument-label">
            <span>Moon phase</span>
            <strong>
              {payload
                ? title(payload.currentSky.moonPhase.phase)
                : "Awaiting data"}
            </strong>
            <small>
              {payload
                ? `${formatArcminutes(payload.currentSky.moonPhase.phaseAngle)} elongation`
                : "—"}
            </small>
          </div>
        </div>
      </section>

      <section
        className={`notice ${mode === "fixture" ? "notice-fixture" : ""}`}
        role="status"
        aria-live="polite"
      >
        <span className="status-dot" aria-hidden="true" />
        <div>
          <strong>
            {status}
            {stale ? " data" : ""}
          </strong>
          <p>
            {!online
              ? "You are offline. No cached astronomical result is being presented as current."
              : message}
          </p>
        </div>
        {payload && (
          <time dateTime={payload.currentSky.metadata.calculatedAt}>
            Calculated {formatTime(payload.currentSky.metadata.calculatedAt)}
          </time>
        )}
      </section>

      <section className="data-section" id="sky" aria-labelledby="sky-title">
        <div className="section-heading">
          <div>
            <p className="section-index">01 / Current sky</p>
            <h2 id="sky-title">Current sky</h2>
          </div>
          <CopyChartButton
            disabled={!payload}
            request={
              payload
                ? {
                    context: "current-sky",
                    chartType: "Current sky",
                    date: payload.currentSky.metadata.calculatedAt,
                    currentSky: payload.currentSky,
                    ...(wholeSign ? { wholeSignChart: wholeSign } : {}),
                  }
                : null
            }
          />
        </div>
        {payload ? (
          <div className="position-grid">
            {payload.currentSky.positions.map((planet) => (
              <article className="position" key={planet.body}>
                <span className="planet-glyph" aria-hidden="true">
                  {GLYPHS[planet.body] ?? "·"}
                </span>
                <div>
                  <h3>{title(planet.body)}</h3>
                  <p>{title(planet.sign)}</p>
                </div>
                <strong>{formatArcminutes(planet.signDegree)}</strong>
                {planet.retrograde && <span className="retrograde">℞</span>}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState mode={mode} />
        )}
        {payload && (
          <div className="aspects">
            <p className="subheading">Tight major aspects</p>
            {payload.currentSky.aspects.map((aspect) => (
              <div
                className="aspect-row"
                key={`${aspect.bodyA}-${aspect.bodyB}-${aspect.type}`}
              >
                <strong>
                  {title(aspect.bodyA)} · {title(aspect.bodyB)}
                </strong>
                <span>{title(aspect.type)}</span>
                <span>{formatArcminutes(aspect.orb)} orb</span>
                <span>{aspect.phase}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="location-bar" aria-labelledby="location-title">
        <div>
          <p className="section-index">02 / Local context</p>
          <h2 id="location-title">Your horizon</h2>
          <p>
            Choose a city for local Whole Sign structure. Coordinates stay in
            this tab and do not change the global event result.
          </p>
        </div>
        <div className="location-fields">
          <label className="wide">
            Major city
            <input
              list="major-city-options"
              value={locationCity}
              onChange={(e) => chooseLocationCity(e.target.value)}
              placeholder="Sydney, Australia"
              autoComplete="off"
            />
          </label>
          <div className="location-actions">
            <button
              className="button secondary"
              type="button"
              onClick={useMyLocation}
            >
              Use my location
            </button>
            <button
              className="button"
              type="button"
              onClick={calculateLocalStructure}
              disabled={
                !locationValid || (mode !== "fixture" && mode !== "provider")
              }
            >
              Calculate Whole Sign
            </button>
          </div>
          <details className="location-details wide">
            <summary>Advanced coordinates</summary>
            <div className="advanced-location-fields">
              <label>
                Latitude
                <input
                  inputMode="decimal"
                  value={location.latitude}
                  onChange={(e) => {
                    setLocationCity("");
                    setLocation({ ...location, latitude: e.target.value });
                  }}
                  placeholder="−33.8688"
                />
              </label>
              <label>
                Longitude
                <input
                  inputMode="decimal"
                  value={location.longitude}
                  onChange={(e) => {
                    setLocationCity("");
                    setLocation({ ...location, longitude: e.target.value });
                  }}
                  placeholder="151.2093"
                />
              </label>
              <label>
                Timezone
                <input
                  value={location.timezone}
                  onChange={(e) => {
                    setLocationCity("");
                    setLocation({ ...location, timezone: e.target.value });
                  }}
                  placeholder="Australia/Sydney"
                />
              </label>
            </div>
          </details>
        </div>
        <p className={`field-note ${locationValid ? "valid" : ""}`}>
          {locationValid
            ? `Local context ready${locationCity ? ` · ${locationCity}` : ""} · held in this tab only`
            : "Choose a major city, enter coordinates, or use browser geolocation"}
        </p>
        {wholeSign && (
          <p className="field-note valid" role="status">
            Ascendant {formatArcminutes(wholeSign.ascendant)} · first house{" "}
            {title(wholeSign.firstHouseSign)} · Midheaven{" "}
            {formatArcminutes(wholeSign.midheaven)}
          </p>
        )}
        <datalist id="major-city-options">
          {MAJOR_CITIES.map((city) => (
            <option
              key={`${city.name}-${city.country}`}
              value={cityLabel(city)}
            />
          ))}
        </datalist>
      </section>

      <section
        className="data-section"
        id="events"
        aria-labelledby="events-title"
      >
        <div className="section-heading">
          <div>
            <p className="section-index">03 / Bounded search</p>
            <h2 id="events-title">Upcoming major events</h2>
          </div>
          <a className="button secondary" href="/events">
            See all events
          </a>
        </div>
        {payload ? (
          <div className="timeline">
            {groupEventsByLocalDate(
              payload.upcomingEvents.events,
              location.timezone || "UTC",
            )
              .slice(0, 2)
              .map((group) => (
                <section className="event-date-group" key={group.localDate}>
                  <h3>{formatEventDate(group.localDate)}</h3>
                  {group.events.map((event, index) => (
                    <article key={event.id}>
                      <time dateTime={event.exactAt}>
                        {formatClock(event.exactAt, location.timezone || "UTC")}
                      </time>
                      <span className="timeline-line" aria-hidden="true">
                        <i />
                      </span>
                      <div>
                        <p>{event.kind}</p>
                        <h4>{eventLabel(event)}</h4>
                      </div>
                      <b>{String(index + 1).padStart(2, "0")}</b>
                    </article>
                  ))}
                </section>
              ))}
            {groupEventsByLocalDate(
              payload.upcomingEvents.events,
              location.timezone || "UTC",
            ).length === 0 && (
              <EmptyState
                mode={mode}
                message="No relevant events in this bounded window."
              />
            )}
          </div>
        ) : (
          <EmptyState mode={mode} />
        )}
      </section>

      <section className="split-section">
        <article className="personal-card" id="saturn">
          <p className="section-index">04 / Session calculation</p>
          <h2>Saturn return</h2>
          <p>
            Find exact return windows and passes from your birth date and a
            supported major city. Local birth time is optional and clearly
            labelled when noon is used as the deterministic approximation.
          </p>
          <a className="button" href="/saturn-return">
            Explore Saturn return
          </a>
          {calculationMessage && (
            <p className="privacy-note" aria-live="polite">
              {calculationMessage}
            </p>
          )}
        </article>
        <article className="hd-card" id="human-design">
          <p className="section-index">05 / Tropical projection</p>
          <h2>Human Design transits</h2>
          <p className="card-copy">
            Sun, Earth, and Moon are shown as gate.line transit coordinates. No
            bodygraph, type, authority, or interpretation.
          </p>
          {payload ? (
            <div className="gate-list">
              {payload.humanDesign.transits.map((transit) => (
                <div key={transit.body}>
                  <span>{title(transit.body)}</span>
                  <strong>
                    {transit.gate}
                    <i>.{transit.line}</i>
                  </strong>
                  <small>Gate · line</small>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState mode={mode} />
          )}
        </article>
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
          <a href="https://github.com/nivaaz/astro-engine">
            Source on GitHub ↗
          </a>
          <a href="https://github.com/nivaaz/astro-engine#build">
            Build with Astro Engine ↗
          </a>
        </div>
        <small>
          Built by Sukara Technology · Tropical / Whole Sign · MIT public core
        </small>
      </footer>
    </main>
  );
}

function EmptyState({ mode, message }: { mode: DataMode; message?: string }) {
  return (
    <div className="empty-state">
      <span aria-hidden="true">{mode === "loading" ? "◌" : "×"}</span>
      <strong>
        {message ??
          (mode === "loading"
            ? "Awaiting calculation"
            : "Provider unavailable")}
      </strong>
      <p>
        {message
          ? "No astronomical values are substituted or estimated."
          : mode === "loading"
            ? "Establishing a typed server connection."
            : "No astronomical values are substituted or estimated."}
      </p>
    </div>
  );
}
