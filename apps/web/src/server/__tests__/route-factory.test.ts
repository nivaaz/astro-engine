import {
  LocalAnglesSchema,
  PositionBatchSchema,
  ProviderCapabilitiesSchema,
  type EphemerisBody,
  type EphemerisProvider,
  type ProviderProvenance,
} from "@sukara/astro-schema";
import { describe, expect, it, vi } from "vitest";
import { createAstroRouteHandlers } from "../route-factory";

const INSTANT = "2026-01-01T00:00:00.000Z";
const BIRTH = "1996-01-01T00:00:00.000Z";

const provenance: ProviderProvenance = {
  providerId: "unrestricted-deterministic-fixture",
  providerVersion: "1.0.0",
  dataVersion: "synthetic-v1",
  quality: "fixture",
};

const baseLongitudes: Record<EphemerisBody, number> = {
  sun: 280,
  moon: 42,
  mercury: 271,
  venus: 310,
  mars: 90,
  jupiter: 115,
  saturn: 100,
  uranus: 55,
  neptune: 2,
  pluto: 305,
  "true-north-node": 350,
};

function fixtureProvider(): EphemerisProvider {
  return {
    id: provenance.providerId,
    capabilities: ProviderCapabilitiesSchema.parse({
      positions: true,
      angles: true,
      supportedRange: {
        start: "1990-01-01T00:00:00.000Z",
        end: "2035-01-01T00:00:00.000Z",
      },
      maxBodiesPerRequest: 11,
    }),
    async getPositions(request) {
      return {
        ok: true,
        value: PositionBatchSchema.parse({
          instant: request.instant,
          provenance,
          positions: request.bodies.map((body) => ({
            body,
            instant: request.instant,
            longitude: baseLongitudes[body],
            longitudeSpeed: 0,
          })),
        }),
      };
    },
    async getLocalAngles(request) {
      return {
        ok: true,
        value: LocalAnglesSchema.parse({
          instant: request.instant,
          location: request.location,
          ascendant: 125,
          midheaven: 33,
          provenance,
        }),
      };
    },
  };
}

async function post(
  handlers: ReturnType<typeof createAstroRouteHandlers>,
  body: unknown,
) {
  return handlers.POST(
    new Request("http://localhost/api/sky", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("provider-neutral server composition", () => {
  it("fails closed without resolving a provider", async () => {
    const handlers = createAstroRouteHandlers(() => null);
    const response = await handlers.GET();
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toContain("no-store");
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "provider-unavailable",
        message: "The licensed ephemeris provider is not configured.",
        retryable: false,
      },
    });
  });

  it.each([
    ["current-sky", { operation: "current-sky", instant: INSTANT }],
    ["human-design", { operation: "human-design", instant: INSTANT }],
    [
      "whole-sign",
      {
        operation: "whole-sign",
        instant: INSTANT,
        location: {
          latitude: -33.8688,
          longitude: 151.2093,
          timezone: "Australia/Sydney",
        },
      },
    ],
    [
      "events",
      {
        operation: "events",
        request: {
          window: {
            start: INSTANT,
            end: "2026-01-01T06:00:00.000Z",
          },
          limit: 10,
        },
      },
    ],
    [
      "saturn-return",
      {
        operation: "saturn-return",
        birthInstant: BIRTH,
        asOf: INSTANT,
        searchWindow: {
          start: "2025-12-30T00:00:00.000Z",
          end: "2026-01-03T00:00:00.000Z",
        },
        orb: 1,
      },
    ],
  ])("returns a canonical %s envelope", async (operation, body) => {
    const handlers = createAstroRouteHandlers(() => fixtureProvider());
    const response = await post(handlers, body);
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(json).toMatchObject({ ok: true, operation });
    expect(json.value.metadata.provenance.quality).toBe("fixture");
  });

  it("redacts invalid requests and provider exceptions", async () => {
    const invalid = await post(
      createAstroRouteHandlers(() => fixtureProvider()),
      { operation: "whole-sign", latitude: "secret-coordinate" },
    );
    expect(invalid.status).toBe(400);
    expect(JSON.stringify(await invalid.json())).not.toContain(
      "secret-coordinate",
    );

    const throwingResolver = vi.fn(() => {
      throw new Error("private adapter path and credential");
    });
    const handlers = createAstroRouteHandlers(throwingResolver);
    const response = await handlers.GET();
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain(
      "private adapter path",
    );
  });
});
