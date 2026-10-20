import { describe, expect, it } from "vitest";
import { fixtureSky } from "../../lib/fixture-sky";
import { createChartCopyHandler } from "../chart-copy-route";
import { uiFixtureProvider } from "../ui-fixture-provider";

async function post(
  handler: ReturnType<typeof createChartCopyHandler>,
  body: unknown,
) {
  return handler(
    new Request("http://localhost/api/chart-copy", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("chart-copy server boundary", () => {
  it("formats a supplied canonical current sky without recalculating it", async () => {
    const payload = fixtureSky();
    const response = await post(
      createChartCopyHandler(() => {
        throw new Error("provider should not run");
      }),
      {
        context: "current-sky",
        chartType: "Current sky",
        date: payload.currentSky.metadata.calculatedAt,
        currentSky: payload.currentSky,
      },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    const json = await response.json();
    expect(json.output).toContain("Data from ASTRO ENGINE by sukara.tech");
    expect(json.output).toContain("Zodiac: Tropical");
  });

  it("calculates event charts only through an explicit copy request", async () => {
    const response = await post(
      createChartCopyHandler(() => uiFixtureProvider()),
      {
        context: "event",
        chartType: "Venus enters Aquarius",
        instant: "2026-01-01T00:00:00.000Z",
        location: {
          latitude: -33.8688,
          longitude: 151.2093,
          timezone: "Australia/Sydney",
        },
      },
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.output).toContain("House system: Whole Sign");
    expect(json.output).toContain("Location: latitude");
  });

  it("fails closed for invalid input and unavailable providers", async () => {
    const invalid = await post(
      createChartCopyHandler(() => uiFixtureProvider()),
      {
        context: "saturn-return-pass",
        chartType: "pass",
        instant: "not-an-instant",
      },
    );
    expect(invalid.status).toBe(400);
    expect(JSON.stringify(await invalid.json())).not.toContain(
      "not-an-instant",
    );

    const unavailable = await post(
      createChartCopyHandler(() => null),
      {
        context: "event",
        chartType: "event",
        instant: "2026-01-01T00:00:00.000Z",
      },
    );
    expect(unavailable.status).toBe(503);
    expect((await unavailable.json()).error.code).toBe("provider-unavailable");
  });
});
