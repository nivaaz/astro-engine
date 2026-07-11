import {
  HUMAN_DESIGN_MAPPING_VERSION,
  HumanDesignTransitSchema,
  ProjectionBodySchema,
  type EclipticLongitudeDegrees,
  type HumanDesignTransit,
  type ProjectionBody,
} from "@sukara/astro-schema";

export { HUMAN_DESIGN_MAPPING_VERSION };

/** Tropical longitude at which Gate 25 begins: 28°15′ Pisces. */
export const GATE_WHEEL_ANCHOR_DEGREES = 358.25;
export const GATE_SPAN_DEGREES = 360 / 64;
export const LINE_SPAN_DEGREES = GATE_SPAN_DEGREES / 6;
export const GATE_WHEEL_PROVENANCE = Object.freeze({
  mappingVersion: HUMAN_DESIGN_MAPPING_VERSION,
  sourceRepository: "nivaaz/astroai",
  sourceCommit: "31cbeee138a9d94e7d01dd3901ef8ddef00bfc61",
  sourceFiles: Object.freeze([
    "src/app/charts/human-design/constants.ts",
    "src/app/charts/human-design/gateMapping.ts",
  ] as const),
  ownerAuthorizedOn: "2026-07-11",
} as const);

/**
 * Gate order in the direction of increasing tropical ecliptic longitude,
 * beginning at `GATE_WHEEL_ANCHOR_DEGREES`.
 */
export const GATE_WHEEL_SEQUENCE = Object.freeze([
  25, 17, 21, 51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53,
  62, 56, 31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50, 28, 44,
  1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60, 41, 19, 13, 49, 30, 55,
  37, 63, 22, 36,
] as const);

export interface GateLine {
  readonly gate: number;
  readonly line: number;
  readonly mappingVersion: typeof HUMAN_DESIGN_MAPPING_VERSION;
}

export interface CanonicalProjectionPosition {
  readonly body: ProjectionBody;
  readonly longitude: EclipticLongitudeDegrees;
}

const normalizeLongitude = (longitude: number): number => {
  if (!Number.isFinite(longitude)) {
    throw new RangeError("longitude must be finite");
  }

  const normalized = longitude % 360;
  return normalized < 0 ? normalized + 360 : normalized;
};

/**
 * Projects a longitude onto gap-free, half-open gate and line intervals.
 * An exact transition belongs to the gate or line beginning at that point.
 */
export const mapLongitudeToGateLine = (longitude: number): GateLine => {
  const wheelOffset = normalizeLongitude(
    normalizeLongitude(longitude) - GATE_WHEEL_ANCHOR_DEGREES,
  );
  const gateIndex = Math.floor(wheelOffset / GATE_SPAN_DEGREES);
  const offsetWithinGate = wheelOffset - gateIndex * GATE_SPAN_DEGREES;
  const lineIndex = Math.floor(offsetWithinGate / LINE_SPAN_DEGREES);
  const gate = GATE_WHEEL_SEQUENCE[gateIndex];

  if (gate === undefined) {
    throw new RangeError("normalized longitude fell outside the gate wheel");
  }

  return {
    gate,
    line: lineIndex + 1,
    mappingVersion: HUMAN_DESIGN_MAPPING_VERSION,
  };
};

export const mapPositionsToHumanDesignTransits = (
  positions: readonly CanonicalProjectionPosition[],
): readonly HumanDesignTransit[] =>
  positions.map(({ body, longitude }) =>
    HumanDesignTransitSchema.parse({
      body: ProjectionBodySchema.parse(body),
      sourceLongitude: normalizeLongitude(longitude),
      ...mapLongitudeToGateLine(longitude),
    }),
  );
