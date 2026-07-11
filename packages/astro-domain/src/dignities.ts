/**
 * @astro-engine/domain — Essential dignities
 *
 * Traditional essential dignity system: domicile, exaltation,
 * detriment, and fall for planets in zodiac signs.
 */

import type { Planet, ZodiacSign } from "./types.js";

// ─── Domicile Rulers ─────────────────────────────────────────────

/**
 * Traditional domicile rulers for each zodiac sign.
 * Uses classical rulers (Mars rules Scorpio, Jupiter rules Pisces, Saturn rules Aquarius)
 * with modern outer-planet co-rulers noted separately.
 */
const DOMICILE_RULERS: Record<ZodiacSign, Planet> = {
  aries: "mars",
  taurus: "venus",
  gemini: "mercury",
  cancer: "moon",
  leo: "sun",
  virgo: "mercury",
  libra: "venus",
  scorpio: "mars",
  sagittarius: "jupiter",
  capricorn: "saturn",
  aquarius: "saturn",
  pisces: "jupiter",
};

/**
 * Modern co-rulers (outer planets) for signs that have them.
 */
const CO_RULERS: Partial<Record<ZodiacSign, Planet>> = {
  scorpio: "pluto",
  aquarius: "uranus",
  pisces: "neptune",
};

// ─── Exaltation ──────────────────────────────────────────────────

/**
 * Planets in exaltation by sign.
 * Classical exaltation scheme.
 */
const EXALTATIONS: Partial<Record<ZodiacSign, Planet>> = {
  aries: "sun",
  taurus: "moon",
  cancer: "jupiter",
  virgo: "mercury",
  libra: "saturn",
  capricorn: "mars",
  pisces: "venus",
};

// ─── Detriment (opposite sign's domicile ruler) ──────────────────

/**
 * Signs where a planet is in detriment (opposite its domicile).
 */
function getDetrimentSigns(planet: Planet): ZodiacSign[] {
  const signs: ZodiacSign[] = [];
  for (const [sign, ruler] of Object.entries(DOMICILE_RULERS) as [ZodiacSign, Planet][]) {
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
function getFallSigns(planet: Planet): ZodiacSign[] {
  const signs: ZodiacSign[] = [];
  for (const [sign, exalted] of Object.entries(EXALTATIONS) as [ZodiacSign, Planet][]) {
    if (exalted === planet) {
      const oppositeIndex = (((signIndex(sign) + 6) % 12) + 12) % 12;
      signs.push(SIGN_BY_INDEX[oppositeIndex]!);
    }
  }
  return signs;
}

// ─── Helpers ─────────────────────────────────────────────────────

const ZODIAC_ORDER: readonly ZodiacSign[] = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];

const SIGN_BY_INDEX: readonly ZodiacSign[] = ZODIAC_ORDER;

function signIndex(sign: ZodiacSign): number {
  return ZODIAC_ORDER.indexOf(sign);
}

// Precompute detriment/fall lookup
const DETRIMENT_MAP = new Map<Planet, Set<ZodiacSign>>();
const FALL_MAP = new Map<Planet, Set<ZodiacSign>>();

const ALL_PLANETS: Planet[] = [
  "sun", "moon", "mercury", "venus", "mars",
  "jupiter", "saturn", "uranus", "neptune", "pluto",
  "chiron", "north_node", "south_node",
  "lilith", "ceres", "pallas", "juno", "vesta",
];

for (const planet of ALL_PLANETS) {
  DETRIMENT_MAP.set(planet, new Set(getDetrimentSigns(planet)));
  FALL_MAP.set(planet, new Set(getFallSigns(planet)));
}

// ─── Public API ──────────────────────────────────────────────────

export interface EssentialDignity {
  readonly planet: Planet;
  readonly sign: ZodiacSign;
  readonly domicile: boolean;
  readonly exaltation: boolean;
  readonly detriment: boolean;
  readonly fall: boolean;
  readonly coRuler: boolean;
  readonly ruler: Planet;
}

/**
 * Get the essential dignity status of a planet in a given sign.
 */
export function getEssentialDignity(planet: Planet, sign: ZodiacSign): EssentialDignity {
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
export function getRuler(sign: ZodiacSign): Planet {
  return DOMICILE_RULERS[sign]!;
}

/**
 * Get the modern co-ruler of a sign, if one exists.
 */
export function getCoRuler(sign: ZodiacSign): Planet | undefined {
  return CO_RULERS[sign];
}
