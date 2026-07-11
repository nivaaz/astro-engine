/**
 * @astro-engine/domain — Significance scoring
 *
 * Implements the scoring system from specs/event-taxonomy.md.
 * Each event gets a numeric score that maps to a significance level.
 */

import type {
  EventType,
  Planet,
  Significance,
  AspectType,
} from "./types.js";

// ─── Constants ───────────────────────────────────────────────────

/** Outer planets — used to determine "outer-planet" event modifiers */
const OUTER_PLANETS: ReadonlySet<Planet> = new Set([
  "saturn", "uranus", "neptune", "pluto",
]);

/** Ptolemaic (major) aspects */
const PTOLEMAIC_ASPECTS: ReadonlySet<AspectType> = new Set([
  "conjunction", "opposition", "trine", "square", "sextile",
]);

// ─── Base Scores ─────────────────────────────────────────────────

/**
 * Base score by event type.
 * Mapped from the taxonomy table in event-taxonomy.md.
 */
const BASE_SCORES: Record<EventType, number> = {
  eclipse: 100,
  station: 90,
  ingress: 85,
  aspect: 80,
  lunation: 60,
  cazimi: 20,
  combust: 15,
  void_of_course: 5,
};

/**
 * Get the base score for an event type.
 * Some event types have sub-scoring based on context; use the
 * overload parameters for finer-grained scores.
 */
function getBaseScore(
  eventType: EventType,
  bodies?: readonly Planet[],
  aspectType?: AspectType,
): number {
  switch (eventType) {
    case "eclipse":
      return 100;
    case "station":
      // Outer-planet stations score highest
      if (bodies?.some((b) => OUTER_PLANETS.has(b))) return 90;
      return 70;
    case "ingress":
      // Outer-planet ingresses score higher
      if (bodies?.some((b) => OUTER_PLANETS.has(b))) return 85;
      return 25;
    case "aspect": {
      const hasOuter = bodies?.some((b) => OUTER_PLANETS.has(b)) ?? false;
      const isPtolemaic = aspectType ? PTOLEMAIC_ASPECTS.has(aspectType) : true;
      if (hasOuter) return 80;
      if (isPtolemaic) return 30;
      return 15; // minor aspects between inner planets
    }
    case "lunation":
      // Full/new moons score higher; quarters are lower
      // Without sub-type info, default to 60
      return 60;
    case "cazimi":
      return 20;
    case "combust":
      return 15;
    case "void_of_course":
      return 5;
    default:
      return 10;
  }
}

// ─── Modifiers ───────────────────────────────────────────────────

const PARTILE_BONUS = 20;
const APPLYING_BONUS = 5;
const NATAL_CONTACT_BONUS = 30;
const RETROGRADE_BONUS = 10;

// ─── Thresholds ──────────────────────────────────────────────────

const MAJOR_THRESHOLD = 70;
const NOTABLE_THRESHOLD = 25;

// ─── Public API ──────────────────────────────────────────────────

export interface SignificanceResult {
  readonly score: number;
  readonly level: Significance;
  readonly breakdown: {
    readonly base: number;
    readonly partile: number;
    readonly applying: number;
    readonly retrograde: number;
    readonly natalContact: number;
  };
}

/**
 * Calculate the significance score and level for an event.
 *
 * @param eventType - The type of astrological event
 * @param bodies - Planets involved in the event
 * @param orb - Current orb from exact (in degrees)
 * @param isPartile - Whether the aspect is partile (orb < 1°)
 * @param isRetrograde - Whether any involved planet is retrograde
 * @param pass - Multi-pass number (for outer-planet transits)
 * @param natalContact - Whether this event contacts a natal planet
 * @param aspectType - The specific aspect type (for finer base scoring)
 */
export function calculateSignificance(
  eventType: EventType,
  bodies: readonly Planet[] = [],
  orb: number = 0,
  isPartile: boolean = false,
  isRetrograde: boolean = false,
  pass?: number,
  natalContact?: boolean,
  aspectType?: AspectType,
): SignificanceResult {
  const base = getBaseScore(eventType, bodies, aspectType);

  // Partile bonus: orb < 1°
  const partileScore = isPartile || orb < 1 ? PARTILE_BONUS : 0;

  // Applying bonus: aspect is still forming (not yet exact or separating)
  // We consider applying if orb > 0 (not yet exact) — the caller decides applying vs separating
  const applyingScore = orb > 0 && !isPartile ? APPLYING_BONUS : 0;

  // Retrograde bonus
  const retrogradeScore = isRetrograde ? RETROGRADE_BONUS : 0;

  // Natal contact bonus
  const natalScore = natalContact ? NATAL_CONTACT_BONUS : 0;

  // Multi-pass: 2nd and 3rd passes are slightly less significant than 1st
  // but the fact of multi-pass itself is notable (already captured in base score for outer planets)
  const passModifier = pass && pass > 1 ? -5 * (pass - 1) : 0;

  const total = base + partileScore + applyingScore + retrogradeScore + natalScore + passModifier;
  const score = Math.max(0, Math.min(100, total));

  let level: Significance;
  if (score >= MAJOR_THRESHOLD) {
    level = "major";
  } else if (score >= NOTABLE_THRESHOLD) {
    level = "notable";
  } else {
    level = "daily";
  }

  return {
    score,
    level,
    breakdown: {
      base,
      partile: partileScore,
      applying: applyingScore,
      retrograde: retrogradeScore,
      natalContact: natalScore,
    },
  };
}

/**
 * Quick check: does this score qualify as a given significance level?
 */
export function meetsSignificance(score: number, minimum: Significance): boolean {
  switch (minimum) {
    case "major":
      return score >= MAJOR_THRESHOLD;
    case "notable":
      return score >= NOTABLE_THRESHOLD;
    case "daily":
      return true;
  }
}

export { MAJOR_THRESHOLD, NOTABLE_THRESHOLD, OUTER_PLANETS, PTOLEMAIC_ASPECTS };
