# Astro Engine

**Open infrastructure for building with astrology.**

> Astrology has inspired millions, but building with it has remained unnecessarily difficult. The calculations are fragmented. The tools are expensive. The knowledge locked inside specialist software that was never designed for ordinary people to extend.
>
> AI coding tools are changing that. For the first time, almost anyone can turn an idea into software. We want astrology to be part of that creative shift.

**Build with the sky.**

---

## What This Is

Astro Engine is an open-source astrology computation engine that turns precise celestial events into personalised timelines, calendars, and AI-ready context.

It's not another horoscope app. It's the **plumbing** — clean, reusable, deterministic astrology infrastructure that anyone can build on.

### The Product Flywheel

```
Compute → Structure → Personalise → Distribute
```

1. **Compute** — Accurate planetary data, aspects, stations, ingresses, lunations, event charts
2. **Structure** — Turn the sky into clean, deterministic JSON, Markdown, and prompt-ready context
3. **Personalise** — Overlay events against a natal chart
4. **Distribute** — Send results to web apps, calendars, MCP clients, APIs, and content workflows

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Consumers: Web App (PWA), MCP Server, API, CLI │
├─────────────────────────────────────────────────┤
│  Formatters: JSON · Markdown · ICS · Prompt Text │
├─────────────────────────────────────────────────┤
│  Domain: Events · Aspects · Transits · Natal     │
├─────────────────────────────────────────────────┤
│  Schema: Types · Validators · Constants          │
├─────────────────────────────────────────────────┤
│  Ephemeris: Swiss Ephemeris (sweph-wasm)         │
└─────────────────────────────────────────────────┘
```

The website, calendar feed, MCP server, API, and CLI all consume the same canonical `AstrologyEvent` object. Compute once, distribute many.

---

## Monorepo Structure

```
astro-engine/
├── apps/
│   ├── web/               # Next.js PWA — main consumer app
│   └── docs/              # Documentation site
├── packages/
│   ├── ephemeris/         # Swiss Ephemeris WASM bindings
│   ├── astro-domain/      # Core astrology logic
│   ├── astro-events/      # Event detection & classification
│   ├── astro-schema/      # Shared TypeScript types
│   ├── astro-formatters/  # JSON, Markdown, ICS, prompt-ready output
│   ├── astro-calendar/    # ICS feed generation
│   ├── astro-ui/          # shadcn-based reusable components
│   ├── astro-mcp/         # Model Context Protocol server
│   └── astro-sdk/         # Public SDK for third-party developers
├── services/
│   ├── api/               # REST/GraphQL API
│   ├── scheduler/         # Precompute transits on schedule
│   └── calendar-feed/     # Hosted ICS subscription service
├── specs/                 # Schemas, API contracts, event taxonomy
├── docs/                  # Architecture, contributing, licensing
└── AGENTS.md              # AI agent governance
```

---

## Quick Start

```bash
# Clone
git clone https://github.com/nivaaz/astro-engine.git
cd astro-engine

# Install dependencies
npm install

# Build all packages
turbo build

# Run tests
turbo test

# Start the web app in dev mode
turbo dev --filter=web
```

---

## What You Can Build

With this engine, you can create:

- A personal transit dashboard
- A natal chart calculator
- A transit calendar (ICS subscription)
- An astrology MCP server for ChatGPT/Claude
- A content generation workflow for astrology posts
- A relationship compatibility tool
- A research project on planetary cycles
- Something nobody has imagined yet

---

## The Canonical Event Object

Every module speaks the same schema. Here's a simplified example:

```typescript
interface AstrologyEvent {
  id: string;
  type: "aspect" | "ingress" | "station" | "lunation" | "eclipse";
  stream: "slow_sky" | "lunation" | "planetary" | "daily_moon";
  significance: "daily" | "notable" | "major";
  exactAtUtc: string;
  bodies: Planet[];
  positions: PlanetPosition[];
  aspect?: Aspect;
  sign: ZodiacSign;
  degree: number;
}

