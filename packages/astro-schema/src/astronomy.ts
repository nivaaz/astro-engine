import { z } from "zod";
import {
  DegreesPerDaySchema,
  DegreesSchema,
  EclipticLongitudeDegreesSchema,
  GeoLocationSchema,
  UtcInstantSchema,
  UtcIntervalSchema,
} from "./primitives.js";

export const SCHEMA_VERSION = "1.0.0" as const;
export const FRAME_VERSION =
  "tropical-geocentric-apparent-ecliptic-of-date-v1" as const;

export const EPHEMERIS_BODY_ORDER = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "true-north-node",
] as const;
export const EphemerisBodySchema = z.enum(EPHEMERIS_BODY_ORDER);
export type EphemerisBody = z.infer<typeof EphemerisBodySchema>;

export const PROJECTION_BODY_ORDER = [
  ...EPHEMERIS_BODY_ORDER,
  "earth",
  "south-node",
] as const;
export const ProjectionBodySchema = z.enum(PROJECTION_BODY_ORDER);
export type ProjectionBody = z.infer<typeof ProjectionBodySchema>;

export const ZodiacSignSchema = z.enum([
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
]);
export type ZodiacSign = z.infer<typeof ZodiacSignSchema>;
export const ZODIAC_SIGN_ORDER = ZodiacSignSchema.options;

export const ProviderProvenanceSchema = z
  .object({
    providerId: z.string().min(1).max(100),
    providerVersion: z.string().min(1).max(100),
    dataVersion: z.string().min(1).max(200),
    quality: z.enum(["production", "fixture"]),
  })
  .strict()
  .readonly();
export type ProviderProvenance = z.infer<typeof ProviderProvenanceSchema>;

export const CanonicalMetadataSchema = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    algorithmVersion: z.string().min(1).max(100),
    calculatedAt: UtcInstantSchema,
    zodiac: z.literal("tropical"),
    frame: z.literal(FRAME_VERSION),
    validFor: UtcIntervalSchema,
    provenance: ProviderProvenanceSchema,
  })
  .strict()
  .refine(({ calculatedAt, validFor }) => {
    const instant = Date.parse(calculatedAt);
    return (
      instant >= Date.parse(validFor.start) &&
      instant < Date.parse(validFor.end)
    );
  }, "calculatedAt must be inside validFor")
  .readonly();
export type CanonicalMetadata = z.infer<typeof CanonicalMetadataSchema>;

const RawPlanetPositionObjectSchema = z
  .object({
    body: EphemerisBodySchema,
    instant: UtcInstantSchema,
    longitude: EclipticLongitudeDegreesSchema,
    longitudeSpeed: DegreesPerDaySchema,
  })
  .strict();

export const RawPlanetPositionSchema = RawPlanetPositionObjectSchema.readonly();
export type RawPlanetPosition = z.infer<typeof RawPlanetPositionSchema>;

export const PlanetPositionSchema = RawPlanetPositionObjectSchema.extend({
  sign: ZodiacSignSchema,
  signDegree: z.number().finite().gte(0).lt(30),
  retrograde: z.boolean(),
})
  .strict()
  .refine(
    ({ longitudeSpeed, retrograde }) => retrograde === longitudeSpeed < 0,
    {
      message: "retrograde must equal longitudeSpeed < 0",
      path: ["retrograde"],
    },
  )
  .readonly();
export type PlanetPosition = z.infer<typeof PlanetPositionSchema>;

export const AspectTypeSchema = z.enum([
  "conjunction",
  "sextile",
  "square",
  "trine",
  "opposition",
]);
export type AspectType = z.infer<typeof AspectTypeSchema>;
export const ASPECT_ANGLES = {
  conjunction: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  opposition: 180,
} as const satisfies Readonly<Record<AspectType, number>>;
export const DEFAULT_TIGHT_ORBS = {
  conjunction: 3,
  sextile: 2,
  square: 3,
  trine: 3,
  opposition: 3,
} as const satisfies Readonly<Record<AspectType, number>>;

