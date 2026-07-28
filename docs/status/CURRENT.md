# Current status

## Phase 1 — Foundation

- State: Passed locally on 11 July 2026; committed as `c33a1da`
- Branch: `codex/foundation-public-v1`
- Verified: Notion delivery hub, required task views, decision log, repo/toolchain/current-failure audit, controlled reset, pinned toolchain, governance, and CI/security configuration
- Clean gate: `npm run clean && npm ci && npm run verify && npm run test:e2e && npm run audit:dependencies && git diff --check` exited 0
- Test evidence: 3 foundation boundary tests and 2 Playwright smoke tests across desktop/mobile Chrome passed; the production Next build completed without config-root warnings
- Security evidence: checksum-verified Gitleaks 8.30.1 scanned all 7 commits with no leaks; CodeQL and Dependabot are configured for GitHub
- Blockers: none for the foundation gate
- Residual risk: the full development-tool audit still reports minimatch/brace-expansion advisories in ESLint's transitive graph; the production dependency audit is clean after the Next 16.2.12, PostCSS 8.5.23, and Sharp 0.35.3 pin/override updates
- External hold: production promotion, package publication, and any Swiss asset distribution still require explicit owner approval; signed terms are confirmed

## Wave A — Contracts and reference protocol

- State: Passed locally on 11 July 2026; committed as `abfb745`
- Delivered: private `@sukara/astro-schema`, strict Zod runtime contracts, explicit exports, `EphemerisProvider` port, reference-fixture acquisition protocol, and adversarial review/disposition
- Evidence: 13 tests passed; full `npm run verify`, high-severity dependency audit, built-package import, package dry-run inspection, and `git diff --check` exited 0
- Closed gate: the owner confirmed Mirror Mindset's Human Design work is correct and verified; the transit-only mapping records its exact source commit and boundary evidence
- Residual risk: deterministic search/phase/return/Whole Sign algorithms and reference goldens are Wave B implementation gates, not inferred as complete from schema validity

## Wave B — Deterministic computation

- State: Provider-neutral implementation passed locally on 11 July 2026; committed as `2b1f9c5`
- Delivered: private `@sukara/astro-engine` current sky, Moon phase, five tight aspects/phase, bounded major-event search, Whole Sign, Saturn-return windows/passes/status, typed provider failure closure, and semantic IDs
- Human Design: private `@sukara/human-design` implemented from owner-verified Mirror wheel evidence with frozen source provenance and exhaustive 64-gate/384-line boundaries; no interpretation/bodygraph scope
- Evidence: 68 tests passed; full `npm run verify`, high-severity dependency audit, built-package imports, package dry-run inspections, forbidden-boundary scan, and independent corrected re-review passed
- Correctness review: original Saturn opposition, narrow-window contract, provider exception, event residual, station endpoint, and identity findings are closed or narrowed by explicit physical-provider contracts
- Closed by activation slice: native Swiss flags/fallback closure, Ascendant/MC/Whole Sign goldens, and exact event/Saturn timing are now validated against the pinned licensed corpus

## Wave C — Formatters, smoke CLI, and PWA

- State: Locally accepted on 11 July 2026; independent re-review cleared all P0/P1/P2 findings
- Delivered: private `@sukara/astro-formatters`, private bounded dev smoke CLI, and a responsive installable no-account PWA for current sky, bounded events, Saturn-return session inputs, Human Design transit gates/lines, location, and copy/export
- Contract closure: the web transport and fixture are canonical Zod objects, route and client validate runtime data, and copy/export delegates to the shared deterministic formatters
- Privacy/offline: personal inputs stay in React memory, API responses are `no-store`, the shell-only service worker excludes `/api/**`, stale/fixture/offline states are explicit, and provider absence fails closed with HTTP 503
- Evidence: 73 unit/contract tests and 8 desktop/mobile Playwright tests passed; clean typecheck, lint, production build, package dry-runs, dev CLI smoke, and high-severity dependency audit passed
- Performance observation: all emitted JS/CSS chunks total 262,716 bytes gzip across framework and routes; route-specific budget attribution remains a Wave D release review item
- Residual risk: the PWA remains provider-disabled unless `ASTRO_ENGINE_PROVIDER=swisseph` is explicitly configured with the manifest-verified server data
- External hold: production promotion, package publication, and any Swiss asset distribution remain blocked pending explicit owner approval

