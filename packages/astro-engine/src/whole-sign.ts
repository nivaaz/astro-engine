import {
  EPHEMERIS_BODY_ORDER,
  FRAME_VERSION,
  SCHEMA_VERSION,
  WholeSignChartSchema,
  ZODIAC_SIGN_ORDER,
  type AstroResult,
  type EphemerisBody,
  type EphemerisProvider,
  type GeoLocation,
  type ProviderCallOptions,
  type UtcInstant,
  type WholeSignChart,
} from "@sukara/astro-schema";
import { normalizeDegrees, utcFromMilliseconds } from "./math.js";
import {
  provenanceMatches,
  requestLocalAngles,
  requestPositions,
} from "./provider.js";

export const WHOLE_SIGN_ALGORITHM_VERSION = "whole-sign-v1";

export async function calculateWholeSignChart(
  provider: EphemerisProvider,
  instant: UtcInstant,
  location: GeoLocation,
  bodies: readonly EphemerisBody[] = EPHEMERIS_BODY_ORDER,
  options?: ProviderCallOptions,
): Promise<AstroResult<WholeSignChart>> {
  if (bodies.length === 0 || new Set(bodies).size !== bodies.length) {
    return {
      ok: false,
      error: {
        code: "invalid-input",
        message: "Whole Sign chart requires at least one unique body",
        retryable: false,
        path: ["bodies"],
      },
    };
  }
  const [batch, angles] = await Promise.all([
    requestPositions(provider, instant, bodies, options),
    requestLocalAngles(provider, { instant, location }, options),
  ]);
  if (!batch.ok) return batch;
  if (!angles.ok) return angles;
  if (!provenanceMatches(batch.value.provenance, angles.value.provenance)) {
    return {
      ok: false,
      error: {
        code: "invalid-provider-output",
        message: "Positions and local angles must share one provenance frame",
        retryable: false,
      },
    };
  }
  const firstIndex = Math.floor(angles.value.ascendant / 30);
  const result = WholeSignChartSchema.safeParse({
    metadata: {
      schemaVersion: SCHEMA_VERSION,
      algorithmVersion: WHOLE_SIGN_ALGORITHM_VERSION,
      calculatedAt: instant,
      zodiac: "tropical",
      frame: FRAME_VERSION,
      validFor: {
        start: instant,
        end: utcFromMilliseconds(Date.parse(instant) + 1),
      },
      provenance: batch.value.provenance,
    },
    location,
    ascendant: angles.value.ascendant,
    midheaven: angles.value.midheaven,
    firstHouseSign: ZODIAC_SIGN_ORDER[firstIndex],
    cusps: Array.from({ length: 12 }, (_, index) =>
      normalizeDegrees((firstIndex + index) * 30),
    ),
    placements: batch.value.positions.map(({ body, longitude }) => ({
      body,
      house: ((Math.floor(longitude / 30) - firstIndex + 12) % 12) + 1,
    })),
  });
  return result.success
    ? { ok: true, value: result.data }
    : {
        ok: false,
        error: {
          code: "internal-failure",
          message: "Engine could not construct a canonical Whole Sign chart",
          retryable: false,
        },
      };
}
