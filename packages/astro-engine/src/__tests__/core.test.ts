import {
  EventSearchRequestSchema,
  PlanetPositionSchema,
  SaturnReturnRequestSchema,
  UtcInstantSchema,
  ZODIAC_SIGN_ORDER,
  type EphemerisProvider,
} from "@sukara/astro-schema";
import { describe, expect, it } from "vitest";
import {
  analyzeAspect,
  calculateCurrentSky,
  calculateMoonPhase,
  calculateSaturnReturn,
  calculateWholeSignChart,
  canonicalizePosition,
  detectTightAspects,
  normalizeDegrees,
  searchUpcomingMajorEvents,
  semanticId,
  signDegree,
  signedAngularDelta,
  zodiacSign,
} from "../index.js";
import {
  deterministicHasher,
  EPOCH,
  fixtureProvider,
  LOCATION,
} from "./fixture-provider.js";

function position(longitude: number, speed: number, body: "sun" | "moon") {
  return PlanetPositionSchema.parse({
    body,
    instant: EPOCH,
    longitude,
    longitudeSpeed: speed,
    sign: zodiacSign(longitude),
    signDegree: signDegree(longitude),
    retrograde: speed < 0,
  });
}

describe("degree and sign boundaries", () => {
  it.each([
    [0, 0],
    [360, 0],
    [-360, 0],
    [-0.25, 359.75],
    [720.5, 0.5],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeDegrees(input)).toBe(expected);
  });

  it("uses canonical half-open zodiac boundaries", () => {
    expect(zodiacSign(0)).toBe("aries");
    expect(zodiacSign(29.999999)).toBe("aries");
    expect(zodiacSign(30)).toBe("taurus");
    expect(zodiacSign(360)).toBe("aries");
    expect(signDegree(359.5)).toBe(29.5);
    expect(signedAngularDelta(359)).toBe(-1);
  });
});

describe("canonical positions, aspects, and Moon phase", () => {
  it("derives sign and retrograde from provider coordinates", () => {
    const value = canonicalizePosition({
      body: "sun",
      instant: EPOCH,
      longitude: 330,
      longitudeSpeed: -0.1,
    });
    expect(value).toMatchObject({
      sign: "pisces",
      signDegree: 0,
      retrograde: true,
    });
  });

  it("classifies applying, exact, separating, and indeterminate phases", () => {
    const sun = position(0, 1, "sun");
    expect(
      analyzeAspect(sun, position(88, 13, "moon"), "square"),
    ).toMatchObject({
      signedResidual: -2,
      phase: "applying",
    });
    expect(analyzeAspect(sun, position(90, 13, "moon"), "square").phase).toBe(
      "exact",
    );
    expect(analyzeAspect(sun, position(92, 13, "moon"), "square").phase).toBe(
      "separating",
    );
    expect(analyzeAspect(sun, position(92, 1, "moon"), "square").phase).toBe(
      "indeterminate",
    );
  });

  it("includes the tight-orb boundary and sorts by orb then body rank", () => {
    const values = [position(0, 1, "sun"), position(87, 13, "moon")];
    expect(detectTightAspects(values)).toHaveLength(1);
    expect(
      detectTightAspects([values[0]!, position(86.999, 13, "moon")]),
    ).toHaveLength(0);
  });

  it.each([
    ["conjunction", 358, 2],
    ["sextile", 58, 62],
    ["square", 88, 92],
    ["trine", 118, 122],
    ["opposition", 178, 182],
  ] as const)(
    "handles both geometric branches of %s",
    (aspect, applyingLongitude, separatingLongitude) => {
      const sun = position(0, 1, "sun");
      expect(
        analyzeAspect(sun, position(applyingLongitude, 13, "moon"), aspect)
          .phase,
      ).toBe("applying");
      expect(
        analyzeAspect(sun, position(separatingLongitude, 13, "moon"), aspect)
          .phase,
      ).toBe("separating");
    },
  );

  it.each([
    [0, "new"],
    [44, "waxing-crescent"],
    [90, "first-quarter"],
    [180, "full"],
    [270, "last-quarter"],
    [359, "new"],
  ] as const)("maps phase angle %s to %s", (angle, phase) => {
    expect(
      calculateMoonPhase([position(0, 1, "sun"), position(angle, 13, "moon")])
        .phase,
    ).toBe(phase);
  });
});

