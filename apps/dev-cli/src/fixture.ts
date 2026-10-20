export const SMOKE_FIXTURE: unknown = {
  metadata: {
    schemaVersion: "1.0.0",
    algorithmVersion: "dev-smoke-fixture-v1",
    calculatedAt: "2026-07-11T00:00:00.000Z",
    zodiac: "tropical",
    frame: "tropical-geocentric-apparent-ecliptic-of-date-v1",
    validFor: {
      start: "2026-07-11T00:00:00.000Z",
      end: "2026-07-11T00:05:00.000Z",
    },
    provenance: {
      providerId: "dev-smoke-fixture",
      providerVersion: "1.0.0",
      dataVersion: "non-ephemeris-fixture-v1",
      quality: "fixture",
    },
  },
  positions: [
    {
      body: "sun",
      instant: "2026-07-11T00:00:00.000Z",
      longitude: 109,
      longitudeSpeed: 0.95,
      sign: "cancer",
      signDegree: 19,
      retrograde: false,
    },
    {
      body: "moon",
      instant: "2026-07-11T00:00:00.000Z",
      longitude: 42,
      longitudeSpeed: 13.2,
      sign: "taurus",
      signDegree: 12,
      retrograde: false,
    },
  ],
  moonPhase: { phase: "waning-crescent", phaseAngle: 293 },
  aspects: [],
};
