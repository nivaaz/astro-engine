import { describe, expect, it } from "vitest";
import {
  AspectSchema,
  CivilTimeInputSchema,
  EastLongitudeDegreesSchema,
  EventSearchRequestSchema,
  IanaTimezoneSchema,
  PlanetPositionSchema,
  PositionRequestSchema,
  SaturnReturnResultSchema,
  UtcInstantSchema,
  validatePositionBatch,
  WholeSignChartSchema,
} from "@sukara/astro-schema";

const instant = "2026-07-11T00:00:00.000Z";
const metadata = {
  schemaVersion: "1.0.0",
  algorithmVersion: "test-v1",
  calculatedAt: instant,
  zodiac: "tropical",
  frame: "tropical-geocentric-apparent-ecliptic-of-date-v1",
  validFor: {
    start: "2026-07-10T23:59:00.000Z",
    end: "2026-07-11T00:01:00.000Z",
  },
  provenance: {
    providerId: "fixture",
    providerVersion: "1",
    dataVersion: "test",
    quality: "fixture",
  },
} as const;

describe("canonical primitives", () => {
  it("accepts only canonical UTC instants", () => {
    expect(UtcInstantSchema.safeParse(instant).success).toBe(true);
    expect(UtcInstantSchema.safeParse("2026-07-11T00:00:00Z").success).toBe(
      false,
    );
    expect(
      UtcInstantSchema.safeParse("2026-07-11T10:00:00.000+10:00").success,
    ).toBe(false);
  });

  it("enforces east-positive canonical longitude and IANA zones", () => {
    expect(EastLongitudeDegreesSchema.safeParse(151.2093).success).toBe(true);
    expect(EastLongitudeDegreesSchema.safeParse(180).success).toBe(false);
    expect(EastLongitudeDegreesSchema.safeParse(-0).success).toBe(false);
    expect(IanaTimezoneSchema.safeParse("Australia/Sydney").success).toBe(true);
    expect(IanaTimezoneSchema.safeParse("AEST").success).toBe(false);
  });

  it("requires explicit ambiguous-time handling for local civil input", () => {
    const input = {
      localDateTime: "2026-04-05T02:30:00.000",
      timezone: "Australia/Sydney",
    };
    expect(CivilTimeInputSchema.safeParse(input).success).toBe(false);
    expect(
      CivilTimeInputSchema.safeParse({ ...input, fold: "later" }).success,
    ).toBe(true);
  });
});

describe("astronomy contracts", () => {
  it("derives retrograde strictly from negative longitude speed", () => {
    const base = {
      body: "saturn",
      instant,
      longitude: 7,
      longitudeSpeed: -0.02,
      sign: "aries",
      signDegree: 7,
    } as const;
    expect(
      PlanetPositionSchema.safeParse({ ...base, retrograde: true }).success,
    ).toBe(true);
    expect(
      PlanetPositionSchema.safeParse({ ...base, retrograde: false }).success,
    ).toBe(false);
  });

  it("rejects reversed aspect pairs and loose orbs", () => {
    const aspect = {
      bodyA: "sun",
      bodyB: "saturn",
      type: "square",
      angle: 91,
      orb: 1,
      phase: "applying",
    } as const;
    expect(AspectSchema.safeParse(aspect).success).toBe(true);
    expect(
      AspectSchema.safeParse({ ...aspect, bodyA: "saturn", bodyB: "sun" })
        .success,
    ).toBe(false);
    expect(AspectSchema.safeParse({ ...aspect, orb: 3.01 }).success).toBe(
      false,
    );
  });
});

describe("bounded and atomic provider contracts", () => {
  it("rejects duplicate bodies and event windows over 93 days", () => {
    expect(
      PositionRequestSchema.safeParse({ instant, bodies: ["sun", "sun"] })
        .success,
    ).toBe(false);
    expect(
      EventSearchRequestSchema.safeParse({
        window: { start: instant, end: "2026-10-13T00:00:00.000Z" },
        limit: 100,
      }).success,
    ).toBe(false);
  });

  it("fails closed when a provider batch is partial or at another instant", () => {
    const request = PositionRequestSchema.parse({
      instant,
      bodies: ["sun", "moon"],
    });
    const partial = {
      instant,
      positions: [
        { body: "sun", instant, longitude: 108, longitudeSpeed: 0.95 },
      ],
      provenance: {
        providerId: "fixture",
        providerVersion: "1",
        dataVersion: "test",
        quality: "fixture",
      },
    };

    expect(validatePositionBatch(request, partial)).toMatchObject({
      ok: false,
      error: { code: "invalid-provider-output" },
    });
  });
});

describe("local and personal lifecycle contracts", () => {
  it("validates exact Whole Sign cusp progression", () => {
    const chart = {
      metadata,
      location: {
        latitude: -33.8688,
        longitude: 151.2093,
        timezone: "Australia/Sydney",
      },
      ascendant: 91,
      midheaven: 10,
      firstHouseSign: "cancer",
      cusps: [90, 120, 150, 180, 210, 240, 270, 300, 330, 0, 30, 60],
      placements: [{ body: "sun", house: 1 }],
    } as const;

    const parsedChart = WholeSignChartSchema.safeParse(chart);
    expect(
      parsedChart.success,
      parsedChart.success ? undefined : parsedChart.error.message,
    ).toBe(true);
    expect(
      WholeSignChartSchema.safeParse({
        ...chart,
        cusps: [91, ...chart.cusps.slice(1)],
      }).success,
    ).toBe(false);
  });

  it("derives Saturn lifecycle status from explicit asOf and half-open windows", () => {
    const windowId = `sat_window_v1_${"a".repeat(64)}`;
    const result = {
      metadata,
      algorithmVersion: "saturn-return-v1",
      classification: "session-personal",
      natalSaturnLongitude: 7,
      orb: 3,
      asOf: instant,
      status: "active",
      statusWindowId: windowId,
      windows: [
        {
          id: windowId,
          interval: {
            start: "2026-07-01T00:00:00.000Z",
            end: "2026-08-01T00:00:00.000Z",
          },
          edge: "complete",
          passes: [],
        },
      ],
    } as const;

    const parsedReturn = SaturnReturnResultSchema.safeParse(result);
    expect(
      parsedReturn.success,
      parsedReturn.success ? undefined : parsedReturn.error.message,
    ).toBe(true);
    expect(
      SaturnReturnResultSchema.safeParse({ ...result, status: "complete" })
        .success,
    ).toBe(false);
  });
});
