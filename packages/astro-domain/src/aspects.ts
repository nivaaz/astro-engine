/**
 * @astro-engine/domain — Aspect detection engine
 *
 * Detects natal and mundane aspects between planetary positions.
 * Uses orb tolerances from orbs.ts and calculates applying/separating
 * phase from planetary speeds.
 */

import type {
  Planet,
  PlanetPosition,
  Aspect,
  AspectConfig,
  AspectType,
  AspectPhase,
  Degree,
  OrbDegrees,
} from "./types.js";
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

// ─── Public API ──────────────────────────────────────────────────

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
 * @returns Array of detected Aspect objects
 */
export function detectAspects(
  positions: readonly PlanetPosition[],
  config?: AspectConfig,
): Aspect[] {
  const aspects: Aspect[] = [];
  const excludeSet = new Set(config?.excludePlanets ?? []);

  // Filter out excluded planets
  const filtered = positions.filter((p) => !excludeSet.has(p.planet));

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
        const fwd = `${posA.planet}:${posB.planet}`;
        const rev = `${posB.planet}:${posA.planet}`;
        if (!requestedPairs.has(fwd) && !requestedPairs.has(rev)) {
          continue;
        }
      }

      // Calculate shortest arc between longitudes
      const angle = shortestArc(
        posA.longitude as number,
        posB.longitude as number,
      );

      // Match angle to aspect type within orb tolerance
      const aspectType = getAspectType(angle, config?.orbOverrides);
      if (aspectType === null) continue;

      // Filter by allowed aspect types if configured
      if (config?.aspects && !config.aspects.includes(aspectType)) {
        continue;
      }

      const exactAngle = ASPECT_ANGLES[aspectType]!;
      const orb = Math.abs(angle - exactAngle) as OrbDegrees;
      const maxOrb = (config?.orbOverrides?.[aspectType] ??
        DEFAULT_ORBS[aspectType]!) as OrbDegrees;

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
        phase = "exact";
      } else if (
        (angle < exactAngle && relativeSpeed > 0) ||
        (angle > exactAngle && relativeSpeed < 0)
      ) {
        phase = "applying";
      } else {
        phase = "separating";
      }

      const isPartile = orb < 1;

      aspects.push({
        planetA: posA.planet,
        planetB: posB.planet,
        type: aspectType,
        exactAngle: exactAngle as Degree,
        orb,
        maxOrb,
        phase,
        isPartile,
        isApplying: phase === "applying",
      });
    }
  }

  // Sort by orb (tightest first) for deterministic output
  aspects.sort((a, b) => (a.orb as number) - (b.orb as number));

  return aspects;
}

/**
 * Convenience: detect only major (Ptolemaic) aspects.
 */
export function detectMajorAspects(
  positions: readonly PlanetPosition[],
  config?: Omit<AspectConfig, "aspects">,
): Aspect[] {
  return detectAspects(positions, {
    ...config,
    aspects: ["conjunction", "opposition", "trine", "square", "sextile"],
  });
}