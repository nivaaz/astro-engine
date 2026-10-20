/** UI refresh policy; canonical snapshot validity remains unchanged. */
export const SKY_FRESHNESS_MS = 5 * 60_000;

export function isSkyStale(calculatedAt: string, now: number): boolean {
  return now - Date.parse(calculatedAt) >= SKY_FRESHNESS_MS;
}
