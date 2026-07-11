/**
 * @astro-engine/domain — Essential dignities
 *
 * Traditional essential dignity system: domicile, exaltation,
 * detriment, and fall for planets in zodiac signs.
 */

import type { CelestialBody, ZodiacSign } from "./types.js";

// ─── Domicile Rulers ─────────────────────────────────────────────

/**
 * Traditional domicile rulers for each zodiac sign.
 * Uses classical rulers (Mars rules Scorpio, Jupiter rules Pisces, Saturn rules Aquarius)
 * with modern outer-planet co-rulers noted separately.
 */
const DOMICILE_RULERS: Record<ZodiacSign, CelestialBody> = {
  ARIES: "MARS",
  TAURUS: "VENUS",
  GEMINI: "MERCURY",
  CANCER: "MOON",
  LEO: "SUN",
  VIRGO: "MERCURY",
  LIBRA: "VENUS",
  SCORPIO: "MARS",
  SAGITTARIUS: "JUPITER",
  CAPRICORN: "SATURN",
  AQUARIUS: "SATURN",
  PISCES: "JUPITER",
};

/**
 * Modern co-rulers (outer planets) for signs that have them.
 */
const CO_RULERS: Partial<Record<ZodiacSign, CelestialBody>> = {
  SCORPIO: "PLUTO",
  AQUARIUS: "URANUS",
  PISCES: "NEPTUNE",
};

// ─── Exaltation ──────────────────────────────────────────────────

/**
 * CelestialBodys in exaltation by sign.
 * Classical exaltation scheme.
 */
const EXALTATIONS: Partial<Record<ZodiacSign, CelestialBody>> = {
  ARIES: "SUN",
  TAURUS: "MOON",
  CANCER: "JUPITER",
  VIRGO: "MERCURY",
  LIBRA: "SATURN",
  CAPRICORN: "MARS",
  PISCES: "VENUS",
};

// ─── Detriment (opposite sign's domicile ruler) ──────────────────

/**
 * Signs where a planet is in detriment (opposite its domicile).
 */
function getDetrimentSigns(planet: CelestialBody): ZodiacSign[] {
  const signs: ZodiacSign[] = [];
  for (const [sign, ruler] of Object.entries(DOMICILE_RULERS) as [ZodiacSign, CelestialBody][]) {
    if (ruler === planet) {
      // The opposite sign
      const oppositeIndex = (((signIndex(sign) + 6) % 12) + 12) % 12;
      signs.push(SIGN_BY_INDEX[oppositeIndex]!);
    }
  }
  return signs;
}

// ─── Fall (opposite sign's exaltation) ───────────────────────────

/**
 * Signs where a planet is in fall (opposite its exaltation sign).
 */
function getFallSigns(planet: CelestialBody): ZodiacSign[] {
  const signs: ZodiacSign[] = [];
  for (const [sign, exalted] of Object.entries(EXALTATIONS) as [ZodiacSign, CelestialBody][]) {
    if (exalted === planet) {
      const oppositeIndex = (((signIndex(sign) + 6) % 12) + 12) % 12;
      signs.push(SIGN_BY_INDEX[oppositeIndex]!);
    }
  }
  return signs;
}

// ─── Helpers ─────────────────────────────────────────────────────

const ZODIAC_ORDER: readonly ZodiacSign[] = [
  "ARIES", "TAURUS", "GEMINI", "CANCER", "LEO", "VIRGO",
  "LIBRA", "SCORPIO", "SAGITTARIUS", "CAPRICORN", "AQUARIUS", "PISCES",
];

const SIGN_BY_INDEX: readonly ZodiacSign[] = ZODIAC_ORDER;

function signIndex(sign: ZodiacSign): number {
  return ZODIAC_ORDER.indexOf(sign);
}

// Precompute detriment/fall lookup
const DETRIMENT_MAP = new Map<CelestialBody, Set<ZodiacSign>>();
const FALL_MAP = new Map<CelestialBody, Set<ZodiacSign>>();

const ALL_PLANETS: CelestialBody[] = [
  "SUN", "MOON", "MERCURY", "VENUS", "MARS",
  "JUPITER", "SATURN", "URANUS", "NEPTUNE", "PLUTO",
  "CHIRON", "NORTH_NODE", "SOUTH_NODE",
  "LILITH", "CERES", "PALLAS", "JUNO", "VESTA",
];

for (const planet of ALL_PLANETS) {
  DETRIMENT_MAP.set(planet, new Set(getDetrimentSigns(planet)));
  FALL_MAP.set(planet, new Set(getFallSigns(planet)));
}

// ─── Public API ──────────────────────────────────────────────────

export interface EssentialDignity {
  readonly planet: CelestialBody;
  readonly sign: ZodiacSign;
  readonly domicile: boolean;
  readonly exaltation: boolean;
  readonly detriment: boolean;
  readonly fall: boolean;
  readonly coRuler: boolean;
  readonly ruler: CelestialBody;
}

/**
 * Get the essential dignity status of a planet in a given sign.
 */
export function getEssentialDignity(planet: CelestialBody, sign: ZodiacSign): EssentialDignity {
  const ruler = DOMICILE_RULERS[sign]!;
  const coRuler = CO_RULERS[sign];

  return {
    planet,
    sign,
    domicile: ruler === planet,
    exaltation: EXALTATIONS[sign] === planet,
    detriment: DETRIMENT_MAP.get(planet)?.has(sign) ?? false,
    fall: FALL_MAP.get(planet)?.has(sign) ?? false,
    coRuler: coRuler === planet,
    ruler,
  };
}

/**
 * Get the traditional ruler of a zodiac sign.
 */
export function getRuler(sign: ZodiacSign): CelestialBody {
  return DOMICILE_RULERS[sign]!;
}

/**
 * Get the modern co-ruler of a sign, if one exists.
 */
export function getCoRuler(sign: ZodiacSign): CelestialBody | undefined {
  return CO_RULERS[sign];
}
