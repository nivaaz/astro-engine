# AGENTS.md — Astro Engine

> Open infrastructure for building with astrology.

This file governs how AI agents (Claude Code, Codex, Hermes, Cursor, etc.) should work inside this repository.

---

## Project Identity

- **Name:** Astro Engine
- **Owner:** Sukara Technology
- **Repo:** `nivaaz/astro-engine`
- **Stack:** TypeScript monorepo · Turborepo · Next.js · Tailwind CSS · shadcn/ui
- **Ephemeris:** Swiss Ephemeris (sweph-wasm) — AGPL licensed (see Licensing section)
- **Created:** 10 July 2026, 11:44 PM AEST (Sydney)

---

## Architecture Principles

### 1. Canonical Event Object

Every module consumes and produces the same `AstrologyEvent` type. The website, calendar feed, MCP server, and API all speak the same schema. No module creates its own version of the truth.

### 2. Compute Once, Distribute Many

Planetary calculations happen exactly once. Localisation (timezone, house system, location) is a layer on top, not a re-computation.

### 3. Global Events + Local Context

A planetary conjunction is a global astronomical event. Location changes the local clock time, ascendant, midheaven, and house placement — not the event itself. Model accordingly:

```
GlobalEvent (UTC) → LocalEvent (timezone) → EventChart (location + house system)
```

### 4. Deterministic Output

All computation must be deterministic. Same inputs → same outputs, every time. AI is never involved in generating underlying astronomical data — only in interpretation layers (which are clearly marked as non-deterministic).

### 5. Export Everything

Every piece of data the engine produces should be exportable in at least:
- JSON (structured)
- Markdown (human-readable)
- ICS (calendar)
- Plain text (prompt-ready)

### 6. Layered Architecture

```
┌─────────────────────────────────────────────┐
│  Consumers: Web App, MCP, API, CLI, Calendar │
├─────────────────────────────────────────────┤
│  Formatters: JSON, MD, ICS, Prompt, HTML     │
├─────────────────────────────────────────────┤
│  Domain: Events, Aspects, Transits, Natal    │
├─────────────────────────────────────────────┤
│  Schema: Types, Validators, Constants        │
├─────────────────────────────────────────────┤
│  Ephemeris: sweph-wasm (Swiss Ephemeris)     │
└─────────────────────────────────────────────┘
```

---

## Monorepo Structure

```
astro-engine/
├── AGENTS.md              ← you are here
├── README.md
├── package.json           ← root workspace config
├── turbo.json             ← Turborepo pipeline
├── tsconfig.base.json     ← shared TS config
├── .github/workflows/     ← CI
├── docs/                  ← architecture, contributing, licensing
│   ├── architecture/
│   ├── contributing/
│   └── licensing/
├── specs/                 ← schemas, API contracts, event taxonomy
├── apps/
│   ├── web/               ← Next.js PWA (main consumer app)
│   └── docs/              ← documentation site
├── packages/
│   ├── ephemeris/         ← Swiss Ephemeris WASM bindings
│   ├── astro-domain/      ← core astrology logic (aspects, orbs, dignities)
│   ├── astro-events/      ← event detection, classification, significance
│   ├── astro-schema/      ← shared TypeScript types and validators
│   ├── astro-formatters/  ← JSON, Markdown, ICS, prompt-ready output
│   ├── astro-calendar/    ← ICS feed generation, calendar subscriptions
│   ├── astro-ui/          ← shadcn-based reusable chart & transit components
│   ├── astro-mcp/         ← Model Context Protocol server
│   └── astro-sdk/         ← public SDK for third-party developers
└── services/
    ├── api/               ← REST/GraphQL API service
    ├── scheduler/         ← cron-like service for precomputing transits
    └── calendar-feed/     ← hosted ICS subscription service
```

### Package Dependencies (directional)

```
astro-schema          ← depended on by everything
    ↑
ephemeris             ← depended on by astro-domain
    ↑
astro-domain          ← depended on by astro-events
    ↑
astro-events          ← depended on by formatters, calendar, api, mcp
    ↑
astro-formatters      ← depended on by apps, services, sdk
astro-calendar        ← depended on by services
astro-ui              ← depended on by apps/web
astro-mcp             ← depends on astro-events, astro-formatters
astro-sdk             ← depends on astro-events, astro-formatters, astro-mcp
```

**Rule:** Dependencies flow downward only. No circular imports. No skipping layers.

---

## Coding Standards

### TypeScript

- Strict mode always (`"strict": true`)
- Explicit return types on public functions
- No `any` — use `unknown` and narrow
- Prefer `readonly` and immutability for data objects
- Use branded types for domain primitives (degrees, Julian days, timestamps)

### Naming

