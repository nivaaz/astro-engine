import {
  AnglesRequestSchema,
  LocalAnglesSchema,
  PositionBatchSchema,
  ProviderCapabilitiesSchema,
  UtcIntervalSchema,
  type EphemerisBody,
  type EphemerisProvider,
} from "@sukara/astro-schema";

const epoch = Date.parse("2000-01-01T12:00:00.000Z");
const base: Readonly<Record<EphemerisBody, readonly [number, number]>> = {
  sun: [280, 0.9856],
  moon: [223, 13.176],
  mercury: [250, 1.2],
  venus: [300, 1.0],
  mars: [327, 0.52],
  jupiter: [25, 0.083],
  saturn: [40, 0.03345],
  uranus: [315, 0.0117],
  neptune: [303, 0.006],
  pluto: [251, 0.004],
  "true-north-node": [125, -0.05295],
};

/** Unrestricted synthetic provider used only by explicitly labelled non-production UI fixtures. */
export function uiFixtureProvider(): EphemerisProvider {
  const provenance = {
    providerId: "public-v1-ui-fixture",
    providerVersion: "1.0.0",
    dataVersion: "synthetic-linear-v1",
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
      maxBodiesPerRequest: 11,
    }),
    async getPositions(request) {
      const days = (Date.parse(request.instant) - epoch) / 86_400_000;
      return {
        ok: true,
        value: PositionBatchSchema.parse({
          instant: request.instant,
          provenance,
          positions: request.bodies.map((body) => {
            const [start, speed] = base[body];
            return {
              body,
              instant: request.instant,
              longitude: (((start + speed * days) % 360) + 360) % 360,
              longitudeSpeed: speed,
            };
          }),
        }),
      };
    },
    async getLocalAngles(input) {
      const request = AnglesRequestSchema.parse(input);
      const dayFraction =
        (Date.parse(request.instant) % 86_400_000) / 86_400_000;
      return {
        ok: true,
        value: LocalAnglesSchema.parse({
          ...request,
          ascendant:
            (((request.location.longitude + dayFraction * 360) % 360) + 360) %
            360,
          midheaven: (((dayFraction * 360) % 360) + 360) % 360,
          provenance,
        }),
      };
    },
  };
}
