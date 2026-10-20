import { describe, expect, it } from "vitest";
import { isSkyStale, SKY_FRESHNESS_MS } from "../sky-freshness";

describe("sky presentation freshness", () => {
  const instant = "2026-10-20T00:00:00.000Z";
  const calculatedAt = Date.parse(instant);

  it("does not treat an instantaneous snapshot's 1 ms validity as UI expiry", () => {
    expect(isSkyStale(instant, calculatedAt + 1500)).toBe(false);
  });

  it("expires at the five-minute boundary", () => {
    expect(isSkyStale(instant, calculatedAt + SKY_FRESHNESS_MS - 1)).toBe(
      false,
    );
    expect(isSkyStale(instant, calculatedAt + SKY_FRESHNESS_MS)).toBe(true);
  });
});
