/**
 * @astro-engine/domain — Orb calculations
 *
 * Default orb tolerances for each aspect type and helpers
 * for mapping angles to aspect types.
 *
 * Updated to use UPPERCASE aspect types from Mirror Mindset conventions.
 */

import type { AspectType } from "@astro-engine/schema";
import { ASPECT_ANGLES, DEFAULT_ORBS } from "@astro-engine/schema";

// Re-export for convenience
export { ASPECT_ANGLES, DEFAULT_ORBS };

/**
 * All known aspect types, ordered by angle for deterministic iteration.
 */
export const ALL_ASPECT_TYPES: readonly AspectType[] = [
  "CONJUNCTION",
  "SEMI_SEXTILE",
  "SEMI_SQUARE",
  "SEXTILE",
  "QUINTILE",
  "SQUARE",
  "TRINE",
  "BI_QUINTILE",
  "SESQUIQUADRATE",
  "QUINCUNX",
  "OPPOSITION",
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