describe("provider-neutral canonical outputs", () => {
  it("chunks provider requests and returns canonical current sky", async () => {
    const result = await calculateCurrentSky(
      fixtureProvider({ maxBodiesPerRequest: 2 }),
      EPOCH,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.positions).toHaveLength(11);
      expect(result.value.metadata.provenance.quality).toBe("fixture");
    }
  });

  it("propagates typed provider failures", async () => {
    const result = await calculateCurrentSky(
      fixtureProvider({ fail: true }),
      EPOCH,
    );
    expect(result).toMatchObject({
      ok: false,
      error: { code: "provider-unavailable", retryable: true },
    });
  });

  it("closes thrown providers and invalid runtime capabilities into typed errors", async () => {
    const throwing: EphemerisProvider = {
      ...fixtureProvider(),
      async getPositions() {
        throw new Error("private provider detail");
      },
    };
    await expect(calculateCurrentSky(throwing, EPOCH)).resolves.toMatchObject({
      ok: false,
      error: { code: "provider-unavailable" },
    });

    const invalid = {
      ...fixtureProvider(),
      capabilities: {
        positions: true,
        angles: true,
        supportedRange: {},
        maxBodiesPerRequest: 0,
      },
    } as unknown as EphemerisProvider;
    await expect(calculateCurrentSky(invalid, EPOCH)).resolves.toMatchObject({
      ok: false,
      error: { code: "invalid-provider-output" },
    });
  });

  it("enforces the provider supported range as half-open", async () => {
    const result = await calculateCurrentSky(
      fixtureProvider(),
      UtcInstantSchema.parse("2200-01-01T00:00:00.000Z"),
    );
    expect(result).toMatchObject({
      ok: false,
      error: { code: "unsupported-range" },
    });
  });

  it("derives Whole Sign cusps and placements from local angles", async () => {
    const result = await calculateWholeSignChart(
      fixtureProvider({ ascendant: 359 }),
      EPOCH,
      LOCATION,
      ["sun", "saturn"],
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.firstHouseSign).toBe("pisces");
      expect(result.value.cusps).toEqual([
        330, 0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300,
      ]);
      expect(result.value.placements).toEqual([
        { body: "sun", house: 2 },
        { body: "saturn", house: 10 },
      ]);
    }
  });

  it.each(ZODIAC_SIGN_ORDER.map((sign, index) => [sign, index] as const))(
    "anchors Whole Sign house one to %s",
    async (sign, index) => {
      const result = await calculateWholeSignChart(
        fixtureProvider({ ascendant: index * 30 + 0.1 }),
        EPOCH,
        LOCATION,
        ["sun"],
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.firstHouseSign).toBe(sign);
        expect(result.value.cusps[0]).toBe(index * 30);
      }
    },
  );
});

