import {
  CurrentSkySchema,
  EPHEMERIS_BODY_ORDER,
  FRAME_VERSION,
  MoonPhaseSchema,
  SCHEMA_VERSION,
  type AstroResult,
  type CurrentSky,
  type EphemerisBody,
  type EphemerisProvider,
  type MoonPhase,
  type PlanetPosition,
  type ProviderCallOptions,
  type UtcInstant,
} from "@sukara/astro-schema";
import { detectTightAspects } from "./aspects.js";
import { normalizeDegrees, utcFromMilliseconds } from "./math.js";
import { canonicalizePositions } from "./positions.js";
import { requestPositions } from "./provider.js";

export const CURRENT_SKY_ALGORITHM_VERSION = "current-sky-v1";

const PHASES = [
  "new",
  "waxing-crescent",
  "first-quarter",
  "waxing-gibbous",
  "full",
  "waning-gibbous",
  "last-quarter",
  "waning-crescent",
] as const;

export function calculateMoonPhase(
  positions: readonly PlanetPosition[],
): MoonPhase {
  const sun = positions.find(({ body }) => body === "sun");
  const moon = positions.find(({ body }) => body === "moon");
  if (sun === undefined || moon === undefined) {
    throw new Error("Moon phase requires canonical Sun and Moon positions");
  }
  const phaseAngle = normalizeDegrees(moon.longitude - sun.longitude);
  const index = Math.floor((phaseAngle + 22.5) / 45) % 8;
  return MoonPhaseSchema.parse({ phase: PHASES[index], phaseAngle });
}

export async function calculateCurrentSky(
  provider: EphemerisProvider,
  instant: UtcInstant,
  bodies: readonly EphemerisBody[] = EPHEMERIS_BODY_ORDER,
  options?: ProviderCallOptions,
): Promise<AstroResult<CurrentSky>> {
  if (
    !bodies.includes("sun") ||
    !bodies.includes("moon") ||
    new Set(bodies).size !== bodies.length
  ) {
    return {
      ok: false,
      error: {
        code: "invalid-input",
        message: "Current sky requires unique bodies including Sun and Moon",
        retryable: false,
        path: ["bodies"],
      },
    };
  }
  const batch = await requestPositions(provider, instant, bodies, options);
  if (!batch.ok) return batch;
  const positions = canonicalizePositions(batch.value.positions);
  const result = CurrentSkySchema.safeParse({
    metadata: {
      schemaVersion: SCHEMA_VERSION,
      algorithmVersion: CURRENT_SKY_ALGORITHM_VERSION,
      calculatedAt: instant,
      zodiac: "tropical",
      frame: FRAME_VERSION,
      validFor: {
        start: instant,
        end: utcFromMilliseconds(Date.parse(instant) + 1),
      },
      provenance: batch.value.provenance,
    },
    positions,
    moonPhase: calculateMoonPhase(positions),
    aspects: detectTightAspects(positions),
  });
  return result.success
    ? { ok: true, value: result.data }
    : {
        ok: false,
        error: {
          code: "internal-failure",
          message: "Engine could not construct a canonical current sky",
          retryable: false,
        },
      };
}
