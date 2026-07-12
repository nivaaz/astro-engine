"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type {
  CurrentSky,
  EventSearchResult,
  HumanDesignTransitResult,
  MajorEvent,
  SaturnReturnResult,
  UtcInstant,
  WholeSignChart,
} from "@sukara/astro-schema";
import {
  parseSkyTransportResponse,
  type SkyTransportResponse,
} from "../lib/sky-transport";

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

function formatDegree(value: number): string {
  return `${Math.floor(value)}°${String(Math.round((value % 1) * 60)).padStart(2, "0")}′`;
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

function localCivilToUtc(
  date: string,
  time: string,
  timezone: string,
): UtcInstant | null {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if ([year, month, day, hour, minute].some((part) => !Number.isFinite(part)))
    return null;
  let guess = Date.UTC(year!, month! - 1, day!, hour!, minute!);
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
  return new Date(guess).toISOString() as UtcInstant;
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

function eventLabel(event: MajorEvent): string {
  if (event.kind === "ingress")
    return `${title(event.body)} enters ${title(event.sign)}`;
  if (event.kind === "station")
    return `${title(event.body)} stations ${event.direction}`;
  if (event.kind === "aspect")
    return `${title(event.bodyA)} ${event.aspect} ${title(event.bodyB)}`;
  return `${title(event.phase)} Moon`;
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
  const [birth, setBirth] = useState({
    date: "",
    time: "",
    latitude: "",
    longitude: "",
    timezone: EMPTY_LOCATION.timezone,
  });
  const [copyState, setCopyState] = useState("Copy");
  const [personalOpen, setPersonalOpen] = useState(false);
  const [wholeSign, setWholeSign] = useState<WholeSignChart | null>(null);
  const [saturnReturn, setSaturnReturn] = useState<SaturnReturnResult | null>(
    null,
  );
  const [calculationMessage, setCalculationMessage] = useState("");

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
  const birthValid =
    birth.date !== "" &&
    birth.time !== "" &&
    birth.latitude !== "" &&
    birth.longitude !== "" &&
    validLocalContext(birth);
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

  async function copy(format: "plain" | "markdown" | "json") {
    if (!payload) return;
    try {
      const response = await fetch("/api/format", {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          format,
          value: payload.currentSky,
          referenceInstant:
            referenceInstant ?? payload.currentSky.metadata.calculatedAt,
        }),
      });
      const body: unknown = await response.json();
      if (
        !response.ok ||
        typeof body !== "object" ||
        body === null ||
        !("ok" in body) ||
        body.ok !== true ||
        !("output" in body) ||
        typeof body.output !== "string"
      )
        throw new Error("Format failed");
      await navigator.clipboard.writeText(body.output);
      setCopyState(
        `${format === "json" ? "JSON" : format === "markdown" ? "Markdown" : "Plain text"} copied`,
      );
    } catch {
      setCopyState("Copy failed");
    }
    window.setTimeout(() => setCopyState("Copy"), 1800);
  }

  function useMyLocation() {
    setMessage("Requesting location permission…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
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

  async function calculateReturn() {
    if (!birthValid) return;
    const birthInstant = localCivilToUtc(
      birth.date,
      birth.time,
      birth.timezone,
    );
    if (birthInstant === null) {
      setCalculationMessage("Birth time could not be resolved.");
      return;
    }
    const asOf = new Date();
    const start = new Date(asOf);
    start.setUTCFullYear(start.getUTCFullYear() - 4);
    const end = new Date(asOf);
    end.setUTCFullYear(end.getUTCFullYear() + 4);
    setCalculationMessage("Calculating bounded Saturn-return windows…");
    try {
      const value = await postOperation<SaturnReturnResult>({
        operation: "saturn-return",
        birthInstant,
        asOf: asOf.toISOString(),
        searchWindow: { start: start.toISOString(), end: end.toISOString() },
        orb: 2,
      });
      setSaturnReturn(value);
      setCalculationMessage("Saturn-return fixture calculation complete.");
    } catch {
      setCalculationMessage(
        "Saturn return is unavailable without a configured provider.",
      );
    }
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Astro Engine home">
          <span className="brand-mark" aria-hidden="true">
            ✣
          </span>
          <span>Astro Engine</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#sky">Current sky</a>
          <a href="#events">Events</a>
          <a href="#saturn">Saturn return</a>
          <a href="#human-design">Human Design</a>
        </nav>
        <a
          className="github-link"
          href="https://github.com/nivaaz/astro-engine"
        >
          GitHub <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Open symbolic infrastructure · Public V1</p>
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
                ? `${payload.currentSky.moonPhase.phaseAngle.toFixed(2)}° elongation`
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

      <section className="location-bar" aria-labelledby="location-title">
        <div>
          <p className="section-index">01 / Local context</p>
          <h2 id="location-title">Your horizon</h2>
          <p>
            Coordinates affect local Whole Sign data, never the global event
            itself.
          </p>
        </div>
        <div className="location-fields">
          <label>
            Latitude
            <input
              inputMode="decimal"
              value={location.latitude}
              onChange={(e) =>
                setLocation({ ...location, latitude: e.target.value })
              }
              placeholder="−33.8688"
            />
          </label>
          <label>
            Longitude
            <input
              inputMode="decimal"
              value={location.longitude}
              onChange={(e) =>
                setLocation({ ...location, longitude: e.target.value })
              }
              placeholder="151.2093"
            />
          </label>
          <label>
            Timezone
            <input
              value={location.timezone}
              onChange={(e) =>
                setLocation({ ...location, timezone: e.target.value })
              }
              placeholder="Australia/Sydney"
            />
          </label>
          <button
            className="button secondary"
            type="button"
            onClick={useMyLocation}
          >
            Use my location
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={calculateLocalStructure}
            disabled={
              !locationValid || (mode !== "fixture" && mode !== "provider")
            }
          >
            Calculate Whole Sign
          </button>
        </div>
        <p className={`field-note ${locationValid ? "valid" : ""}`}>
          {locationValid
            ? "Local context ready · held in this tab only"
            : "Enter coordinates or use browser geolocation"}
        </p>
        {wholeSign && (
          <p className="field-note valid" role="status">
            Ascendant {formatDegree(wholeSign.ascendant)} · first house{" "}
            {title(wholeSign.firstHouseSign)} · Midheaven{" "}
            {formatDegree(wholeSign.midheaven)}
          </p>
        )}
      </section>

      <section className="data-section" id="sky" aria-labelledby="sky-title">
        <div className="section-heading">
          <div>
            <p className="section-index">02 / Coordinates</p>
            <h2 id="sky-title">Current sky</h2>
          </div>
          <div className="copy-group" aria-label="Copy current sky">
            <span role="status" aria-live="polite">
              {copyState}
            </span>
            <button onClick={() => copy("plain")} disabled={!payload}>
              Text
            </button>
            <button onClick={() => copy("markdown")} disabled={!payload}>
              MD
            </button>
            <button onClick={() => copy("json")} disabled={!payload}>
              JSON
            </button>
          </div>
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
                <strong>{formatDegree(planet.signDegree)}</strong>
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
                <span>{aspect.orb.toFixed(2)}° orb</span>
                <span>{aspect.phase}</span>
              </div>
            ))}
          </div>
        )}
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
          <p className="section-note">Next 30 days · notable + major</p>
        </div>
        {payload ? (
          <div className="timeline">
            {payload.upcomingEvents.events.map((event, index) => (
              <article key={event.id}>
                <time dateTime={event.exactAt}>
                  {
                    formatTime(event.exactAt, location.timezone || "UTC").split(
                      ",",
                    )[0]
                  }
                </time>
                <span className="timeline-line" aria-hidden="true">
                  <i />
                </span>
                <div>
                  <p>{event.kind}</p>
                  <h3>{eventLabel(event)}</h3>
                  <small>
                    {formatTime(event.exactAt, location.timezone || "UTC")}
                  </small>
                </div>
                <b>{String(index + 1).padStart(2, "0")}</b>
              </article>
            ))}
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
            Find exact return windows and passes from a natal Saturn coordinate.
            Inputs are held in React memory only and are never stored, logged,
            cached, or added to the URL.
          </p>
          <button
            className="button"
            onClick={() => setPersonalOpen(!personalOpen)}
            aria-expanded={personalOpen}
          >
            {personalOpen ? "Close inputs" : "Enter birth data"}
          </button>
          {personalOpen && (
            <form
              className="birth-form"
              onSubmit={(e) => {
                e.preventDefault();
                void calculateReturn();
              }}
            >
              <label>
                Date
                <input
                  type="date"
                  value={birth.date}
                  onChange={(e) => setBirth({ ...birth, date: e.target.value })}
                />
              </label>
              <label>
                Local time
                <input
                  type="time"
                  value={birth.time}
                  onChange={(e) => setBirth({ ...birth, time: e.target.value })}
                />
              </label>
              <label>
                Latitude
                <input
                  inputMode="decimal"
                  value={birth.latitude}
                  onChange={(e) =>
                    setBirth({ ...birth, latitude: e.target.value })
                  }
                />
              </label>
              <label>
                Longitude
                <input
                  inputMode="decimal"
                  value={birth.longitude}
                  onChange={(e) =>
                    setBirth({ ...birth, longitude: e.target.value })
                  }
                />
              </label>
              <label className="wide">
                Timezone
                <input
                  value={birth.timezone}
                  onChange={(e) =>
                    setBirth({ ...birth, timezone: e.target.value })
                  }
                />
              </label>
              <button
                className="button wide"
                type="submit"
                disabled={
                  !birthValid || (mode !== "fixture" && mode !== "provider")
                }
              >
                Calculate Saturn return
              </button>
              <p className="wide privacy-note">
                {mode === "fixture" || mode === "provider"
                  ? `${mode === "fixture" ? "Fixture" : "Provider"} calculations send inputs once to the no-store server route. `
                  : "The form does not transmit while the licensed provider is unavailable. "}
                Inputs are never logged or persisted. Closing or refreshing the
                tab clears the values.
              </p>
              {saturnReturn && (
                <div className="wide privacy-note" role="status">
                  <strong>{title(saturnReturn.status)}</strong> ·{" "}
                  {saturnReturn.windows.length} bounded window
                  {saturnReturn.windows.length === 1 ? "" : "s"} ·{" "}
                  {saturnReturn.windows.reduce(
                    (count, window) => count + window.passes.length,
                    0,
                  )}{" "}
                  exact pass
                  {saturnReturn.windows.reduce(
                    (count, window) => count + window.passes.length,
                    0,
                  ) === 1
                    ? ""
                    : "es"}
                </div>
              )}
            </form>
          )}
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
            Gate and line coordinates only. No bodygraph, type, authority, or
            interpretation.
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

function EmptyState({ mode }: { mode: DataMode }) {
  return (
    <div className="empty-state">
      <span aria-hidden="true">{mode === "loading" ? "◌" : "×"}</span>
      <strong>
        {mode === "loading" ? "Awaiting calculation" : "Provider unavailable"}
      </strong>
      <p>
        {mode === "loading"
          ? "Establishing a typed server connection."
          : "No astronomical values are substituted or estimated."}
      </p>
    </div>
  );
}
