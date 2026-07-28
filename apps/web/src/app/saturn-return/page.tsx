"use client";

import { useState } from "react";
import {
  GeoLocationSchema,
  type SaturnReturnResult,
  type UtcInstant,
} from "@sukara/astro-schema";
import { CopyChartButton } from "../../components/copy-chart-button";
import {
  cityLabel,
  findMajorCity,
  MAJOR_CITIES,
  type MajorCity,
} from "../../lib/major-cities";
import { localCivilToUtc } from "../../lib/local-time";

type Status = "idle" | "calculating" | "ready" | "error" | "unavailable";

function title(value: string): string {
  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function localTime(value: string, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-AU", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: timezone,
    }).format(new Date(value));
  } catch {
    return new Intl.DateTimeFormat("en-AU", {
      dateStyle: "long",
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

export default function SaturnReturnPage() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [cityText, setCityText] = useState("");
  const [city, setCity] = useState<MajorCity | null>(null);
  const [result, setResult] = useState<SaturnReturnResult | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [usedNoon, setUsedNoon] = useState(false);
  const noonApproximation = time === "";

  function selectCity(value: string) {
    setCityText(value);
    setCity(findMajorCity(value) ?? null);
  }

  async function calculate() {
    const selectedCity = city ?? findMajorCity(cityText);
    if (date === "" || selectedCity === undefined || selectedCity === null) {
      setStatus("error");
      setMessage("Enter a birth date and choose a supported major city.");
      return;
    }
    const birthInstant = localCivilToUtc(
      date,
      time || "12:00",
      selectedCity.timezone,
    );
    if (birthInstant === null) {
      setStatus("error");
      setMessage("The local birth date and time could not be resolved.");
      return;
    }
    const asOf = new Date();
    const start = new Date(asOf);
    start.setUTCFullYear(start.getUTCFullYear() - 2);
    const end = new Date(asOf);
    end.setUTCFullYear(end.getUTCFullYear() + 32);
    setStatus("calculating");
    setUsedNoon(noonApproximation);
    setMessage("Searching the bounded Saturn-return range…");
    setResult(null);
    try {
      const response = await fetch("/api/sky", {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          operation: "saturn-return",
          birthInstant,
          asOf: asOf.toISOString(),
          searchWindow: { start: start.toISOString(), end: end.toISOString() },
          orb: 2,
        }),
      });
      const body: unknown = await response.json();
      const value = providerValue<SaturnReturnResult>(body, response.ok);
      setCity(selectedCity);
      setResult(value);
      setStatus("ready");
      setMessage(
        "Saturn-return calculation complete. Exact passes are shown below.",
      );
    } catch {
      setStatus("unavailable");
      setMessage(
        "Saturn return is unavailable without a configured licensed provider.",
      );
    }
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Astro Engine home">
          <span className="brand-mark" aria-hidden="true">
            ✣
          </span>
          <span>Astro Engine</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="/">Current sky</a>
          <a href="/events">Events</a>
          <a href="/saturn-return" aria-current="page">
            Saturn return
          </a>
        </nav>
        <a
          className="github-link"
          href="https://github.com/nivaaz/astro-engine"
        >
          GitHub <span aria-hidden="true">↗</span>
        </a>
      </header>
      <section className="route-hero">
        <p className="eyebrow">Public V1 · session-only calculation</p>
        <h1>Saturn return</h1>
        <p className="lede">
          A bounded factual search for the windows when transiting Saturn
          returns to your natal Saturn longitude. This route reports dates,
          local times, and exact pass direction; it does not interpret them.
        </p>
      </section>
      <section
        className="data-section route-section"
        aria-labelledby="saturn-form-title"
      >
        <div className="section-heading">
          <div>
            <p className="section-index">01 / Birth inputs</p>
            <h2 id="saturn-form-title">Find your return</h2>
          </div>
          <p className="section-note">Held in this tab only</p>
        </div>
        <p className="card-copy">
          Birth date and supported city are required. Local birth time is
          optional. If omitted, the calculation uses 12:00 local time as a
          deterministic approximation.
        </p>
        <form
          className="birth-form saturn-form"
          onSubmit={(event) => {
            event.preventDefault();
            void calculate();
          }}
        >
          <label>
            Date
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>
          <label>
            Local time <span className="optional">optional</span>
            <input
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              aria-describedby="time-precision"
            />
          </label>
          <label className="wide">
            Supported major city
            <input
              list="saturn-city-options"
              value={cityText}
              onChange={(event) => selectCity(event.target.value)}
              placeholder="Sydney, Australia"
              autoComplete="off"
              required
            />
          </label>
          <datalist id="saturn-city-options">
            {MAJOR_CITIES.map((item) => (
              <option key={cityLabel(item)} value={cityLabel(item)} />
            ))}
          </datalist>
          <p
            id="time-precision"
            className={`wide privacy-note ${noonApproximation ? "precision-notice" : ""}`}
            role={noonApproximation ? "status" : undefined}
          >
            {noonApproximation
              ? "No local birth time entered: local noon (12:00) will be used as the deterministic approximation."
              : "Exact local birth time will be used."}
          </p>
          <button
            className="button wide"
            type="submit"
            disabled={status === "calculating"}
          >
            {status === "calculating"
              ? "Calculating…"
              : "Calculate Saturn return"}
          </button>
        </form>
        <p className="privacy-note">
          Inputs are sent only once to the no-store calculation route. They are
          not written to the URL, browser storage, logs, or service-worker
          cache. Refreshing or leaving this tab clears them.
        </p>
        {message && (
          <p
            className={`privacy-note ${status === "error" || status === "unavailable" ? "error-note" : ""}`}
            role="status"
            aria-live="polite"
          >
            {message}
          </p>
        )}
      </section>
      {result && city && (
        <SaturnResults
          result={result}
          city={city}
          noonApproximation={usedNoon}
        />
      )}
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
          <a href="/events">View upcoming events</a>
        </div>
      </footer>
    </main>
  );
}

