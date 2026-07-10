# Architecture

## System Overview

Astro Engine is a TypeScript monorepo that computes, structures, and distributes astrology data through multiple channels: web app, MCP server, API, calendar feeds, and CLI.

```
┌──────────────────────────────────────────────────────────────┐
│                       Consumers                               │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │ PWA  │  │ MCP  │  │ API  │  │ CLI  │  │ ICS  │          │
│  └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘          │
│     │         │         │         │         │                │
├─────┼─────────┼─────────┼─────────┼─────────┼────────────────┤
│     └─────────┴────────┬┴─────────┴─────────┘                │
│                        │                                     │
│              ┌─────────▼──────────┐                          │
│              │  astro-formatters   │  JSON · MD · ICS · Text │
│              └─────────┬──────────┘                          │
│                        │                                     │
├────────────────────────┼─────────────────────────────────────┤
│                        │                                     │
│              ┌─────────▼──────────┐                          │
│              │   astro-events      │  Event detection,       │
│              │                     │  classification,        │
│              │                     │  significance scoring   │
│              └─────────┬──────────┘                          │
│                        │                                     │
│              ┌─────────▼──────────┐                          │
│              │   astro-domain      │  Aspects, orbs,         │
│              │                     │  dignities, transit     │
│              │                     │  overlays                │
│              └─────────┬──────────┘                          │
│                        │                                     │
├────────────────────────┼─────────────────────────────────────┤
│                        │                                     │
│  ┌─────────────────────▼───────────────────────────┐        │
│  │              astro-schema                        │        │
│  │  Shared types, validators, constants, enums      │        │
│  └─────────────────────┬───────────────────────────┘        │
│                        │                                     │
│              ┌─────────▼──────────┐                          │
│              │    ephemeris        │  Swiss Ephemeris WASM   │
│              └────────────────────┘                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Raw Computation (Ephemeris)

```
Input: Julian Day + Planet
Output: Longitude, Latitude, Distance, Speed

The ephemeris layer is the ONLY place where raw astronomical
calculation happens. Everything else is transformation.
```

### 2. Aspect Detection (Domain)

```
Input: Two planet positions
Output: Aspect type, orb, phase (applying/exact/separating)

Domain logic determines:
- Which aspects exist between which planets
- Current orb (distance from exact)
- Whether the aspect is applying or separating
- Pass number for multi-pass outer planet aspects
```

### 3. Event Classification (Events)

```
Input: Raw aspect/ingress/station data
Output: AstrologyEvent with stream, significance, ID

Events layer adds:
- Stream classification (slow_sky, lunation, planetary, daily_moon)
- Significance scoring
- Deterministic event ID generation
- Deduplication across computation windows
```

### 4. Localisation (Domain)

```
Input: Global AstrologyEvent + LocationData
Output: LocalizedEvent

Localisation adds:
- Local time conversion
- House placement (if birth/event chart)
- Ascendant and Midheaven for the moment
- Local event chart generation
```

### 5. Formatting (Formatters)

```
Input: AstrologyEvent[] + ExportFormat
Output: String in requested format

Formats: JSON, Markdown, ICS, Plain Text, HTML, CSV

The formatters NEVER modify event data. They only render it.
```

---

## Key Design Decisions

### Global vs Local Events

A planetary conjunction is a global astronomical event. It happens at the same instant worldwide. Location affects:

- Local clock time
- Calendar date (in some cases)
- Ascendant, Midheaven, house cusps
- Local visibility (for astronomical phenomena)

**Architecture consequence:** Compute global events once. Apply localisation as a transform layer.

### Deterministic Event IDs

Event IDs are SHA-256 hashes of:

```
eventType + body1 + body2 + exactAtJulianDay + aspectType + passNumber
```

Same astronomical event → same ID, every time, everywhere. This enables:

- Reliable caching
- Cross-system event references
- Deduplication
- Stable calendar event URLs

### Schema-First Development

`astro-schema` has zero runtime dependencies. It's pure types and constants.

Every other package depends on `astro-schema`. Nothing depends on nothing else's types. This prevents:

- Type drift between packages
- Implicit coupling
- Breaking changes cascading unpredictably

### Ephemeris Isolation

The ephemeris package is isolated for two reasons:

1. **Licensing:** AGPL boundary is clean
2. **Swappability:** Could swap to a different ephemeris backend without touching domain logic

The ephemeris exposes a simple interface:

```typescript
interface Ephemeris {
  getPosition(planet: Planet, julianDay: JulianDay): PlanetPosition;
  getPositions(planets: Planet[], julianDay: JulianDay): PlanetPosition[];
  getJulianDay(date: Date, timezone: IANATimezone): JulianDay;
}
```

---

## Caching Strategy

### Level 1: Ephemeris Cache
- Planet positions for a given Julian Day are immutable
- Cache aggressively (positions don't change once computed)
- Key: `planet:julianDay`

### Level 2: Event Cache
- Event IDs are deterministic
- Cache by date range + event stream
- Invalidate only on schema version change

### Level 3: Location Cache
- City coordinates rarely change
- Geocoding results cached permanently
- Timezone data cached (IANA database updates infrequently)

---

## Security Considerations

- No API keys committed to the repo
- User birth data stored encrypted at rest
- Calendar subscription URLs use unguessable tokens
- MCP authentication via API keys, not OAuth (simpler, self-contained)
- Rate limiting on all public endpoints
- Ephemeris computation is server-side only (prevent tampering)
