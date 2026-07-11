/**
 * @astro-engine/domain — Zodiac utilities
 */

import type { ZodiacSign, PlanetPosition } from "./types.js";
import { ZODIAC_SIGNS } from "./types.js";

const FULL_CIRCLE = 360;
const DEGREES_PER_SIGN = 30;

export function getSignIndex(sign: ZodiacSign): number {
  return ZODIAC_SIGNS.indexOf(sign);
}

export function getSignFromLongitude(longitude: number): {
  sign: ZodiacSign;
  signIndex: number;
  degreeInSign: number;
} {
  const lon = ((longitude % FULL_CIRCLE) + FULL_CIRCLE) % FULL_CIRCLE;
  const signIndex = Math.floor(lon / DEGREES_PER_SIGN) % 12;
  const sign = ZODIAC_SIGNS[signIndex]!;
  const degreeInSign = lon - signIndex * DEGREES_PER_SIGN;
  return { sign, signIndex, degreeInSign };
}

export function getSignForPlanet(position: PlanetPosition): ZodiacSign {
  return getSignFromLongitude(position.longitude).sign;
}

export function longitudeToDMS(longitude: number): {
  degree: number;
  minute: number;
  second: number;
} {
  const lon = ((longitude % FULL_CIRCLE) + FULL_CIRCLE) % FULL_CIRCLE;
  const degree = Math.floor(lon);
  const minuteExact = (lon - degree) * 60;
  const minute = Math.floor(minuteExact);
  const second = Math.floor((minuteExact - minute) * 60);
  return { degree, minute, second };
}

export function formatZodiacPosition(longitude: number): string {
  const { sign, degreeInSign } = getSignFromLongitude(longitude);
  const { degree, minute } = longitudeToDMS(degreeInSign);
  return `${degree}°${String(minute).padStart(2, "0")}' ${sign}`;
}
