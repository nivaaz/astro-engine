"use client";

import { useEffect, useRef, useState } from "react";
import {
  GeoLocationSchema,
  type SaturnReturnResult,
  type UtcInstant,
} from "@sukara/astro-schema";
import { CopyChartButton } from "../../components/copy-chart-button";
import { SiteHeader } from "../../components/site-header";
import {
  cityLabel,
  findMajorCity,
  MAJOR_CITIES,
  type MajorCity,
} from "../../lib/major-cities";
import {
  resolveLocalCivilTime,
  type CivilTimeResolution,
} from "../../lib/local-time";
import {
  validateSaturnReturnForm,
  type SaturnFormErrors,
} from "../../lib/saturn-return-validation";

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

function offsetLabel(instant: UtcInstant, timezone: string): string {
  return (
    new Intl.DateTimeFormat("en-AU", {
      timeZone: timezone,
      timeZoneName: "longOffset",
    })
      .formatToParts(new Date(instant))
      .find(({ type }) => type === "timeZoneName")?.value ?? "UTC"
  );
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
  const [formErrors, setFormErrors] = useState<SaturnFormErrors>({
    date: "",
    city: "",
    time: "",
  });
  const [ambiguousTime, setAmbiguousTime] = useState<Extract<
    CivilTimeResolution,
    { kind: "ambiguous" }
  > | null>(null);
  const [foldChoice, setFoldChoice] = useState<"earlier" | "later" | "">("");
  const dateRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const foldRef = useRef<HTMLSelectElement>(null);
  const calculationRequest = useRef<AbortController | null>(null);
  const noonApproximation = time === "";

  useEffect(() => () => calculationRequest.current?.abort(), []);

  function invalidateCalculation() {
    calculationRequest.current?.abort();
    calculationRequest.current = null;
    setResult(null);
    setStatus("idle");
    setMessage("");
  }

  function resetCivilChoice() {
    invalidateCalculation();
    setAmbiguousTime(null);
    setFoldChoice("");
    setFormErrors((current) => ({ ...current, time: "" }));
  }

  function selectCity(value: string) {
    resetCivilChoice();
    setCityText(value);
    setCity(findMajorCity(value) ?? null);
    setFormErrors((current) => ({ ...current, city: "" }));
  }

  async function calculate() {
    setResult(null);
    const selectedCity = city ?? findMajorCity(cityText);
    const nextErrors = validateSaturnReturnForm({
      date,
      citySelected: selectedCity !== undefined && selectedCity !== null,
    });
    if (nextErrors.date !== "" || nextErrors.city !== "") {
      setFormErrors(nextErrors);
      setStatus("error");
      setMessage("");
      window.requestAnimationFrame(() => {
        if (nextErrors.date !== "") dateRef.current?.focus();
        else cityRef.current?.focus();
      });
      return;
    }
    if (selectedCity === undefined || selectedCity === null) return;
    const resolution = resolveLocalCivilTime(
      date,
      time || "12:00",
      selectedCity.timezone,
    );
    if (resolution.kind === "nonexistent" || resolution.kind === "invalid") {
      setStatus("error");
      setMessage("");
      setFormErrors({
        date: "",
        city: "",
        time:
          resolution.kind === "nonexistent"
            ? "This local date and time do not exist because the clocks moved forward. Enter another time or date."
            : "Enter a valid local birth date and time.",
      });
      timeRef.current?.focus();
      return;
    }
    if (resolution.kind === "ambiguous" && foldChoice === "") {
      setAmbiguousTime(resolution);
      setStatus("error");
      setMessage("");
      setFormErrors({
        date: "",
        city: "",
        time: "This local time occurs twice. Choose its first or second occurrence.",
      });
      window.requestAnimationFrame(() => foldRef.current?.focus());
      return;
    }
    const birthInstant =
      resolution.kind === "resolved"
        ? resolution.instant
        : resolution[foldChoice as "earlier" | "later"];
    setFormErrors({ date: "", city: "", time: "" });
    const asOf = new Date();
    const start = new Date(asOf);
    start.setUTCFullYear(start.getUTCFullYear() - 2);
    const end = new Date(asOf);
    end.setUTCFullYear(end.getUTCFullYear() + 32);
    setStatus("calculating");
    setUsedNoon(noonApproximation);
    setMessage("Searching the bounded Saturn-return range…");
    setResult(null);
    const request = new AbortController();
    calculationRequest.current?.abort();
    calculationRequest.current = request;
    try {
      const response = await fetch("/api/sky", {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        signal: request.signal,
        body: JSON.stringify({
          operation: "saturn-return",
          birthInstant,
          asOf: asOf.toISOString(),
          searchWindow: { start: start.toISOString(), end: end.toISOString() },
          orb: 2,
        }),
      });
      const body: unknown = await response.json();
      if (calculationRequest.current !== request) return;
      const value = providerValue<SaturnReturnResult>(body, response.ok);
      setCity(selectedCity);
      setResult(value);
      setStatus("ready");
      setMessage(
        "Saturn-return calculation complete. Exact passes are shown below.",
      );
    } catch {
      if (calculationRequest.current !== request || request.signal.aborted)
        return;
      setStatus("unavailable");
      setMessage(
        "Saturn return is unavailable without a configured licensed provider.",
      );
    }
  }

  return (
    <main>
      <SiteHeader activeRoute="saturn" />
      <section className="route-hero">
        <p className="eyebrow">Session-only calculation</p>
        <h1>Saturn return</h1>
        <p className="lede">
          Find the bounded dates when transiting Saturn returns to your natal
          Saturn longitude. Dates only; no interpretation.
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
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void calculate();
          }}
        >
          <label>
            Date
            <input
              ref={dateRef}
              type="date"
              value={date}
              onChange={(event) => {
                resetCivilChoice();
                setDate(event.target.value);
                setFormErrors((current) => ({ ...current, date: "" }));
              }}
              required
              aria-invalid={formErrors.date !== ""}
              aria-describedby={formErrors.date ? "date-error" : undefined}
            />
            {formErrors.date && (
              <span id="date-error" className="form-error" role="alert">
                {formErrors.date}
              </span>
            )}
          </label>
          <label>
            Local time <span className="optional">optional</span>
            <input
              ref={timeRef}
              type="time"
              value={time}
              onChange={(event) => {
                resetCivilChoice();
                setTime(event.target.value);
              }}
              aria-invalid={formErrors.time !== ""}
              aria-describedby={
                formErrors.time ? "time-error time-precision" : "time-precision"
              }
            />
            {formErrors.time && (
              <span id="time-error" className="form-error" role="alert">
                {formErrors.time}
              </span>
            )}
          </label>
          {ambiguousTime && city && (
            <label className="wide">
              Repeated local time
              <select
                ref={foldRef}
                value={foldChoice}
                onChange={(event) => {
                  invalidateCalculation();
                  const value = event.target.value;
                  setFoldChoice(
                    value === "earlier" || value === "later" ? value : "",
                  );
                  setFormErrors((current) => ({ ...current, time: "" }));
                }}
              >
                <option value="">Choose first or second occurrence</option>
                <option value="earlier">
                  First occurrence (
                  {offsetLabel(ambiguousTime.earlier, city.timezone)})
                </option>
                <option value="later">
                  Second occurrence (
                  {offsetLabel(ambiguousTime.later, city.timezone)})
                </option>
              </select>
            </label>
          )}
          <label className="wide">
            Supported major city
            <input
              ref={cityRef}
              list="saturn-city-options"
              value={cityText}
              onChange={(event) => selectCity(event.target.value)}
              placeholder="Sydney, Australia"
              autoComplete="off"
              required
              aria-invalid={formErrors.city !== ""}
              aria-describedby={formErrors.city ? "city-error" : undefined}
            />
            {formErrors.city && (
              <span id="city-error" className="form-error" role="alert">
                {formErrors.city}
              </span>
            )}
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
                      variant="quiet"
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
