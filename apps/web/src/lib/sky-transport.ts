import type {
  CurrentSky,
  EventSearchResult,
  HumanDesignTransitResult,
} from "@sukara/astro-schema";

export type SkyTransportResponse = Readonly<{
  mode: "fixture" | "provider";
  currentSky: CurrentSky;
  upcomingEvents: EventSearchResult;
  humanDesign: HumanDesignTransitResult;
}>;

export type SkyTransportError = Readonly<{
  ok: false;
  error: Readonly<{
    code: "provider-unavailable" | "invalid-provider-output";
    message: string;
    retryable: boolean;
  }>;
}>;

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Small browser boundary check. Canonical Zod validation remains server-side. */
export function parseSkyTransportResponse(
  value: unknown,
): SkyTransportResponse | null {
  if (
    !record(value) ||
    (value["mode"] !== "fixture" && value["mode"] !== "provider")
  )
    return null;
  const current = value["currentSky"];
  const events = value["upcomingEvents"];
  const humanDesign = value["humanDesign"];
  if (!record(current) || !record(events) || !record(humanDesign)) return null;
  if (
    !record(current["metadata"]) ||
    !record(current["moonPhase"]) ||
    !Array.isArray(current["positions"]) ||
    !Array.isArray(current["aspects"])
  )
    return null;
  if (
    !Array.isArray(events["events"]) ||
    !Array.isArray(humanDesign["transits"])
  )
    return null;
  return value as SkyTransportResponse;
}
