/**
 * @astro-engine/domain — Transit overlay engine
 *
 * Detects transit-to-natal aspects: for each transiting planet,
 * checks if it forms an aspect to any natal planet.
 */

import type {
  Planet,
  PlanetPosition,
  Aspect,
  AspectConfig,
  NatalChart,
  TransitHit,
  Significance,
} from "./types.js";
import { detectAspects, shortestArc } from "./aspects.js";
import { getAspectType, ASPECT_ANGLES, DEFAULT_ORBS } from "./orbs.js";
import { calculateSignificance } from "./significance.js";

// ─── Public API ──────────────────────────────────────────────────

/**
 * Find transit-to-natal aspects: for each transit planet, detect
 * aspects to natal planets and return structured TransitHit results.
 *
 * @param transitPositions - Current planetary positions (transiting sky)
 * @param natalChart       - The natal chart to compare against
 * @param config           - Optional aspect configuration overrides
 * @returns Array of TransitHit objects sorted by orb (tightest first)
 */
export function findTransitHits(
  transitPositions: readonly PlanetPosition[],
  natalChart: NatalChart,
  config?: AspectConfig,
): TransitHit[] {
  const hits: TransitHit[] = [];

  // Build a map of natal positions by planet for O(1) lookup
  const natalMap = new Map<Planet, PlanetPosition>();
  for (const pos of natalChart.positions) {
    natalMap.set(pos.planet, pos);
  }

  const excludeSet = new Set(config?.excludePlanets ?? []);

  for (const transitPos of transitPositions) {
    if (excludeSet.has(transitPos.planet)) continue;

    for (const natalPos of natalChart.positions) {
      if (excludeSet.has(natalPos.planet)) continue;

      // Don't aspect a planet to itself
      if (transitPos.planet === natalPos.planet) continue;

      // If planetPairs is specified, only check those pairs
      if (config?.planetPairs) {
        const matches = config.planetPairs.some(
          ([a, b]) =>
            (a === transitPos.planet && b === natalPos.planet) ||
            (b === transitPos.planet && a === natalPos.planet),
        );
        if (!matches) continue;
      }

      // Calculate shortest arc
      const angle = shortestArc(
        transitPos.longitude as number,
        natalPos.longitude as number,
      );

      // Match to aspect type
      const aspectType = getAspectType(angle, config?.orbOverrides);
      if (aspectType === null) continue;

      // Filter by allowed aspect types
      if (config?.aspects && !config.aspects.includes(aspectType)) continue;

      const exactAngle = ASPECT_ANGLES[aspectType]!;
      const orb = Math.abs(angle - exactAngle);
      const maxOrb = config?.orbOverrides?.[aspectType] ??
        DEFAULT_ORBS[aspectType]!;

      // Enforce global max orb
      if (config?.maxOrb !== undefined && orb > config.maxOrb) continue;

      // Phase determination — for transits, the transit planet's speed
      // is what matters relative to the natal planet (which is fixed/snapshot).
      // We treat the natal planet speed as 0 (it's a snapshot in time).
      const relativeSpeed = transitPos.speed;

      let phase: "applying" | "exact" | "separating";
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

      const aspect: Aspect = {
        planetA: transitPos.planet,
        planetB: natalPos.planet,
        type: aspectType,
        exactAngle: exactAngle as Aspect["exactAngle"],
        orb: orb as Aspect["orb"],
        maxOrb: maxOrb as Aspect["maxOrb"],
        phase,
        isPartile,
        isApplying: phase === "applying",
      };

      // Determine significance using the scoring engine
      const sigResult = calculateSignificance(
        "aspect",
        [transitPos.planet, natalPos.planet],
        orb,
        isPartile,
        transitPos.isRetrograde,
        undefined, // pass number
        true, // natalContact = true
        aspectType,
      );

      hits.push({
        transitEvent: {
          id: `transit-${transitPos.planet}-${aspectType}-${natalPos.planet}`,
          type: "aspect",
          stream: "planetary",
          significance: sigResult.level,
          exactAtUtc: "" as NatalChart["birthData"]["datetime"],
          exactAtJulianDay: 0 as unknown as import("./types.js").JulianDay,
          bodies: [transitPos.planet, natalPos.planet],
          positions: [transitPos, natalPos],
          aspect,
          sign: natalPos.sign,
          degree: natalPos.signDegree,
          isRetrograde: transitPos.isRetrograde,
          createdAt: "" as NatalChart["birthData"]["datetime"],
          version: "0.1.0",
        },
        natalPlanet: natalPos.planet,
        aspect,
        significance: sigResult.level,
      });
    }
  }

  // Sort by orb (tightest aspects first), then by significance
  const significanceOrder: Record<Significance, number> = {
    major: 0,
    notable: 1,
    daily: 2,
  };
  hits.sort((a, b) => {
    const orbDiff =
      (a.aspect.orb as number) - (b.aspect.orb as number);
    if (Math.abs(orbDiff) > 0.01) return orbDiff;
    return significanceOrder[a.significance] - significanceOrder[b.significance];
  });

  return hits;
}