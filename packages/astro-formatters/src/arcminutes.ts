export interface ArcminuteOptions {
  /** Full-cycle angles wrap at 360; sign-relative values may use another cycle. */
  readonly wrapAt?: number;
}

/** Format a finite degree value to the nearest arcminute with carry-safe wrapping. */
export function formatArcminutes(
  value: number,
  { wrapAt = 360 }: ArcminuteOptions = {},
): string {
  if (!Number.isFinite(value) || !Number.isFinite(wrapAt) || wrapAt <= 0) {
    throw new TypeError("Arcminute formatting requires finite positive bounds");
  }
  const normalized = ((value % wrapAt) + wrapAt) % wrapAt;
  const cycleMinutes = Math.round(wrapAt * 60);
  const totalMinutes = Math.round(normalized * 60) % cycleMinutes;
  return `${Math.floor(totalMinutes / 60)}°${String(totalMinutes % 60).padStart(2, "0")}′`;
}
