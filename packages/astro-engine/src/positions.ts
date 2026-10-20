import {
  EPHEMERIS_BODY_ORDER,
  PlanetPositionSchema,
  ZODIAC_SIGN_ORDER,
  type PlanetPosition,
  type RawPlanetPosition,
  type ZodiacSign,
} from "@sukara/astro-schema";
import { normalizeDegrees } from "./math.js";

export function zodiacSign(longitude: number): ZodiacSign {
  return ZODIAC_SIGN_ORDER[Math.floor(normalizeDegrees(longitude) / 30)]!;
}

export function signDegree(longitude: number): number {
  return normalizeDegrees(longitude) % 30;
}

export function canonicalizePosition(
  position: RawPlanetPosition,
): PlanetPosition {
  return PlanetPositionSchema.parse({
    ...position,
    sign: zodiacSign(position.longitude),
    signDegree: signDegree(position.longitude),
    retrograde: position.longitudeSpeed < 0,
  });
}

export function canonicalizePositions(
  positions: readonly RawPlanetPosition[],
): readonly PlanetPosition[] {
  return [...positions]
    .sort(
      (a, b) =>
        EPHEMERIS_BODY_ORDER.indexOf(a.body) -
        EPHEMERIS_BODY_ORDER.indexOf(b.body),
    )
    .map(canonicalizePosition);
}
