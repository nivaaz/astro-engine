import { describe, expect, it } from "vitest";
import {
  FRAME_VERSION,
  HUMAN_DESIGN_MAPPING_VERSION,
  SATURN_RETURN_ALGORITHM_VERSION,
  SCHEMA_VERSION,
} from "@sukara/astro-schema";
import {
  AI_CHART_PROMPT,
  formatAiChartCopy,
  formatArcminutes,
  formatJson,
  formatMarkdown,
  formatPromptText,
} from "../index.js";

const metadata = {
  schemaVersion: SCHEMA_VERSION,
  algorithmVersion: "fixture-v1",
  calculatedAt: "2026-07-11T00:00:00.000Z",
  zodiac: "tropical",
  frame: FRAME_VERSION,
  validFor: {
    start: "2026-07-11T00:00:00.000Z",
    end: "2026-07-11T00:05:00.000Z",
  },
  provenance: {
    providerId: "golden|fixture\nsource",
    providerVersion: "1.2.3",
    dataVersion: "reference-2026-07-11",
    quality: "fixture",
  },
} as const;

const currentSky = {
  metadata,
  positions: [
    {
      body: "sun",
      instant: metadata.calculatedAt,
      longitude: 109.1234567894,
      longitudeSpeed: 0.953,
      sign: "cancer",
      signDegree: 19.1234567894,
      retrograde: false,
    },
    {
      body: "moon",
      instant: metadata.calculatedAt,
      longitude: 42,
      longitudeSpeed: 13.2,
      sign: "taurus",
      signDegree: 12,
      retrograde: false,
    },
  ],
  moonPhase: { phase: "waning-crescent", phaseAngle: 292.876543211 },
  aspects: [
    {
      bodyA: "sun",
      bodyB: "moon",
      type: "sextile",
      angle: 60,
      orb: 0.125,
      phase: "applying",
    },
  ],
} as const;

const hashA = "a".repeat(64);
const hashB = "b".repeat(64);
const saturnReturn = {
  metadata: { ...metadata, algorithmVersion: SATURN_RETURN_ALGORITHM_VERSION },
  algorithmVersion: SATURN_RETURN_ALGORITHM_VERSION,
  classification: "session-personal",
  natalSaturnLongitude: 281.5,
  orb: 2,
  asOf: "2055-01-15T00:00:00.000Z",
  status: "active",
  statusWindowId: `sat_window_v1_${hashA}`,
  windows: [
    {
      id: `sat_window_v1_${hashA}`,
      interval: {
        start: "2055-01-01T00:00:00.000Z",
        end: "2055-03-01T00:00:00.000Z",
      },
      edge: "complete",
      passes: [
        {
          id: `sat_pass_v1_${hashB}`,
          sequence: 1,
          exactAt: "2055-02-01T00:00:00.000Z",
          direction: "direct",
          windowId: `sat_window_v1_${hashA}`,
        },
      ],
    },
  ],
} as const;

const humanDesign = {
  metadata,
  transits: [
    {
      body: "sun",
      sourceLongitude: 109.1234567894,
      gate: 53,
      line: 2,
      mappingVersion: HUMAN_DESIGN_MAPPING_VERSION,
    },
    {
      body: "earth",
      sourceLongitude: 289.1234567894,
      gate: 54,
      line: 2,
      mappingVersion: HUMAN_DESIGN_MAPPING_VERSION,
    },
  ],
} as const;

