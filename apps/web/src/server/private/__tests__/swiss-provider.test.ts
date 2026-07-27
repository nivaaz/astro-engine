import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  AnglesRequestSchema,
  EventSearchRequestSchema,
  PositionRequestSchema,
  SaturnReturnRequestSchema,
} from "@sukara/astro-schema";
import {
  calculateSaturnReturn,
  searchUpcomingMajorEvents,
} from "@sukara/astro-engine";
import { resolveSwissEphemerisProvider } from "../swiss-provider";

const root = process.cwd();
const ephemerisPath = path.join(root, "apps", "web", ".private", "ephemeris");
const golden = JSON.parse(
  readFileSync(
    path.join(root, "tests", "fixtures", "swiss-golden.json"),
    "utf8",
  ),
) as {
  instant: string;
  positions: Record<string, { longitude: number; longitudeSpeed: number }>;
  angles: {
    latitude: number;
    longitude: number;
    ascendant: number;
    midheaven: number;
  };
  eventTiming: {
    window: { start: string; end: string };
    firstExactAt: string;
    firstKind: string;
  };
  saturnReturn: {
    birthInstant: string;
    natalSaturnLongitude: number;
    asOf: string;
    searchWindow: { start: string; end: string };
    orb: number;
    status: string;
    window: { start: string; end: string };
  };
  reference: { tolerance: Record<string, number> };
};

const ready =
  existsSync(path.join(ephemerisPath, "sepl_18.se1")) &&
  existsSync(path.join(ephemerisPath, "semo_18.se1"));

describe.skipIf(!ready)("licensed Swiss provider golden validation", () => {
  it("matches the official swetest positions and speeds", async () => {
    process.env["ASTRO_ENGINE_EPHEMERIS_PATH"] = ephemerisPath;
    const provider = await resolveSwissEphemerisProvider();
    const result = await provider.getPositions(
      PositionRequestSchema.parse({
        instant: golden.instant,
        bodies: Object.keys(golden.positions),
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    for (const position of result.value.positions) {
      const expected = golden.positions[position.body]!;
      expect(position.longitude).toBeCloseTo(expected.longitude, 6);
      expect(position.longitudeSpeed).toBeCloseTo(expected.longitudeSpeed, 6);
    }
    expect(result.value.provenance.quality).toBe("production");
  });

  it("matches official swetest Whole Sign angles", async () => {
    process.env["ASTRO_ENGINE_EPHEMERIS_PATH"] = ephemerisPath;
    const provider = await resolveSwissEphemerisProvider();
    const result = await provider.getLocalAngles(
      AnglesRequestSchema.parse({
        instant: golden.instant,
        location: {
          latitude: golden.angles.latitude,
          longitude: golden.angles.longitude,
          timezone: "UTC",
        },
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.ascendant).toBeCloseTo(golden.angles.ascendant, 6);
    expect(result.value.midheaven).toBeCloseTo(golden.angles.midheaven, 6);
  });

  it("keeps event timing and Saturn-return windows stable from the licensed provider", async () => {
    process.env["ASTRO_ENGINE_EPHEMERIS_PATH"] = ephemerisPath;
    const provider = await resolveSwissEphemerisProvider();
    const events = await searchUpcomingMajorEvents(
      provider,
      EventSearchRequestSchema.parse({
        window: golden.eventTiming.window,
        limit: 5,
      }),
    );
    expect(events.ok).toBe(true);
    if (!events.ok) return;
    expect(events.value.events[0]?.exactAt).toBe(
      golden.eventTiming.firstExactAt,
    );
    expect(events.value.events[0]?.kind).toBe(golden.eventTiming.firstKind);

    const saturn = await calculateSaturnReturn(
      provider,
      SaturnReturnRequestSchema.parse({
        classification: "session-personal",
        natalSaturnLongitude: golden.saturnReturn.natalSaturnLongitude,
        birthInstant: golden.saturnReturn.birthInstant,
        asOf: golden.saturnReturn.asOf,
        searchWindow: golden.saturnReturn.searchWindow,
        orb: golden.saturnReturn.orb,
      }),
    );
    expect(saturn.ok).toBe(true);
    if (!saturn.ok) return;
    expect(saturn.value.status).toBe(golden.saturnReturn.status);
    expect(saturn.value.windows[0]?.interval).toEqual(
      golden.saturnReturn.window,
    );
  });
});
