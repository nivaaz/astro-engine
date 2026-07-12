import {
  CurrentSkySchema,
  EventSearchResultSchema,
  FRAME_VERSION,
  HUMAN_DESIGN_MAPPING_VERSION,
  HumanDesignTransitResultSchema,
  SCHEMA_VERSION,
} from "@sukara/astro-schema";
import type { SkyTransportResponse } from "./sky-transport";

const calculatedAt = "2026-01-01T00:00:00.000Z";
const validFor = { start: calculatedAt, end: "2026-01-01T00:00:01.000Z" };
const provenance = {
  providerId: "public-v1-ui-fixture",
  providerVersion: "1.0.0",
  dataVersion: "contract-fixture-1",
  quality: "fixture" as const,
};
const metadata = (algorithmVersion: string) => ({
  schemaVersion: SCHEMA_VERSION,
  algorithmVersion,
  calculatedAt,
  zodiac: "tropical" as const,
  frame: FRAME_VERSION,
  validFor,
  provenance,
});

/** Static canonical fixture. It is never represented as current astronomical data. */
export function fixtureSky(): SkyTransportResponse {
  const signs = [
    "aries",
    "taurus",
    "gemini",
    "cancer",
    "leo",
    "virgo",
    "libra",
    "scorpio",
    "sagittarius",
    "capricorn",
    "aquarius",
    "pisces",
  ] as const;
  const rawPositions = [
    ["sun", 280.72, 1],
    ["moon", 78.31, 12],
    ["mercury", 267.48, 0.8],
    ["venus", 277.15, 1.1],
    ["mars", 282.64, 0.7],
    ["jupiter", 111.37, -0.1],
    ["saturn", 356.14, 0.08],
    ["uranus", 57.91, -0.03],
    ["neptune", 359.52, 0.02],
    ["pluto", 302.74, 0.01],
  ] as const;
  const currentSky = CurrentSkySchema.parse({
    metadata: metadata("current-sky-v1"),
    positions: rawPositions.map(([body, longitude, longitudeSpeed]) => ({
      body,
      instant: calculatedAt,
      longitude,
      longitudeSpeed,
      sign: signs[Math.floor(longitude / 30)],
      signDegree: longitude % 30,
      retrograde: longitudeSpeed < 0,
    })),
    moonPhase: { phase: "waxing-gibbous", phaseAngle: 157.59 },
    aspects: [
      {
        bodyA: "sun",
        bodyB: "mars",
        type: "conjunction",
        angle: 0,
        orb: 1.92,
        phase: "applying",
      },
      {
        bodyA: "saturn",
        bodyB: "neptune",
        type: "conjunction",
        angle: 0,
        orb: 2.62,
        phase: "applying",
      },
    ],
  });
  const upcomingEvents = EventSearchResultSchema.parse({
    metadata: metadata("major-events-v1"),
    algorithmVersion: "major-events-v1",
    requestedWindow: { start: calculatedAt, end: "2026-01-31T00:00:00.000Z" },
    events: [
      {
        id: `evt_v1_${"1".repeat(64)}`,
        exactAt: "2026-01-03T18:12:00.000Z",
        significance: "notable",
        kind: "ingress",
        body: "venus",
        sign: "aquarius",
      },
      {
        id: `evt_v1_${"2".repeat(64)}`,
        exactAt: "2026-01-10T09:41:00.000Z",
        significance: "major",
        kind: "station",
        body: "jupiter",
        direction: "direct",
        longitude: 111.2,
      },
      {
        id: `evt_v1_${"3".repeat(64)}`,
        exactAt: "2026-01-17T04:06:00.000Z",
        significance: "major",
        kind: "aspect",
        bodyA: "saturn",
        bodyB: "neptune",
        aspect: "conjunction",
        exactLongitude: 359.1,
      },
    ],
    complete: true,
    truncatedAtLimit: false,
    exactTimeToleranceSeconds: 1,
  });
  const humanDesign = HumanDesignTransitResultSchema.parse({
    metadata: metadata("human-design-transits-v1"),
    transits: [
      {
        body: "sun",
        sourceLongitude: 280.72,
        gate: 38,
        line: 2,
        mappingVersion: HUMAN_DESIGN_MAPPING_VERSION,
      },
      {
        body: "earth",
        sourceLongitude: 100.72,
        gate: 39,
        line: 2,
        mappingVersion: HUMAN_DESIGN_MAPPING_VERSION,
      },
      {
        body: "moon",
        sourceLongitude: 78.31,
        gate: 12,
        line: 5,
        mappingVersion: HUMAN_DESIGN_MAPPING_VERSION,
      },
    ],
  });
  return {
    mode: "fixture",
    currentSky,
    upcomingEvents,
    humanDesign,
  };
}
