/**
 * @astro-engine/domain — Significance scoring
 *
 * Implements the scoring system from specs/event-taxonomy.md.
 */

import type { EventType, CelestialBody, Significance } from "./types.js";

const OUTER_PLANETS: ReadonlySet<CelestialBody> = new Set(["SATURN", "URANUS", "NEPTUNE", "PLUTO"]);

const BASE_SCORES: Record<EventType, number> = {
  ECLIPSE: 100,
  STATION: 90,
  INGRESS: 85,
  ASPECT: 80,
  LUNATION: 60,
  CAZIMI: 20,
  COMBUST: 15,
  VOID_OF_COURSE: 5,
};

export function calculateSignificance(
  eventType: EventType,
  bodies: readonly CelestialBody[],
  
  isPartile?: boolean,
  isApplying?: boolean,
  isRetrograde?: boolean,
  passNumber?: number,
): Significance {
  let score = BASE_SCORES[eventType] ?? 30;

  if (isPartile) score += 20;
  if (isApplying) score += 5;
  if (isRetrograde) score += 10;
  if (passNumber === 2) score += 5;

  if (bodies.some((b) => OUTER_PLANETS.has(b))) score += 10;

  if (score >= 70) return "MAJOR";
  if (score >= 25) return "NOTABLE";
  return "DAILY";
}
