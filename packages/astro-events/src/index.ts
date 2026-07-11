/**
 * @astro-engine/events
 *
 * Event detection, classification, and significance scoring.
 *
 * Takes raw planetary data from domain and produces
 * structured AstrologyEvent objects with stream classification
 * and significance levels.
 */

// Re-export domain types for convenience
export type {
  Planet,
  ZodiacSign,
  AspectType,
  EventType,
  EventStream,
  Significance,
  PlanetPosition,
  Aspect,
  AstrologyEvent,
  AspectPhase,
  StationType,
  LunationType,
  EventFilter,
} from "../astro-domain/src/types.js";

/**
 * Classify a raw aspect event into its event stream.
 *
 * Rules:
 * - Outer planets (Saturn, Uranus, Neptune, Pluto) → slow_sky
 * - Lunation aspects (Sun-Moon) → lunation
 * - Everything else → planetary
 */
export function classifyStream(bodies: readonly string[]): string {
  const outerPlanets = ["saturn", "uranus", "neptune", "pluto"];
  const hasOuter = bodies.some((b) => outerPlanets.includes(b));
  const isLunation =
    bodies.length === 2 &&
    bodies.includes("sun") &&
    bodies.includes("moon");

  if (isLunation) return "lunation";
  if (hasOuter) return "slow_sky";
  return "planetary";
}

/**
 * Get the event type from raw data.
 */
export function classifyEventType(data: {
  isAspect?: boolean;
  isIngress?: boolean;
  isStation?: boolean;
  isLunation?: boolean;
  isEclipse?: boolean;
  isVoidOfCourse?: boolean;
  isCazimi?: boolean;
  isCombust?: boolean;
}): string {
  if (data.isEclipse) return "eclipse";
  if (data.isLunation) return "lunation";
  if (data.isStation) return "station";
  if (data.isCazimi) return "cazimi";
  if (data.isCombust) return "combust";
  if (data.isVoidOfCourse) return "void_of_course";
  if (data.isIngress) return "ingress";
  if (data.isAspect) return "aspect";
  return "aspect";
}

/**
 * Generate a deterministic event ID from event parameters.
 *
 * Uses a simple hash (not crypto) for speed — the ID just needs
 * to be deterministic and collision-resistant within a session.
 */
export function createEventId(
  type: string,
  body1: string,
  body2: string,
  julianDay: number,
  aspect?: string,
  pass?: number,
): string {
  const parts = [type, body1, body2, julianDay.toFixed(4)];
  if (aspect) parts.push(aspect);
  if (pass !== undefined) parts.push(String(pass));

  const input = parts.join(":");
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }

  return `ae-${Math.abs(hash).toString(36)}`;
}
