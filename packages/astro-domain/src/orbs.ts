/**
 * @astro-engine/domain — Orb calculations
 *
 * Default orb tolerances for each aspect type and helpers
 * for mapping angles to aspect types.
 */

import type { AspectType } from "./types.js";

/**
 * Default maximum orb (in degrees) for each aspect type.
 * Based on traditional/Ptolemy-derived values.
 */
export const DEFAULT_ORBS: Record<AspectType, number> = {
  conjunction: 10,
  opposition: 10,
  trine: 8,
  square: 8,
  sextile: 6,
  quincunx: 3,
  semi_sextile: 2,
  semi_square: 2,
  sesquiquadrate: 2,
  quintile: 2,
  bi_quintile: 2,
};

/**
 * Exact angle (in degrees) for each aspect type.
 */
export const ASPECT_ANGLES: Record<AspectType, number> = {
  conjunction: 0,
  opposition: 180,
  trine: 120,
  square: 90,
  sextile: 60,
  quincunx: 150,
  semi_sextile: 30,
  semi_square: 45,
  sesquiquadrate: 135,
  quintile: 72,
  bi_quintile: 144,
};

/**
 * All known aspect types, ordered by angle for deterministic iteration.
 */
export const ALL_ASPECT_TYPES: readonly AspectType[] = [
  "conjunction",
  "semi_sextile",
  "semi_square",
  "sextile",
  "quintile",
  "square",
  "trine",
  "bi_quintile",
  "sesquiquadrate",
  "quincunx",
  "opposition",
];

/**
 * Map a raw angle (0–180° shortest arc) to the corresponding aspect type,
 * or null if no aspect matches within the given orb tolerance.
 *
 * @param angle - The shortest arc between two longitudes (0–180°)
 * @param orbOverrides - Optional custom orb limits per aspect type
 * @returns The matching AspectType, or null
 */
export function getAspectType(
  angle: number,
  orbOverrides?: Partial<Record<AspectType, number>>,
): AspectType | null {
  let bestType: AspectType | null = null;
  let bestDiff = Infinity;

  for (const type of ALL_ASPECT_TYPES) {
    const exactAngle = ASPECT_ANGLES[type];
    const diff = Math.abs(angle - exactAngle);
    const maxOrb = orbOverrides?.[type] ?? DEFAULT_ORBS[type];

    if (diff <= maxOrb && diff < bestDiff) {
      bestDiff = diff;
      bestType = type;
    }
  }

  return bestType;
}

/**
 * Get the exact angle for a given aspect type.
 */
export function getExactAngle(type: AspectType): number {
  return ASPECT_ANGLES[type];
}

/**
 * Get the default orb for a given aspect type.
 */
export function getDefaultOrb(type: AspectType): number {
  return DEFAULT_ORBS[type];
}