export const AspectSchema = z
  .object({
    bodyA: EphemerisBodySchema,
    bodyB: EphemerisBodySchema,
    type: AspectTypeSchema,
    angle: DegreesSchema.max(180),
    orb: DegreesSchema.max(3),
    phase: z.enum(["applying", "exact", "separating", "indeterminate"]),
  })
  .strict()
  .refine(
    ({ bodyA, bodyB }) =>
      EPHEMERIS_BODY_ORDER.indexOf(bodyA) < EPHEMERIS_BODY_ORDER.indexOf(bodyB),
    {
      message: "Aspect bodies must use canonical rank order",
    },
  )
  .refine(({ type, orb }) => orb <= DEFAULT_TIGHT_ORBS[type], {
    message: "Aspect exceeds the Public V1 tight-orb limit",
    path: ["orb"],
  })
  .readonly();
export type Aspect = z.infer<typeof AspectSchema>;

export const MoonPhaseSchema = z
  .object({
    phase: z.enum([
      "new",
      "waxing-crescent",
      "first-quarter",
      "waxing-gibbous",
      "full",
      "waning-gibbous",
      "last-quarter",
      "waning-crescent",
    ]),
    phaseAngle: EclipticLongitudeDegreesSchema,
  })
  .strict()
  .readonly();
export type MoonPhase = z.infer<typeof MoonPhaseSchema>;

export const CurrentSkySchema = z
  .object({
    metadata: CanonicalMetadataSchema,
    positions: z
      .array(PlanetPositionSchema)
      .min(2)
      .max(EPHEMERIS_BODY_ORDER.length)
      .readonly(),
    moonPhase: MoonPhaseSchema,
    aspects: z.array(AspectSchema).max(100).readonly(),
  })
  .strict()
  .refine(
    ({ positions }) => {
      const ranks = positions.map(({ body }) =>
        EPHEMERIS_BODY_ORDER.indexOf(body),
      );
      return (
        new Set(ranks).size === ranks.length &&
        ranks.every((rank, index) => index === 0 || ranks[index - 1]! < rank)
      );
    },
    {
      message: "Positions must be unique and use canonical body order",
      path: ["positions"],
    },
  )
  .refine(
    ({ aspects }) =>
      aspects.every((aspect, index) => {
        if (index === 0) return true;
        const previous = aspects[index - 1]!;
        if (previous.orb !== aspect.orb) return previous.orb < aspect.orb;
        const previousA = EPHEMERIS_BODY_ORDER.indexOf(previous.bodyA);
        const currentA = EPHEMERIS_BODY_ORDER.indexOf(aspect.bodyA);
        return (
          previousA < currentA ||
          (previousA === currentA &&
            EPHEMERIS_BODY_ORDER.indexOf(previous.bodyB) <
              EPHEMERIS_BODY_ORDER.indexOf(aspect.bodyB))
        );
      }),
    {
      message: "Aspects must be ordered by orb and canonical body pair",
      path: ["aspects"],
    },
  )
  .readonly();
export type CurrentSky = z.infer<typeof CurrentSkySchema>;

export const WholeSignChartSchema = z
  .object({
    metadata: CanonicalMetadataSchema,
    location: GeoLocationSchema,
    ascendant: EclipticLongitudeDegreesSchema,
    midheaven: EclipticLongitudeDegreesSchema,
    firstHouseSign: ZodiacSignSchema,
    cusps: z.array(EclipticLongitudeDegreesSchema).length(12).readonly(),
    placements: z
      .array(
        z
          .object({
            body: EphemerisBodySchema,
            house: z.number().int().min(1).max(12),
          })
          .strict()
          .readonly(),
      )
      .readonly(),
  })
  .strict()
  .refine(
    ({ ascendant, firstHouseSign, cusps }) => {
      const firstIndex = Math.floor(ascendant / 30);
      return (
        firstHouseSign === ZODIAC_SIGN_ORDER[firstIndex] &&
        cusps.every((cusp, index) => cusp === ((firstIndex + index) % 12) * 30)
      );
    },
    {
      message:
        "Whole Sign cusps must begin at the Ascendant sign boundary and advance by 30 degrees",
      path: ["cusps"],
    },
  )
  .refine(
    ({ placements }) => {
      const ranks = placements.map(({ body }) =>
        EPHEMERIS_BODY_ORDER.indexOf(body),
      );
      return (
        new Set(ranks).size === ranks.length &&
        ranks.every((rank, index) => index === 0 || ranks[index - 1]! < rank)
      );
    },
    {
      message:
        "Whole Sign placements must be unique and use canonical body order",
      path: ["placements"],
    },
  )
  .readonly();
export type WholeSignChart = z.infer<typeof WholeSignChartSchema>;