## Wave D — Integration and release readiness

- State: Locally accepted on 12 July 2026; independent security, performance, and release reviews report no open local P0/P1 findings
- Delivered: injectable server-only provider composition for current sky, bounded events, Whole Sign, Saturn return, and Human Design; native `sweph@2.10.3-7` adapter; pinned manifest acquisition; fail-closed Moshier detection; official `swetest` golden validation; server canonical formatting; response security policy; narrow offline shell cache; package and performance gates
- Evidence: 86 unit/contract/server tests passed; licensed golden validation matched official `swetest` 2.10.03 for positions, speeds, Whole Sign angles, event timing, and Saturn-return windows; clean typecheck, lint, production build, package dry-runs, and diff checks passed
- Performance: final production route measured 145,054 transferred JavaScript bytes and 150,670 bytes gzip by the conservative checked-in CI gate, below the 180 KiB budget; profiled mobile LCP p95 was 588 ms; maximum-window provider-neutral computation p95 stayed below 121 ms
- Security: no restricted Swiss assets, adapter code, secrets, or direct-source boundary violations found; no open local P0/P1; two moderate Next-bundled PostCSS advisories remain accepted pending a compatible upstream fix
- Local disposition: Foundation + Public V1 is technically ready with a protected private-provider preview path; public packages remain provider-neutral and contain no Swiss material
- External release blocks: private-provider latency qualification, hosted CI/CodeQL/Gitleaks results, production promotion, and public package publication. Owner confirms signed Swiss terms; the contract remains private and is not committed here.

## Location lookup update — 28 July 2026

- Added a bundled top-500 major-city lookup derived from `city-timezones` 1.3.4. City selection resolves locally to canonical coordinates and IANA timezone; browser geolocation and manual coordinates remain available for places outside the dataset.
- Google Places was not added: V1 does not need exact-address geocoding, and a live Places integration would add API-key handling, billing, third-party availability, and Google Maps Platform data-use constraints.
- Targeted evidence: city-selection Playwright coverage, privacy documentation, bundle/performance gate, full verification, and no network request for lookup resolution.

## Deployment configuration — 12 July 2026

- Vercel project `astro-engine` (`prj_1coCbTdVD6VgJ7CzvzumjSGpYeyx`) now uses Root Directory `apps/web` with the Next.js preset.
- The project uses a Turbo-filtered workspace build (`@sukara/astro-web`) and no longer relies on a root-level `.next` copy workaround.
- Preview deployment remains SSO-protected. Provider-enabled builds acquire only the two manifest-verified files at build time and trace them server-side; browser bundles remain Swiss-free.
- Verification of the provider-enabled project settings requires a successful preview deployment from the linked repository; production promotion remains an explicit owner action.

## Public V1 refinements — 29 July 2026

- State: Implementation complete locally on `codex/public-v1-refinements`; commit pending final diff review.
- Delivered: presentation-only event filtering/grouping with two-date home preview and full `/events`; dedicated `/saturn-return` with supported-city/date inputs, optional local-noon approximation, bounded `asOf -2/+32` search, readable windows, exact passes, and per-pass copy; one reusable `Copy chart for AI` action through the existing no-store formatter transport; nearest-arcminute carry/wrap formatting; route metadata, structured data, sitemap, robots, and `llms.txt`.
- Privacy/boundaries: canonical engine/provider/schema results remain unchanged; event/pass charts calculate only after explicit copy; birth input remains client-memory-only; no new public computation API or MCP route was added; public package exports remain deliberate and provider-neutral.
- Evidence: `npm run verify` passed; 97 unit/contract tests (94 passed, 3 existing skips); 18 Playwright tests passed across desktop and mobile projects, including explicit 390px coverage; `npm run audit:dependencies`, `npm run performance:web`, four canonical package dry-run inspections, and `git diff --check` passed.
- Provider blocker: `npm run validate:swiss` was attempted and failed closed with `ENOENT` because restricted `apps/web/.private/ephemeris/sepl_18.se1` is not present in this isolated checkout. No Swiss data or fallback was added; provider-enabled scientific validation remains an environment/release gate.
- Residual risk: hosted CI/security evidence, provider-enabled preview latency/Swiss validation, production promotion, package publication, push, PR creation, and any public Swiss asset distribution remain external owner-gated actions.