- Packages: `kebab-case` (`astro-events`, `astro-schema`)
- Types/Interfaces: `PascalCase` (`AstrologyEvent`, `PlanetPosition`)
- Functions: `camelCase` (`detectTransits`, `formatAsICS`)
- Constants: `UPPER_SNAKE_CASE` (`DEFAULT_ORB`, `SIGNS`)
- Files: `kebab-case.ts` (no barrel files by default — explicit imports)

### Testing

- Every package has a `__tests__/` directory
- Use Vitest for unit and integration tests
- Ephemeris tests compare against known ephemeris tables (Solar Fire, Astro.com)
- Snapshot tests for formatter output
- No mocking the ephemeris — use real calculations with known birth data

### Git

- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- One logical change per commit
- PRs require passing CI + at least one review
- Branch naming: `feat/short-description`, `fix/issue-number-description`

---

## Licensing — ⚠️ DECISION BLOCKER

Swiss Ephemeris uses dual licensing:
1. **AGPL** — free, but requires the entire project to be AGPL-compatible
2. **Professional Licence** — paid, allows proprietary hosting

This decision shapes the entire licensing model. Before public launch, the team must choose:

- **Option A:** AGPL throughout. Strong open-source credibility. Some companies avoid AGPL dependencies.
- **Option B:** Professional Swiss Ephemeris licence. More flexibility for hosted/commercial products.

**Current default:** AGPL. This decision is documented in `docs/licensing/` and must be resolved before v1.0.

The rest of the codebase (non-ephemeris packages) should use **MIT** where possible, with the ephemeris package isolated so licensing boundaries are clear.

---

## Event Taxonomy

Events are classified into four streams:

### 1. Slow Sky
- Outer-planet aspects (Saturn, Uranus, Neptune, Pluto)
- Sign ingresses
- Retrograde/direct stations
- Multi-pass transit sequences
- Eclipses

### 2. Lunations
- New Moons
- Full Moons
- Quarter Moons
- Eclipses (shared with Slow Sky)
- Optional event chart by location

### 3. Planetary Events
- Conjunctions, Oppositions, Squares, Trines, Sextiles
- Cazimi, Combustion
- Planetary ingresses

### 4. Daily Moon
- Moon ingresses
- Void-of-course periods
- Moon aspects (filterable by significance)

---

## Significance Levels

Every event gets a significance classification:

| Level | Description | Example |
|-------|-------------|---------|
| `daily` | Frequent, low-impact | Moon trine Mercury |
| `notable` | Worth mentioning | Venus enters Leo |
| `major` | Rare, high-impact | Saturn conjunct Neptune |

Consumers filter by significance. The UI defaults to `notable` + `major`.

---

## MCP Tool Design

Planned MCP tools (Phase 2):

| Tool | Description |
|------|-------------|
| `get_current_sky` | Current planetary positions and aspects |
| `list_upcoming_transits` | Next N days of events |
| `get_exact_aspect_time` | When a specific aspect becomes exact |
| `get_event_chart` | Chart for a specific moment at a location |
| `get_natal_transits` | Transit hits against a natal chart |
| `compare_transits_to_chart` | Personalised transit overlay |
| `generate_calendar_feed` | ICS feed URL for a chart |
| `format_astrology_context` | Prompt-ready sky data |

---

## What NOT To Do

1. **Don't create package-local types that duplicate `astro-schema`** — extend the shared schema instead
2. **Don't hardcode orbs, house systems, or zodiac types** — use config/constants from `astro-domain`
3. **Don't use AI to generate astronomical data** — compute deterministically, interpret separately
4. **Don't couple the MCP server to a specific AI provider** — MCP is the standard, not a ChatGPT plugin
5. **Don't build native mobile before the PWA proves retention** — PWA first, always
6. **Don't put Human Design or numerology in the astrology packages** — they get sibling packages/orgs later
7. **Don't expose API keys or secrets** — use environment variables, never commit credentials

---

## Contribution Model

This project follows an open-core model:

**Open (MIT or AGPL):**
- Computation interfaces and event schemas
- Aspect detection, event classification
- Formatters, calendar generation
- UI components
- Basic MCP server
- Documentation, skills, starter repos

**Paid/Hosted:**
- Managed computation infrastructure
- Saved charts and private data
- OAuth, calendar feeds, alerts
- MCP authentication and usage limits
- Hosted API with SLA

---

## Quick Reference for Agents

When working in this repo:

1. **Read `specs/`** before implementing any data structure
2. **Check `packages/astro-schema/`** before defining a new type
3. **Run tests** with `turbo test` from the root
4. **Build** with `turbo build` from the root
5. **Lint** with `turbo lint` from the root
6. **Never commit** directly to `main` — use feature branches
7. **Document** any new public API in `docs/`
8. **Validate** ephemeris output against known reference data
