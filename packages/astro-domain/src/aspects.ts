/**
 * @astro-engine/domain — Aspect detection engine
 *
 * Detects natal and mundane aspects between planetary positions.
 * Uses orb tolerances from orbs.ts and calculates applying/separating
 * phase from planetary speeds.
 *
 * Updated to use UPPERCASE types from Mirror Mindset conventions.
 */

import type {
  CelestialBody,
  PlanetPosition,
  NatalChartAspect,
  AspectType,
  AspectPhase,
} from "@astro-engine/schema";

import { getAspectType, ASPECT_ANGLES, DEFAULT_ORBS } from "./orbs.js";

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Calculate the shortest arc between two ecliptic longitudes,
 * properly handling 360° wraparound.
 *
 * @returns Angle in degrees (0–180)
 */
export function shortestArc(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Signed delta from `from` to `to` in range (-180, 180].
 * From Mirror Mindset's chart.ts.
 */
export function signedDeltaDegrees(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180;
}

// ─── Aspect Detection ────────────────────────────────────────────

export interface AspectConfig {
  readonly aspects?: readonly AspectType[];
  readonly orbOverrides?: Partial<Record<AspectType, number>>;
  readonly planetPairs?: readonly [CelestialBody, CelestialBody][];
  readonly excludeBodies?: readonly CelestialBody[];
  readonly maxOrb?: number;
}

/**
 * Detect all aspects between the given planet positions.
 *
 * Iterates every unique planet pair, calculates the shortest arc
 * between their longitudes, and matches to the closest aspect type
 * within orb tolerance. Determines applying/separating phase from
 * planetary speed differentials.
 *
 * @param positions - Array of planet positions with longitude and speed
 * @param config    - Optional configuration for aspect filtering and orb overrides
 * @returns Array of detected NatalChartAspect objects sorted by orb (tightest first)
 */
export function detectAspects(
  positions: readonly PlanetPosition[],
  config?: AspectConfig,
): NatalChartAspect[] {
  const aspects: NatalChartAspect[] = [];
  const excludeSet = new Set(config?.excludeBodies ?? []);

  // Filter out excluded bodies
  const filtered = positions.filter((p) => !excludeSet.has(p.body));

  // Build a set of requested planet pairs for O(1) lookup
  const requestedPairs = config?.planetPairs
    ? new Set(
        config.planetPairs.map(
          ([a, b]) => `${a}:${b}` as string,
        ),
      )
    : null;

  // Iterate all unique pairs
  for (let i = 0; i < filtered.length; i++) {
    for (let j = i + 1; j < filtered.length; j++) {
      const posA = filtered[i]!;
      const posB = filtered[j]!;

      // If planetPairs is specified, only check those pairs
      if (requestedPairs) {
        const fwd = `${posA.body}:${posB.body}`;
        const rev = `${posB.body}:${posA.body}`;
        if (!requestedPairs.has(fwd) && !requestedPairs.has(rev)) {
          continue;
        }
      }

      // Calculate shortest arc between longitudes
      const angle = shortestArc(posA.longitude, posB.longitude);

      // Match angle to aspect type within orb tolerance
      const aspectType = getAspectType(angle, config?.orbOverrides);
      if (aspectType === null) continue;

      // Filter by allowed aspect types if configured
      if (config?.aspects && !config.aspects.includes(aspectType)) {
        continue;
      }

      const exactAngle = ASPECT_ANGLES[aspectType]!;
      const orb = Math.abs(angle - exactAngle);
      const maxOrb = config?.orbOverrides?.[aspectType] ?? DEFAULT_ORBS[aspectType]!;

      // Enforce global max orb if configured
      if (config?.maxOrb !== undefined && orb > config.maxOrb) {
        continue;
      }

      // ─── Phase: applying vs separating ───────────────────────
      // relative_speed > 0 means planet A is moving faster than B
      // (in ecliptic longitude). If the current angle is less than
      // the exact angle and the gap is closing, the aspect is applying.
      const relativeSpeed = posA.speed - posB.speed;

      let phase: AspectPhase;
      if (orb < 1e-6) {
        phase = "EXACT";
      } else if (
        (angle < exactAngle && relativeSpeed > 0) ||
        (angle > exactAngle && relativeSpeed < 0)
      ) {
        phase = "APPLYING";
      } else {
        phase = "SEPARATING";
      }

      aspects.push({
        bodyA: posA.body,
        bodyB: posB.body,
        aspect: aspectType,
        orb,
        applying: phase === "APPLYING" || phase === "EXACT",
      });
    }
  }

  // Sort by orb (tightest first) for deterministic output
  aspects.sort((a, b) => a.orb - b.orb);

  return aspects;
}

/**
 * Convenience: detect only major (Ptolemaic) aspects.
 */
export function detectMajorAspects(
  positions: readonly PlanetPosition[],
  config?: Omit<AspectConfig, "aspects">,
): NatalChartAspect[] {
  return detectAspects(positions, {
    ...config,
    aspects: ["CONJUNCTION", "OPPOSITION", "TRINE", "SQUARE", "SEXTILE"],
  });
}
