/**
 * @astro-engine/ephemeris — Type definitions
 *
 * Shared types for planetary position calculations.
 * Based on Jean Meeus "Astronomical Algorithms" conventions.
 */

/** Supported celestial bodies */
export type Planet =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto'
  | 'chiron'
  | 'north_node'
  | 'south_node';

/** All 12 zodiac signs in order */
export type ZodiacSign =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

/** Julian Day Number (fractional) */
export type JulianDay = number;

/** Branded degree type for type safety */
export type Degrees = number;

/** Result of a planetary position calculation */
export interface PlanetPosition {
  /** Planet identifier */
  readonly planet: string;
  /** Ecliptic longitude in degrees (0–360) */
  readonly longitude: number;
  /** Ecliptic latitude in degrees */
  readonly latitude: number;
  /** Distance from Earth in AU */
  readonly distance: number;
  /** Daily motion in longitude (degrees/day); negative = retrograde */
  readonly speed: number;
  /** Zodiac sign the planet is in */
  readonly sign: string;
  /** Degrees within the sign (0–29) */
  readonly signDegree: number;
  /** Minutes of arc within the sign degree */
  readonly minute: number;
  /** Seconds of arc within the sign minute */
  readonly second: number;
  /** House placement (optional, requires location + house system) */
  readonly house?: number;
  /** Whether the planet appears retrograde */
  readonly isRetrograde: boolean;
}

/** Zodiac sign decomposition */
export interface ZodiacPosition {
  readonly sign: ZodiacSign;
  readonly signDegree: number;
  readonly minute: number;
  readonly second: number;
}

/** All zodiac signs in order */
export const ZODIAC_SIGNS: readonly ZodiacSign[] = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
] as const;

/** Map zodiac sign name to its starting longitude */
export const SIGN_LONGITUDE_MAP: Readonly<Record<ZodiacSign, number>> = {
  aries: 0,
  taurus: 30,
  gemini: 60,
  cancer: 90,
  leo: 120,
  virgo: 150,
  libra: 180,
  scorpio: 210,
  sagittarius: 240,
  capricorn: 270,
  aquarius: 300,
  pisces: 330,
};

/** All supported planets */
export const ALL_PLANETS: readonly Planet[] = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
  'chiron',
  'north_node',
  'south_node',
] as const;