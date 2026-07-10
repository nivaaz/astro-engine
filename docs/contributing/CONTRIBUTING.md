# Contributing to Astro Engine

Thank you for wanting to build with the sky.

---

## Getting Started

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/astro-engine.git
cd astro-engine

# Install
npm install

# Build all packages
turbo build

# Run tests
turbo test
```

---

## Development Workflow

### 1. Pick an Issue

Check the [Issues](https://github.com/nivaaz/astro-engine/issues) for `good first issue` or `help wanted` labels.

### 2. Create a Branch

```bash
git checkout -b feat/your-feature-name
```

Branch naming:
- `feat/` — new features
- `fix/` — bug fixes
- `docs/` — documentation
- `refactor/` — code restructuring
- `test/` — adding or fixing tests

### 3. Write Tests First

Every change needs tests. We practice test-driven development where possible.

```bash
# Run tests for a specific package
turbo test --filter=astro-events

# Watch mode
turbo test --filter=astro-events -- --watch
```

### 4. Make Your Change

- Keep changes small and focused
- One logical change per commit
- Follow the coding standards in `AGENTS.md`
- Use the canonical types from `astro-schema`

### 5. Commit

Use conventional commits:

```bash
git commit -m "feat(astro-events): add void-of-course detection"
git commit -m "fix(ephemeris): correct Moon speed calculation"
git commit -m "docs: update event taxonomy with cazimi rules"
```

### 6. Submit a PR

- Fill out the PR template
- Link the related issue
- Describe what changed and why
- Include screenshots for UI changes
- Ensure CI passes

---

## Coding Standards

### TypeScript

- Strict mode always
- Explicit return types on public functions
- No `any` — use `unknown` and narrow
- Prefer `readonly` for data objects

### Testing

- Use Vitest
- Test against known ephemeris data (Solar Fire, Astro.com reference tables)
- Snapshot tests for formatter output
- No mocking the ephemeris — use real calculations

### Naming

- Packages: `kebab-case`
- Types: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case.ts`

---

## Architecture Rules

1. **Dependencies flow downward.** No circular imports. No skipping layers.
2. **Schema is sovereign.** All types come from `astro-schema`. Don't create local duplicates.
3. **Compute once.** Planetary calculations happen in the ephemeris layer. Everything else transforms or distributes.
4. **Export everything.** Every data structure should be convertible to JSON, Markdown, ICS, and plain text.

---

## Ephemeris Reference Data

When testing astronomical calculations, compare against:

- [Swiss Ephemeris test data](https://www.astro.com/swisseph/swephae.htm)
- Solar Fire output (reference astrology software)
- Astro.com chart calculations

Known birth data for testing:

| Name | Date | Time | Location | Source |
|------|------|------|----------|--------|
| Project birth | 2026-07-10 | 23:44 AEST | Sydney, Australia | Notion page creation |

---

## Questions?

Open a Discussion on GitHub, or reach out in the community Discord.
