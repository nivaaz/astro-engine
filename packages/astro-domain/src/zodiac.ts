/**
 * @astro-engine/domain — Zodiac sign calculations
 *
 * Maps ecliptic longitude (0–360°) to zodiac sign and degree.
 */

import type { ZodiacSign, PlanetPosition, Degree } from "./types.js";

/**
 * All zodiac signs in order, starting from 0° Aries.
 */
export const ZODIAC_SIGNS: readonly ZodiacSign[] = [
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
];

const SIGN_SIZE = 30; // degrees per sign

/**
 * Get the zero-based index of a zodiac sign (Aries = 0, Pisces = 11).
 */
export function getSignIndex(sign: ZodiacSign): number {
  return ZODIAC_SIGNS.indexOf(sign);
}

/**
 * Convert an ecliptic longitude (0–360°) to its zodiac sign
 * and the degree/minute/second within that sign.
 */
export function getSignFromLongitude(longitude: number): {
  sign: ZodiacSign;
  signDegree: number;
  minute: number;
  second: number;
} {
  // Normalize to 0–360
  const lon = ((longitude % 360) + 360) % 360;

  const signIndex = Math.floor(lon / SIGN_SIZE);
  const remainder = lon - signIndex * SIGN_SIZE;

  const signDegree = Math.floor(remainder);
  const fractionalDeg = remainder - signDegree;
  const totalMinutes = fractionalDeg * 60;
  const minute = Math.floor(totalMinutes);
  const second = Math.round((totalMinutes - minute) * 60);

  return {
    sign: ZODIAC_SIGNS[signIndex]!,
    signDegree,
    minute,
    second,
  };
}

/**
 * Get the zodiac sign for a planet position.
 */
export function getSignForPlanet(position: PlanetPosition): ZodiacSign {
  return getSignFromLongitude(position.longitude as number).sign;
}

/**
 * Convert a longitude (0–360°) to degree/minute/second within the full circle.
 */
export function longitudeToDMS(longitude: number): {
  degree: number;
  minute: number;
  second: number;
} {
  const lon = ((longitude % 360) + 360) % 360;

  const degree = Math.floor(lon);
  const fractionalDeg = lon - degree;
  const totalMinutes = fractionalDeg * 60;
  const minute = Math.floor(totalMinutes);
  const second = Math.round((totalMinutes - minute) * 60);

  return { degree, minute, second };
}

/**
 * Get the full zodiac position string (e.g. "15° Leo 23' 45\"").
 */
export function formatZodiacPosition(longitude: number): string {
  const { sign, signDegree, minute, second } = getSignFromLongitude(longitude);
  const capSign = sign.charAt(0).toUpperCase() + sign.slice(1);
  return `${signDegree}° ${capSign} ${minute}' ${second}"`;
}
