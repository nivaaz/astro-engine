import {
  ASPECT_ANGLES,
  AspectSchema,
  DEFAULT_TIGHT_ORBS,
  EPHEMERIS_BODY_ORDER,
  type Aspect,
  type AspectType,
  type PlanetPosition,
} from "@sukara/astro-schema";
import { normalizeDegrees, signedAngularDelta } from "./math.js";

const ASPECT_ORDER = Object.keys(ASPECT_ANGLES) as AspectType[];
const EXACT_EPSILON_DEGREES = 1e-9;

export interface AspectAnalysis {
  readonly type: AspectType;
  readonly angle: number;
  readonly signedResidual: number;
  readonly orb: number;
  readonly relativeSpeed: number;
  readonly phase: Aspect["phase"];
}

function residualForAspect(delta: number, type: AspectType): number {
  const angle = ASPECT_ANGLES[type];
  if (angle === 0 || angle === 180) {
    return signedAngularDelta(delta - angle);
  }
  const positive = signedAngularDelta(delta - angle);
  const negative = signedAngularDelta(delta + angle);
  return Math.abs(positive) <= Math.abs(negative) ? positive : negative;
}

export function analyzeAspect(
  bodyA: PlanetPosition,
  bodyB: PlanetPosition,
  type: AspectType,
): AspectAnalysis {
  const delta = normalizeDegrees(bodyB.longitude - bodyA.longitude);
  const signedResidual = residualForAspect(delta, type);
  const orb = Math.abs(signedResidual);
  const relativeSpeed = bodyB.longitudeSpeed - bodyA.longitudeSpeed;
  let phase: Aspect["phase"];
  if (orb <= EXACT_EPSILON_DEGREES) phase = "exact";
  else if (Math.abs(relativeSpeed) <= EXACT_EPSILON_DEGREES)
    phase = "indeterminate";
  else phase = signedResidual * relativeSpeed < 0 ? "applying" : "separating";
  return {
    type,
    angle: ASPECT_ANGLES[type],
    signedResidual,
    orb,
    relativeSpeed,
    phase,
  };
}

export function detectTightAspects(
  positions: readonly PlanetPosition[],
  orbs: Readonly<Record<AspectType, number>> = DEFAULT_TIGHT_ORBS,
): readonly Aspect[] {
  const aspects: Aspect[] = [];
  for (let left = 0; left < positions.length; left += 1) {
    for (let right = left + 1; right < positions.length; right += 1) {
      const first = positions[left]!;
      const second = positions[right]!;
      const [bodyA, bodyB] =
        EPHEMERIS_BODY_ORDER.indexOf(first.body) <
        EPHEMERIS_BODY_ORDER.indexOf(second.body)
          ? [first, second]
          : [second, first];
      for (const type of ASPECT_ORDER) {
        const analysis = analyzeAspect(bodyA, bodyB, type);
        if (analysis.orb > Math.min(orbs[type], DEFAULT_TIGHT_ORBS[type]))
          continue;
        aspects.push(
          AspectSchema.parse({
            bodyA: bodyA.body,
            bodyB: bodyB.body,
            type,
            angle: analysis.angle,
            orb: analysis.orb,
            phase: analysis.phase,
          }),
        );
      }
    }
  }
  return aspects.sort((a, b) => {
    if (a.orb !== b.orb) return a.orb - b.orb;
    const bodyA =
      EPHEMERIS_BODY_ORDER.indexOf(a.bodyA) -
      EPHEMERIS_BODY_ORDER.indexOf(b.bodyA);
    if (bodyA !== 0) return bodyA;
    return (
      EPHEMERIS_BODY_ORDER.indexOf(a.bodyB) -
      EPHEMERIS_BODY_ORDER.indexOf(b.bodyB)
    );
  });
}
