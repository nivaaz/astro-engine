import {
  AnglesRequestSchema,
  GeoLocationSchema,
  LocalAnglesSchema,
  PositionBatchSchema,
  ProviderCapabilitiesSchema,
  UtcInstantSchema,
  UtcIntervalSchema,
  type AstroResult,
  type EphemerisBody,
  type EphemerisProvider,
  type LocalAngles,
  type PositionBatch,
  type PositionRequest,
} from "@sukara/astro-schema";

export const EPOCH = UtcInstantSchema.parse("2026-01-01T00:00:00.000Z");
export const LOCATION = GeoLocationSchema.parse({
  latitude: -33.8688,
  longitude: 151.2093,
  timezone: "Australia/Sydney",
});

const DEFAULT_LONGITUDES: Readonly<Record<EphemerisBody, number>> = {
  sun: 0,
  moon: 44,
  mercury: 88,
  venus: 133,
  mars: 177,
  jupiter: 222,
  saturn: 266,
  uranus: 311,
  neptune: 17,
  pluto: 63,
  "true-north-node": 109,
};

export interface FixtureProviderOptions {
  readonly maxBodiesPerRequest?: number;
  readonly fail?: boolean;
  readonly ascendant?: number;
  readonly midheaven?: number;
  readonly position?: (
    body: EphemerisBody,
    elapsedDays: number,
  ) => Readonly<{ longitude: number; speed: number }>;
}

export function fixtureProvider(
  options: FixtureProviderOptions = {},
): EphemerisProvider {
  const provenance = {
    providerId: "deterministic-fixture",
    providerVersion: "1.0.0",
    dataVersion: "linear-v1",
    quality: "fixture" as const,
  };
  return {
    id: provenance.providerId,
    capabilities: ProviderCapabilitiesSchema.parse({
      positions: true,
      angles: true,
      supportedRange: UtcIntervalSchema.parse({
        start: "1900-01-01T00:00:00.000Z",
        end: "2200-01-01T00:00:00.000Z",
      }),
      maxBodiesPerRequest: options.maxBodiesPerRequest ?? 11,
    }),
    async getPositions(
      request: PositionRequest,
    ): Promise<AstroResult<PositionBatch>> {
      if (options.fail)
        return {
          ok: false,
          error: {
            code: "provider-unavailable",
            message: "Fixture failure",
            retryable: true,
          },
        };
      const elapsedDays =
        (Date.parse(request.instant) - Date.parse(EPOCH)) / 86_400_000;
      return {
        ok: true,
        value: PositionBatchSchema.parse({
          instant: request.instant,
          positions: request.bodies.map((body) => {
            const calculated = options.position?.(body, elapsedDays) ?? {
              longitude: DEFAULT_LONGITUDES[body],
              speed: 0,
            };
            return {
              body,
              instant: request.instant,
              longitude: ((calculated.longitude % 360) + 360) % 360,
              longitudeSpeed: calculated.speed,
            };
          }),
          provenance,
        }),
      };
    },
    async getLocalAngles(input: unknown): Promise<AstroResult<LocalAngles>> {
      if (options.fail)
        return {
          ok: false,
          error: {
            code: "provider-unavailable",
            message: "Fixture failure",
            retryable: true,
          },
        };
      const request = AnglesRequestSchema.parse(input);
      return {
        ok: true,
        value: LocalAnglesSchema.parse({
          ...request,
          ascendant: options.ascendant ?? 359,
          midheaven: options.midheaven ?? 270,
          provenance,
        }),
      };
    },
  };
}

export function deterministicHasher(value: string): string {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0").repeat(8);
}
