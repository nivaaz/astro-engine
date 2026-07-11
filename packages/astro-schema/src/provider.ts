import { z } from "zod";
import {
  EPHEMERIS_BODY_ORDER,
  EphemerisBodySchema,
  ProviderProvenanceSchema,
  RawPlanetPositionSchema,
} from "./astronomy.js";
import {
  EclipticLongitudeDegreesSchema,
  GeoLocationSchema,
  UtcInstantSchema,
  UtcIntervalSchema,
} from "./primitives.js";

export const AstroErrorCodeSchema = z.enum([
  "invalid-input",
  "unsupported-range",
  "unsupported-capability",
  "provider-unavailable",
  "invalid-provider-output",
  "search-exhausted",
  "aborted",
  "internal-failure",
]);
export type AstroErrorCode = z.infer<typeof AstroErrorCodeSchema>;

export const AstroErrorSchema = z
  .object({
    code: AstroErrorCodeSchema,
    message: z.string().min(1).max(240),
    retryable: z.boolean(),
    path: z
      .array(z.union([z.string(), z.number().int().nonnegative()]))
      .max(12)
      .optional(),
  })
  .strict()
  .readonly();
export type AstroError = z.infer<typeof AstroErrorSchema>;

export type AstroResult<T> = Readonly<
  { ok: true; value: T } | { ok: false; error: AstroError }
>;

export const ProviderCapabilitiesSchema = z
  .object({
    positions: z.literal(true),
    angles: z.boolean(),
    supportedRange: UtcIntervalSchema,
    maxBodiesPerRequest: z
      .number()
      .int()
      .min(1)
      .max(EPHEMERIS_BODY_ORDER.length),
  })
  .strict()
  .readonly();
export type ProviderCapabilities = z.infer<typeof ProviderCapabilitiesSchema>;

export const PositionRequestSchema = z
  .object({
    instant: UtcInstantSchema,
    bodies: z
      .array(EphemerisBodySchema)
      .min(1)
      .max(EPHEMERIS_BODY_ORDER.length)
      .readonly(),
  })
  .strict()
  .refine(({ bodies }) => new Set(bodies).size === bodies.length, {
    message: "Requested bodies must be unique",
    path: ["bodies"],
  })
  .readonly();
export type PositionRequest = z.infer<typeof PositionRequestSchema>;

export const PositionBatchSchema = z
  .object({
    instant: UtcInstantSchema,
    positions: z
      .array(RawPlanetPositionSchema)
      .min(1)
      .max(EPHEMERIS_BODY_ORDER.length)
      .readonly(),
    provenance: ProviderProvenanceSchema,
  })
  .strict()
  .readonly();
export type PositionBatch = z.infer<typeof PositionBatchSchema>;

export const AnglesRequestSchema = z
  .object({ instant: UtcInstantSchema, location: GeoLocationSchema })
  .strict()
  .readonly();
export type AnglesRequest = z.infer<typeof AnglesRequestSchema>;

export const LocalAnglesSchema = z
  .object({
    instant: UtcInstantSchema,
    location: GeoLocationSchema,
    ascendant: EclipticLongitudeDegreesSchema,
    midheaven: EclipticLongitudeDegreesSchema,
    provenance: ProviderProvenanceSchema,
  })
  .strict()
  .readonly();
export type LocalAngles = z.infer<typeof LocalAnglesSchema>;

export interface AbortSignalLike {
  readonly aborted: boolean;
  addEventListener(
    type: "abort",
    listener: () => void,
    options?: Readonly<{ once?: boolean }>,
  ): void;
  removeEventListener(type: "abort", listener: () => void): void;
}

export interface ProviderCallOptions {
  readonly signal?: AbortSignalLike;
}

export interface EphemerisProvider {
  readonly id: string;
  readonly capabilities: ProviderCapabilities;
  getPositions(
    request: PositionRequest,
    options?: ProviderCallOptions,
  ): Promise<AstroResult<PositionBatch>>;
  getLocalAngles(
    request: AnglesRequest,
    options?: ProviderCallOptions,
  ): Promise<AstroResult<LocalAngles>>;
}

export function validatePositionBatch(
  request: PositionRequest,
  input: unknown,
): AstroResult<PositionBatch> {
  const parsed = PositionBatchSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "invalid-provider-output",
        message: "Provider returned an invalid position batch",
        retryable: false,
      },
    };
  }

  const expected = [...request.bodies].sort(
    (a, b) => EPHEMERIS_BODY_ORDER.indexOf(a) - EPHEMERIS_BODY_ORDER.indexOf(b),
  );
  const actual = parsed.data.positions
    .map(({ body }) => body)
    .sort(
      (a, b) =>
        EPHEMERIS_BODY_ORDER.indexOf(a) - EPHEMERIS_BODY_ORDER.indexOf(b),
    );
  const atomic =
    parsed.data.instant === request.instant &&
    parsed.data.positions.every(({ instant }) => instant === request.instant) &&
    expected.length === actual.length &&
    expected.every((body, index) => body === actual[index]);

  return atomic
    ? { ok: true, value: parsed.data }
    : {
        ok: false,
        error: {
          code: "invalid-provider-output",
          message: "Provider batch did not atomically satisfy the request",
          retryable: false,
        },
      };
}