describe("semantic identity and bounded searches", () => {
  it("canonicalizes object key order before hashing", async () => {
    const left = await semanticId(
      "evt_v1",
      { b: 2, a: 1 },
      deterministicHasher,
    );
    const right = await semanticId(
      "evt_v1",
      { a: 1, b: 2 },
      deterministicHasher,
    );
    expect(left).toBe(right);
    expect(left).toMatch(/^evt_v1_[a-f0-9]{64}$/);
  });

  it("detects an ingress inside a half-open event window", async () => {
    const provider = fixtureProvider({
      position(body, elapsedDays) {
        if (body === "mercury")
          return { longitude: 29 + elapsedDays * 8, speed: 8 };
        return { longitude: body === "sun" ? 10 : 200, speed: 0 };
      },
    });
    const request = EventSearchRequestSchema.parse({
      window: {
        start: EPOCH,
        end: "2026-01-01T06:00:00.000Z",
      },
      limit: 100,
    });
    const result = await searchUpcomingMajorEvents(provider, request, {
      hasher: deterministicHasher,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.events).toContainEqual(
        expect.objectContaining({
          kind: "ingress",
          body: "mercury",
          sign: "taurus",
          exactAt: "2026-01-01T03:00:00.000Z",
        }),
      );
      expect(
        result.value.events.every(
          ({ exactAt }) => exactAt < request.window.end,
        ),
      ).toBe(true);
    }
  });

  it("emits one station when a sampled endpoint is exactly stationary", async () => {
    const provider = fixtureProvider({
      position(body, elapsedDays) {
        if (body === "mercury") {
          const elapsedHours = elapsedDays * 24;
          const speed = -(elapsedHours - 6) / 24;
          return {
            longitude: 15 - (elapsedHours - 6) ** 2 / 48,
            speed: Object.is(speed, -0) ? 0 : speed,
          };
        }
        return { longitude: body === "sun" ? 10 : 200, speed: 0 };
      },
    });
    const result = await searchUpcomingMajorEvents(
      provider,
      EventSearchRequestSchema.parse({
        window: { start: EPOCH, end: "2026-01-01T12:00:00.000Z" },
        limit: 100,
      }),
      { hasher: deterministicHasher },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(
        result.value.events.filter(
          (event) => event.kind === "station" && event.body === "mercury",
        ),
      ).toEqual([
        expect.objectContaining({
          exactAt: "2026-01-01T06:00:00.000Z",
          direction: "retrograde",
        }),
      ]);
    }
  });

  it.each([
    ["2026-01-02T00:00:00.000Z", "upcoming"],
    ["2026-01-04T00:00:00.000Z", "active"],
    ["2026-01-10T00:00:00.000Z", "complete"],
  ] as const)("derives the Saturn lifecycle as %s", async (asOf, status) => {
    const provider = fixtureProvider({
      position(body, elapsedDays) {
        return body === "saturn"
          ? { longitude: 99 + elapsedDays * 0.2, speed: 0.2 }
          : { longitude: 0, speed: 0 };
      },
    });
    const request = SaturnReturnRequestSchema.parse({
      classification: "session-personal",
      natalSaturnLongitude: 100,
      birthInstant: "1996-01-01T00:00:00.000Z",
      asOf,
      searchWindow: {
        start: EPOCH,
        end: "2026-01-11T00:00:00.000Z",
      },
      orb: 0.5,
    });
    const result = await calculateSaturnReturn(provider, request, {
      hasher: deterministicHasher,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe(status);
      expect(result.value.windows).toHaveLength(1);
      expect(result.value.windows[0]?.interval).toEqual({
        start: "2026-01-03T12:00:00.000Z",
        end: "2026-01-08T12:00:00.000Z",
      });
      expect(result.value.windows[0]?.passes).toEqual([
        expect.objectContaining({
          sequence: 1,
          exactAt: "2026-01-06T00:00:00.000Z",
          direction: "direct",
        }),
      ]);
    }
  });

  it("excludes a Saturn pass at the half-open search end", async () => {
    const provider = fixtureProvider({
      position(body, elapsedDays) {
        return body === "saturn"
          ? { longitude: 99.2 + elapsedDays * 0.2, speed: 0.2 }
          : { longitude: 0, speed: 0 };
      },
    });
    const result = await calculateSaturnReturn(
      provider,
      SaturnReturnRequestSchema.parse({
        classification: "session-personal",
        natalSaturnLongitude: 100,
        birthInstant: "1996-01-01T00:00:00.000Z",
        asOf: "2026-01-04T00:00:00.000Z",
        searchWindow: {
          start: EPOCH,
          end: "2026-01-05T00:00:00.000Z",
        },
        orb: 0.5,
      }),
      { hasher: deterministicHasher },
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.windows[0]?.passes).toHaveLength(0);
  });

  it("classifies a retrograde Saturn pass from provider speed", async () => {
    const provider = fixtureProvider({
      position(body, elapsedDays) {
        return body === "saturn"
          ? { longitude: 100.8 - elapsedDays * 0.2, speed: -0.2 }
          : { longitude: 0, speed: 0 };
      },
    });
    const result = await calculateSaturnReturn(
      provider,
      SaturnReturnRequestSchema.parse({
        classification: "session-personal",
        natalSaturnLongitude: 100,
        birthInstant: "1996-01-01T00:00:00.000Z",
        asOf: "2026-01-04T00:00:00.000Z",
        searchWindow: {
          start: EPOCH,
          end: "2026-01-11T00:00:00.000Z",
        },
        orb: 0.5,
      }),
      { hasher: deterministicHasher },
    );
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.value.windows[0]?.passes[0]?.direction).toBe("retrograde");
  });

  it("does not turn the opposition branch discontinuity into a Saturn return", async () => {
    const provider = fixtureProvider({
      position(body, elapsedDays) {
        return body === "saturn"
          ? { longitude: 279 + elapsedDays * 0.2, speed: 0.2 }
          : { longitude: 0, speed: 0 };
      },
    });
    const result = await calculateSaturnReturn(
      provider,
      SaturnReturnRequestSchema.parse({
        classification: "session-personal",
        natalSaturnLongitude: 100,
        birthInstant: "1996-01-01T00:00:00.000Z",
        asOf: "2026-01-04T00:00:00.000Z",
        searchWindow: { start: EPOCH, end: "2026-01-11T00:00:00.000Z" },
        orb: 0.5,
      }),
      { hasher: deterministicHasher },
    );
    expect(result).toMatchObject({
      ok: true,
      value: { status: "none-in-range", windows: [] },
    });
  });

  it("closes a throwing semantic hasher into a typed event-search failure", async () => {
    const result = await searchUpcomingMajorEvents(
      fixtureProvider({
        position(body, elapsedDays) {
          return body === "mercury"
            ? { longitude: 29 + elapsedDays * 8, speed: 8 }
            : { longitude: body === "sun" ? 10 : 200, speed: 0 };
        },
      }),
      EventSearchRequestSchema.parse({
        window: { start: EPOCH, end: "2026-01-01T06:00:00.000Z" },
        limit: 100,
      }),
      {
        hasher() {
          throw new Error("hasher detail");
        },
      },
    );
    expect(result).toMatchObject({
      ok: false,
      error: { code: "internal-failure" },
    });
  });

  it("propagates provider failure during Saturn search", async () => {
    const result = await calculateSaturnReturn(
      fixtureProvider({ fail: true }),
      SaturnReturnRequestSchema.parse({
        classification: "session-personal",
        natalSaturnLongitude: 100,
        birthInstant: "1996-01-01T00:00:00.000Z",
        asOf: EPOCH,
        searchWindow: {
          start: EPOCH,
          end: "2026-01-02T00:00:00.000Z",
        },
        orb: 2,
      }),
      { hasher: deterministicHasher },
    );
    expect(result).toMatchObject({
      ok: false,
      error: { code: "provider-unavailable" },
    });
  });
});
