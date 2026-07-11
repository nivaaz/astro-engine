/**
 * @astro-engine/domain — Transit overlay engine
 *
 * Detects transit-to-natal aspects.
 */

import type { CelestialBody, PlanetPosition, NatalChartAspect, NatalChart } from "./types.js";
import { shortestArc } from "./aspects.js";
import { getAspectType, ASPECT_ANGLES, DEFAULT_ORBS } from "./orbs.js";

export interface TransitHit {
  readonly transitBody: CelestialBody;
  readonly natalBody: CelestialBody;
  readonly aspect: NatalChartAspect;
}

export function findTransitHits(
  transitPositions: readonly PlanetPosition[],
  natalChart: NatalChart,
): TransitHit[] {
  const hits: TransitHit[] = [];

  const natalBodies = Object.entries(natalChart.bodies);

  for (const tPos of transitPositions) {
    for (const [natalName, natalPos] of natalBodies) {
      const angle = shortestArc(tPos.longitude, natalPos.longitude);
      const aspectType = getAspectType(angle);
      if (!aspectType) continue;

      const exactAngle = ASPECT_ANGLES[aspectType]!;
      const orb = Math.abs(angle - exactAngle);
      const maxOrb = DEFAULT_ORBS[aspectType]!;
      if (orb > maxOrb) continue;

      const relSpeed = tPos.speed - natalPos.speed;
      const applying = (angle < exactAngle && relSpeed > 0) || (angle > exactAngle && relSpeed < 0);

      hits.push({
        transitBody: tPos.body,
        natalBody: natalName as CelestialBody,
        aspect: {
          bodyA: tPos.body,
          bodyB: natalName,
          aspect: aspectType,
          orb,
          applying,
        },
      });
    }
  }

  return hits.sort((a, b) => a.aspect.orb - b.aspect.orb);
}
