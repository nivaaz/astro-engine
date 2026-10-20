# Astro Engine agent contract

Astro Engine is open, deterministic symbolic infrastructure. It provides coordinates, context, and structure—never interpretations.

## Read before changing code

1. `docs/contracts/PUBLIC_V1_SCOPE.md`
2. `docs/contracts/PROTECTED_CONTRACTS.md`
3. `docs/architecture/REPO_MAP.md`
4. `docs/testing/TEST_STRATEGY.md`
5. The active plan linked from `docs/plans/README.md`

Load other docs only when the task touches their area.

## Non-negotiable boundaries

- Canonical public packages are `@sukara/astro-schema`, `@sukara/astro-engine`, `@sukara/astro-formatters`, and `@sukara/human-design`.
- Domain code may depend on the `EphemerisProvider` contract, never Swiss/WASM, Next.js, UI, auth, billing, or logging.
- The commercial Swiss adapter is private and server-only. Do not commit or distribute Swiss source, data, binaries, licence material, or registry credentials.
- Astronomical outputs are deterministic. AI may not generate or alter them.
- Birth inputs are session-only. Never persist or log them.
- Import workspaces through declared package exports. No direct `/src` imports and no wildcard exports.
- Public deployment and package publication require explicit owner approval and confirmed signed Swiss terms.

## Work protocol

- Classify the task and risk using `docs/governance/DELIVERY.md`.
- Use the active plan as the execution contract for medium/high-risk work.
- Protect schema, provider, privacy, provenance, and formatter contracts with tests before changing them.
- Keep changes bounded and use conventional commits.
- Required local gate: `npm run verify`. Run Playwright when user-facing behavior changes.
- Record verified evidence, blockers, and residual risk in `docs/status/CURRENT.md` and the canonical Notion delivery task.

## Product scope

Public V1 is tropical + Whole Sign, current sky, bounded major events, Saturn return, Human Design transit gates/lines, copy/export, and a no-account PWA. MCP/API, accounts, billing, calendar feeds, public CLI, interpretations, Placidus, sidereal/Vedic, and full bodygraph are deferred.
