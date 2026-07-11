import { z } from "zod";
import { CanonicalMetadataSchema, ProjectionBodySchema } from "./astronomy.js";
import {
  DegreesSchema,
  EclipticLongitudeDegreesSchema,
  UtcInstantSchema,
  UtcIntervalSchema,
} from "./primitives.js";

export const SESSION_PERSONAL_CLASSIFICATION = "session-personal" as const;
export const MAX_SATURN_SEARCH_DAYS = 35 * 366;
export const SATURN_RETURN_ALGORITHM_VERSION = "saturn-return-v1" as const;

export const SaturnReturnRequestSchema = z
  .object({
    classification: z.literal(SESSION_PERSONAL_CLASSIFICATION),
    natalSaturnLongitude: EclipticLongitudeDegreesSchema,
    birthInstant: UtcInstantSchema,
    asOf: UtcInstantSchema,
    searchWindow: UtcIntervalSchema,
    orb: DegreesSchema.max(3),
  })
  .strict()
  .refine(
    ({ birthInstant, asOf }) => Date.parse(birthInstant) < Date.parse(asOf),
    { message: "birthInstant must precede asOf", path: ["birthInstant"] },
  )
  .refine(
    ({ asOf, searchWindow }) =>
      Date.parse(asOf) >= Date.parse(searchWindow.start) &&
      Date.parse(asOf) < Date.parse(searchWindow.end),
    { message: "asOf must be inside the search window", path: ["asOf"] },
  )
  .refine(
    ({ searchWindow }) =>
      Date.parse(searchWindow.end) - Date.parse(searchWindow.start) <=
      MAX_SATURN_SEARCH_DAYS * 86_400_000,
    {
      message: `Saturn return search cannot exceed ${MAX_SATURN_SEARCH_DAYS} days`,
      path: ["searchWindow", "end"],
    },
  )
  .readonly();
export type SaturnReturnRequest = z.infer<typeof SaturnReturnRequestSchema>;

export const SaturnReturnPassSchema = z
  .object({
    id: z.string().regex(/^sat_pass_v1_[a-f0-9]{64}$/),
    sequence: z.number().int().positive(),
    exactAt: UtcInstantSchema,
    direction: z.enum(["direct", "retrograde", "stationary"]),
    windowId: z.string().regex(/^sat_window_v1_[a-f0-9]{64}$/),
  })
  .strict()
  .readonly();
export type SaturnReturnPass = z.infer<typeof SaturnReturnPassSchema>;

export const SaturnReturnWindowSchema = z
  .object({
    id: z.string().regex(/^sat_window_v1_[a-f0-9]{64}$/),
    interval: UtcIntervalSchema,
    edge: z.enum(["complete", "starts-before-search", "ends-after-search"]),
    passes: z.array(SaturnReturnPassSchema).readonly(),
  })
  .strict()
  .refine(
    ({ id, interval, passes }) =>
      passes.every(
        (pass, index) =>
          pass.windowId === id &&
          pass.sequence === index + 1 &&
          Date.parse(pass.exactAt) >= Date.parse(interval.start) &&
          Date.parse(pass.exactAt) < Date.parse(interval.end),
      ),
    {
      message: "Passes must be sequenced inside their containing window",
      path: ["passes"],
    },
  )
  .readonly();
export type SaturnReturnWindow = z.infer<typeof SaturnReturnWindowSchema>;

export const SaturnReturnResultSchema = z
  .object({
    metadata: CanonicalMetadataSchema,
    algorithmVersion: z.literal(SATURN_RETURN_ALGORITHM_VERSION),
    classification: z.literal(SESSION_PERSONAL_CLASSIFICATION),
    natalSaturnLongitude: EclipticLongitudeDegreesSchema,
    orb: DegreesSchema.max(3),
    asOf: UtcInstantSchema,
    status: z.enum(["upcoming", "active", "complete", "none-in-range"]),
    statusWindowId: z
      .string()
      .regex(/^sat_window_v1_[a-f0-9]{64}$/)
      .nullable(),
    windows: z.array(SaturnReturnWindowSchema).readonly(),
  })
  .strict()
  .refine(
    ({ windows }) =>
      windows.every(
        (window, index) =>
          index === 0 ||
          Date.parse(windows[index - 1]!.interval.end) <=
            Date.parse(window.interval.start),
      ),
    {
      message: "Return windows must be chronological and non-overlapping",
      path: ["windows"],
    },
  )
  .refine(
    ({ asOf, status, statusWindowId, windows }) => {
      const timestamp = Date.parse(asOf);
      const active = windows.find(
        ({ interval }) =>
          timestamp >= Date.parse(interval.start) &&
          timestamp < Date.parse(interval.end),
      );
      const upcoming = windows.find(
        ({ interval }) => timestamp < Date.parse(interval.start),
      );
      if (active) return status === "active" && statusWindowId === active.id;
      if (upcoming)
        return status === "upcoming" && statusWindowId === upcoming.id;
      if (windows.length > 0)
        return status === "complete" && statusWindowId === windows.at(-1)!.id;
      return status === "none-in-range" && statusWindowId === null;
    },
    {
      message:
        "Status and statusWindowId must be derived from asOf and ordered windows",
      path: ["status"],
    },
  )
  .readonly();
export type SaturnReturnResult = z.infer<typeof SaturnReturnResultSchema>;

export const HUMAN_DESIGN_MAPPING_VERSION = "tropical-rave-mandala-v1" as const;

export const HumanDesignTransitSchema = z
  .object({
    body: ProjectionBodySchema,
    sourceLongitude: EclipticLongitudeDegreesSchema,
    gate: z.number().int().min(1).max(64),
    line: z.number().int().min(1).max(6),
    mappingVersion: z.literal(HUMAN_DESIGN_MAPPING_VERSION),
  })
  .strict()
  .readonly();
export type HumanDesignTransit = z.infer<typeof HumanDesignTransitSchema>;

export const HumanDesignTransitResultSchema = z
  .object({
    metadata: CanonicalMetadataSchema,
    transits: z.array(HumanDesignTransitSchema).max(13).readonly(),
  })
  .strict()
  .readonly();
export type HumanDesignTransitResult = z.infer<
  typeof HumanDesignTransitResultSchema
>;