function SaturnResults({
  result,
  city,
  noonApproximation,
}: Readonly<{
  result: SaturnReturnResult;
  city: MajorCity;
  noonApproximation: boolean;
}>) {
  const passCount = result.windows.reduce(
    (count, window) => count + window.passes.length,
    0,
  );
  const location = GeoLocationSchema.parse({
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: city.timezone,
  });
  return (
    <section
      className="data-section route-section"
      aria-labelledby="saturn-results-title"
    >
      <div className="section-heading">
        <div>
          <p className="section-index">02 / Exact timing</p>
          <h2 id="saturn-results-title">{title(result.status)} return</h2>
        </div>
        <p className="section-note">
          {result.windows.length} window{result.windows.length === 1 ? "" : "s"}{" "}
          · {passCount} exact pass{passCount === 1 ? "" : "es"}
        </p>
      </div>
      {noonApproximation && (
        <p className="precision-notice" role="status">
          This result uses local noon (12:00) because no birth time was
          provided. Recalculate with a local time for a more precise natal
          Saturn coordinate.
        </p>
      )}
      {result.windows.length === 0 ? (
        <div className="empty-state">
          <span aria-hidden="true">×</span>
          <strong>No Saturn return window in the bounded range.</strong>
          <p>No astronomical values are substituted or estimated.</p>
        </div>
      ) : (
        <div className="return-windows">
          {result.windows.map((window) => (
            <article className="return-window" key={window.id}>
              <p className="section-index">Return window · {window.edge}</p>
              <h3>
                {localTime(window.interval.start, city.timezone)} —{" "}
                {localTime(window.interval.end, city.timezone)}
              </h3>
              <div className="pass-list">
                {window.passes.map((pass) => (
                  <div className="pass-row" key={pass.id}>
                    <div>
                      <strong>Pass {pass.sequence}</strong>
                      <span>{localTime(pass.exactAt, city.timezone)}</span>
                      <small>{title(pass.direction)}</small>
                    </div>
                    <CopyChartButton
                      request={{
                        context: "saturn-return-pass",
                        chartType: `Saturn return pass ${pass.sequence}`,
                        instant: pass.exactAt as UtcInstant,
                        location,
                      }}
                    />
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
