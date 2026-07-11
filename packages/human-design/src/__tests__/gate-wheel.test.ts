import { describe, expect, it } from "vitest";
import type { EclipticLongitudeDegrees } from "@sukara/astro-schema";
import {
  GATE_SPAN_DEGREES,
  GATE_WHEEL_ANCHOR_DEGREES,
  GATE_WHEEL_PROVENANCE,
  GATE_WHEEL_SEQUENCE,
  HUMAN_DESIGN_MAPPING_VERSION,
  LINE_SPAN_DEGREES,
  mapLongitudeToGateLine,
  mapPositionsToHumanDesignTransits,
} from "../gate-wheel.js";

const BEFORE_BOUNDARY = 1e-10;

describe("Human Design gate wheel", () => {
  it("contains every gate exactly once in the verified wheel order", () => {
    expect(GATE_WHEEL_SEQUENCE).toHaveLength(64);
    expect(new Set(GATE_WHEEL_SEQUENCE)).toEqual(
      new Set(Array.from({ length: 64 }, (_, index) => index + 1)),
    );
  });

  it("publishes immutable, versioned source provenance", () => {
    expect(GATE_WHEEL_PROVENANCE).toMatchObject({
      mappingVersion: HUMAN_DESIGN_MAPPING_VERSION,
      sourceCommit: "31cbeee138a9d94e7d01dd3901ef8ddef00bfc61",
      ownerAuthorizedOn: "2026-07-11",
    });
    expect(Object.isFrozen(GATE_WHEEL_PROVENANCE)).toBe(true);
    expect(Object.isFrozen(GATE_WHEEL_SEQUENCE)).toBe(true);
  });

  it("assigns all 64 exact gate transitions to the new half-open interval", () => {
    GATE_WHEEL_SEQUENCE.forEach((gate, gateIndex) => {
      const start = GATE_WHEEL_ANCHOR_DEGREES + gateIndex * GATE_SPAN_DEGREES;
      const previousGate =
        GATE_WHEEL_SEQUENCE[
          (gateIndex - 1 + GATE_WHEEL_SEQUENCE.length) %
            GATE_WHEEL_SEQUENCE.length
        ];

      expect(mapLongitudeToGateLine(start)).toEqual({
        gate,
        line: 1,
        mappingVersion: HUMAN_DESIGN_MAPPING_VERSION,
      });
      expect(mapLongitudeToGateLine(start - BEFORE_BOUNDARY)).toMatchObject({
        gate: previousGate,
        line: 6,
      });
    });
  });

  it("assigns all 384 exact line transitions without gaps or overlaps", () => {
    GATE_WHEEL_SEQUENCE.forEach((gate, gateIndex) => {
      for (let lineIndex = 0; lineIndex < 6; lineIndex += 1) {
        const start =
          GATE_WHEEL_ANCHOR_DEGREES +
          gateIndex * GATE_SPAN_DEGREES +
          lineIndex * LINE_SPAN_DEGREES;

        expect(mapLongitudeToGateLine(start)).toMatchObject({
          gate,
          line: lineIndex + 1,
        });

        if (lineIndex > 0) {
          expect(mapLongitudeToGateLine(start - BEFORE_BOUNDARY)).toMatchObject(
            { gate, line: lineIndex },
          );
        }

        expect(
          mapLongitudeToGateLine(start + LINE_SPAN_DEGREES / 2),
        ).toMatchObject({ gate, line: lineIndex + 1 });
      }
    });
  });

  it("normalizes negative and multi-revolution longitudes", () => {
    const expected = mapLongitudeToGateLine(10);
    expect(mapLongitudeToGateLine(-350)).toEqual(expected);
    expect(mapLongitudeToGateLine(370)).toEqual(expected);
    expect(mapLongitudeToGateLine(730)).toEqual(expected);
  });

  it("rejects non-finite longitudes", () => {
    expect(() => mapLongitudeToGateLine(Number.NaN)).toThrow(RangeError);
    expect(() => mapLongitudeToGateLine(Number.POSITIVE_INFINITY)).toThrow(
      RangeError,
    );
  });

  it("maps canonical projection positions without mutating source data", () => {
    const longitude = (value: number): EclipticLongitudeDegrees =>
      value as EclipticLongitudeDegrees;
    const positions = Object.freeze([
      Object.freeze({ body: "sun" as const, longitude: longitude(10) }),
      Object.freeze({ body: "earth" as const, longitude: longitude(190) }),
    ]);

    expect(mapPositionsToHumanDesignTransits(positions)).toEqual([
      {
        body: "sun",
        sourceLongitude: 10,
        gate: 21,
        line: 1,
        mappingVersion: HUMAN_DESIGN_MAPPING_VERSION,
      },
      {
        body: "earth",
        sourceLongitude: 190,
        gate: 48,
        line: 1,
        mappingVersion: HUMAN_DESIGN_MAPPING_VERSION,
      },
    ]);
  });
});
