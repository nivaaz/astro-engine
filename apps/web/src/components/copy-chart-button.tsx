"use client";

import type {
  CurrentSky,
  GeoLocation,
  UtcInstant,
  WholeSignChart,
} from "@sukara/astro-schema";
import { useState } from "react";

type CopyChartRequest =
  | Readonly<{
      context: "current-sky";
      chartType: string;
      date: UtcInstant;
      currentSky: CurrentSky;
      wholeSignChart?: WholeSignChart;
    }>
  | Readonly<{
      context: "event" | "lunation";
      chartType: string;
      instant: UtcInstant;
      location?: GeoLocation;
    }>
  | Readonly<{
      context: "saturn-return-pass";
      chartType: string;
      instant: UtcInstant;
      location: GeoLocation;
    }>;

export function CopyChartButton({
  request,
  disabled = false,
  variant = "primary",
}: Readonly<{
  request: CopyChartRequest | null;
  disabled?: boolean;
  variant?: "primary" | "quiet";
}>) {
  const [status, setStatus] = useState("");

  async function copyChart() {
    if (request === null) return;
    setStatus("Preparing chart…");
    try {
      const response = await fetch("/api/format", {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
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
        throw new Error("Chart copy failed");
      await navigator.clipboard.writeText(body.output);
      setStatus("Copied for AI");
    } catch {
      setStatus("Copy failed");
    }
    window.setTimeout(() => setStatus(""), 2400);
  }

  return (
    <span className={`copy-action copy-action-${variant}`}>
      <button
        className="button"
        type="button"
        onClick={() => void copyChart()}
        disabled={disabled || status === "Preparing chart…"}
      >
        Copy chart for AI
      </button>
      <span role="status" aria-live="polite">
        {status}
      </span>
    </span>
  );
}

export type { CopyChartRequest };