describe("canonical formatters", () => {
  it.each([
    [29.999, "30°00′"],
    [359.999, "0°00′"],
    [360, "0°00′"],
    [-0.001, "0°00′"],
    [12.5, "12°30′"],
  ])("formats %s to nearest arcminute", (value, expected) => {
    expect(formatArcminutes(value)).toBe(expected);
  });

  it("formats one concise AI chart payload from canonical objects", () => {
    const output = formatAiChartCopy({
      chartType: "Current sky",
      date: currentSky.metadata.calculatedAt,
      currentSky,
      wholeSignChart: {
        metadata: { ...metadata, algorithmVersion: "whole-sign-v1" },
        location: {
          latitude: -33.8688,
          longitude: 151.2093,
          timezone: "Australia/Sydney",
        },
        ascendant: 0,
        midheaven: 270,
        firstHouseSign: "aries",
        cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
        placements: [
          { body: "sun", house: 1 },
          { body: "moon", house: 2 },
        ],
      },
    });
    expect(output).toContain("# Current sky");
    expect(output).toContain("Date: 2026-07-11T00:00:00.000Z");
    expect(output).toContain("Zodiac: Tropical");
    expect(output).toContain("House system: Whole Sign");
    expect(output).toContain("Location: latitude -33.8688");
    expect(output).toContain("Data from ASTRO ENGINE by sukara.tech");
    expect(output).toContain("Sun in Cancer at 19°07′");
    expect(output).toContain("Sun in Cancer at 19°07′ · House 1");
    expect(output).toContain("Sun–Moon: Sextile · orb 0°08′ · applying");
    expect(output).toContain(AI_CHART_PROMPT);
    expect(output).not.toContain("109.123456789");
  });

  it("emits stable JSON key order, fixture provenance, precision, and stale state", () => {
    const output = formatJson(currentSky, {
      referenceInstant: "2026-07-11T01:00:00.000Z",
    });
    expect(output.indexOf('"data"')).toBeLessThan(
      output.indexOf('"freshness"'),
    );
    expect(output).toContain('"freshness": "stale"');
    expect(output).toContain('"quality": "fixture"');
    expect(output).toContain("109.1234567894");
    expect(output).not.toContain(": -0");
    expect(output).toBe(
      formatJson(currentSky, {
        referenceInstant: "2026-07-11T01:00:00.000Z",
      }),
    );
  });

  it("renders Markdown in canonical array order and escapes metadata", () => {
    const output = formatMarkdown(currentSky, {
      referenceInstant: "2026-07-11T00:01:00.000Z",
    });
    expect(output).toContain("Freshness: current");
    expect(output).toContain("golden\\|fixture source");
    expect(output).not.toContain("<br>");
    expect(output.indexOf("| Sun |")).toBeLessThan(output.indexOf("| Moon |"));
    expect(output).toContain("109.123456789°");
  });

  it("snapshots personal Saturn and Human Design facts without interpretation", () => {
    expect(formatPromptText(saturnReturn)).toMatchInlineSnapshot(`
      "ASTRO ENGINE SATURN RETURN
      Instant: 2026-07-11T00:00:00.000Z
      Zodiac: tropical
      Frame: tropical-geocentric-apparent-ecliptic-of-date-v1
      Units: longitude/orb=degrees; speed=degrees/day
      Valid for: [2026-07-11T00:00:00.000Z, 2026-07-11T00:05:00.000Z)
      Freshness: unknown
      Schema: 1.0.0
      Algorithm: saturn-return-v1
      Provenance: golden|fixture source 1.2.3; data=reference-2026-07-11; quality=fixture
      Classification: session-personal
      As of: 2055-01-15T00:00:00.000Z
      Natal Saturn longitude: 281.5 degrees
      Orb: 2 degrees
      Status: active
      Status window: sat_window_v1_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      Return windows:
      - sat_window_v1_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa: [2055-01-01T00:00:00.000Z, 2055-03-01T00:00:00.000Z); edge=complete
        pass 1: 2055-02-01T00:00:00.000Z; direction=direct; id=sat_pass_v1_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
      "
    `);
    const output = formatMarkdown(humanDesign);
    expect(output).toContain("| Sun | 109.123456789° | 53 | 2 |");
    expect(output).toContain("| Earth | 289.123456789° | 54 | 2 |");
    expect(output).not.toMatch(/advice|meaning|should|energy/i);
  });

  it("normalizes negative zero in numeric presentation", () => {
    const events = {
      metadata,
      requestedWindow: metadata.validFor,
      algorithmVersion: "major-events-v1",
      events: [],
      complete: true,
      truncatedAtLimit: false,
      exactTimeToleranceSeconds: -0,
    };
    expect(formatPromptText(events)).toContain("tolerance: 0 seconds");
    expect(formatJson(events)).not.toContain(": -0");
  });

  it("rejects unsupported and non-canonical objects", () => {
    expect(() => formatJson({ metadata })).toThrow(TypeError);
  });
});
