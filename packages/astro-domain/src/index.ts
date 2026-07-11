/**
 * @astro-engine/domain
 *
 * Core astrology logic — aspect detection, orb calculations,
 * dignities, transit overlays.
 *
 * This package provides the domain logic layer for Astro Engine.
 * It depends on @astro-engine/schema for types and constants.
 */

// Re-export schema types for convenience
export * from "./types.js";

// Aspect detection
export { detectAspects, detectMajorAspects, shortestArc, signedDeltaDegrees } from "./aspects.js";
export type { AspectConfig } from "./aspects.js";

// Orb calculations
export { getAspectType, getExactAngle, getDefaultOrb, ALL_ASPECT_TYPES, ASPECT_ANGLES, DEFAULT_ORBS } from "./orbs.js";

// Zodiac utilities
export { signFromLongitude, normaliseLongitude } from "./zodiac.js";

// Dignities
export { getEssentialDignity, getRuler } from "./dignities.js";

// Significance scoring
export { calculateSignificance } from "./significance.js";

// Transit overlays
export { findTransitHits } from "./transits.js";
