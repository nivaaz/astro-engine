import {
  EclipticLongitudeDegreesSchema,
  UtcInstantSchema,
  type EclipticLongitudeDegrees,
  type UtcInstant,
} from "@sukara/astro-schema";

export const MILLISECONDS_PER_DAY = 86_400_000;
export const MILLISECONDS_PER_HOUR = 3_600_000;

export function normalizeDegrees(value: number): EclipticLongitudeDegrees {
  const normalized = ((value % 360) + 360) % 360;
  return EclipticLongitudeDegreesSchema.parse(
    Object.is(normalized, -0) ? 0 : normalized,
  );
}

export function signedAngularDelta(value: number): number {
  const normalized = normalizeDegrees(value);
  return normalized >= 180 ? normalized - 360 : normalized;
}

export function circularDistance(a: number, b: number): number {
  return Math.abs(signedAngularDelta(a - b));
}

export function utcFromMilliseconds(milliseconds: number): UtcInstant {
  return UtcInstantSchema.parse(new Date(milliseconds).toISOString());
}

export function milliseconds(instant: UtcInstant): number {
  return Date.parse(instant);
}

export function unwrapNear(value: number, reference: number): number {
  return value + 360 * Math.round((reference - value) / 360);
}