// See specs/astrology-event.schema.ts for the full type system
```

---

## Event Taxonomy

Events are classified into four streams to prevent cosmic notification confetti:

| Stream | What | Frequency |
|--------|------|-----------|
| **Slow Sky** | Outer planet aspects, ingresses, stations, eclipses | Weeks–months |
| **Lunations** | New/Full/Quarter Moons, eclipses | ~Monthly |
| **Planetary** | Inner planet aspects, ingresses, cazimi | Daily–weekly |
| **Daily Moon** | Moon ingresses, void-of-course, Moon aspects | Hourly |

See [specs/event-taxonomy.md](specs/event-taxonomy.md) for the full classification system.

---

## Export Formats

Every piece of data is exportable:

- **JSON** — structured, machine-readable
- **Markdown** — human-readable reports
- **ICS** — calendar subscriptions
- **Plain text** — prompt-ready for AI context
- **HTML** — rich display for web components
- **CSV** — spreadsheet-friendly

---

## MCP Integration

Astro Engine exposes an MCP (Model Context Protocol) server, allowing AI assistants to query live astrology data:

```
get_current_sky        → Current planetary positions and aspects
list_upcoming_transits → Next N days of events
get_natal_transits     → Transit hits against a natal chart
format_astrology_context → Prompt-ready sky data
```

---

## Roadmap

### v0.1 — Foundation (current)
- [x] Monorepo scaffolding
- [x] Event schema and taxonomy
- [x] AGENTS.md governance
- [ ] Swiss Ephemeris WASM integration
- [ ] Core aspect detection
- [ ] Event classification engine

### v0.5 — Core Engine
- [ ] Transit computation for any date range
- [ ] Natal chart calculation
- [ ] Transit-to-natal overlay
- [ ] All export formats
- [ ] Location-based event charts

### v1.0 — Public Launch
- [ ] Next.js PWA with transit dashboard
- [ ] ICS calendar subscriptions
- [ ] MCP server (authenticated)
- [ ] Public API with key management
- [ ] Documentation site
- [ ] Swiss Ephemeris licensing resolved

### v1.5 — Personal
- [ ] Saved natal charts
- [ ] Personal transit timeline
- [ ] Filters by planet, orb, significance
- [ ] Email/push notifications

### v2.0 — Platform
- [ ] Developer SDK
- [ ] Skills repository
- [ ] Codex/Claude Code starter templates
- [ ] Community templates and contributions

---

## Pricing Vision

| Tier | Price | Includes |
|------|-------|----------|
| **Free** | $0 | Current sky, 30-day events, 1 location, basic prompt copy |
| **Plus** | $5.99/mo | Saved locations, natal overlay, calendar feed, notifications |
| **Pro** | $12–19/mo | MCP access, API key, multiple charts, JSON export, custom orbs |
| **Self-hosted** | Free (open source) | Run your own infrastructure |

---

## Brand Architecture

```
Sukara Technology (company)
├── Astro Engine (this repo — open computation infrastructure)
├── Mirror Mindset (flagship product, powered by this engine)
└── Future symbolic-computing products
```

**Positioning:** Astro Engine is the neutral, clinical, open infrastructure layer. Mirror Mindset is the warm, transformational product built on top.

---

## Licensing

- **Non-ephemeris packages:** MIT
- **Ephemeris package:** AGPL (Swiss Ephemeris requirement) — **⚠️ licensing decision required before v1.0**
- **See:** [docs/licensing/](docs/licensing/) for the full analysis

---

## Contributing

See [docs/contributing/](docs/contributing/) for guidelines.

**TL;DR:**
1. Fork the repo
2. Create a feature branch
3. Write tests first
4. Submit a PR with a clear description
5. One logical change per PR

---

## The Ethos

Astrology, Human Design, and symbolic systems have always been gatekept when it comes to building. Only now has it become possible for anyone to make their own tools with AI.

We want to give you the power to build with these systems however you imagine.

**You should not be limited to the astrology products somebody else decided to make for you.**

We'll keep building as we work with you.

---

*Created: 10 July 2026, 11:44 PM AEST — Sydney, Australia*
*Project birth chart: 19° Cancer MC, Sun/Mercury conjunct in Cancer 4H, Moon in Sagittarius*
