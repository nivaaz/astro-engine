# Current status

## Phase 1 — Foundation

- State: Passed locally on 11 July 2026; committed as `c33a1da`
- Branch: `codex/foundation-public-v1`
- Verified: Notion delivery hub, required task views, decision log, repo/toolchain/current-failure audit, controlled reset, pinned toolchain, governance, and CI/security configuration
- Clean gate: `npm run clean && npm ci && npm run verify && npm run test:e2e && npm run audit:dependencies && git diff --check` exited 0
- Test evidence: 3 foundation boundary tests and 2 Playwright smoke tests across desktop/mobile Chrome passed; the production Next build completed without config-root warnings
- Security evidence: checksum-verified Gitleaks 8.30.1 scanned all 7 commits with no leaks; CodeQL and Dependabot are configured for GitHub
- Blockers: none for the foundation gate
- Residual risk: npm reports 2 moderate findings for PostCSS bundled by Next 16.2.10; no non-breaking patched Next release is available, while the configured high-severity audit gate passes
- External hold: public deployment/package publication/Swiss distribution pending signed terms and explicit approval

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
- External hold: production astronomical accuracy, Swiss fallback/flag behavior, Ascendant/MC/Whole Sign goldens, and exact event/Saturn timing remain unverified until the approved private adapter and licensed golden corpus are available

## Wave C — Formatters, smoke CLI, and PWA

- State: Locally accepted on 11 July 2026; independent re-review cleared all P0/P1/P2 findings
- Delivered: private `@sukara/astro-formatters`, private bounded dev smoke CLI, and a responsive installable no-account PWA for current sky, bounded events, Saturn-return session inputs, Human Design transit gates/lines, location, and copy/export
- Contract closure: the web transport and fixture are canonical Zod objects, route and client validate runtime data, and copy/export delegates to the shared deterministic formatters
- Privacy/offline: personal inputs stay in React memory, API responses are `no-store`, the shell-only service worker excludes `/api/**`, stale/fixture/offline states are explicit, and provider absence fails closed with HTTP 503
- Evidence: 73 unit/contract tests and 8 desktop/mobile Playwright tests passed; clean typecheck, lint, production build, package dry-runs, dev CLI smoke, and high-severity dependency audit passed
- Performance observation: all emitted JS/CSS chunks total 262,716 bytes gzip across framework and routes; route-specific budget attribution remains a Wave D release review item
- Residual risk: the PWA cannot produce live astronomical or personal results until the licensed private provider is configured; no production data is estimated or substituted
- External hold: signed Swiss terms, private adapter/goldens, public deployment, and package publication remain blocked pending owner approval

## Wave D — Integration and release readiness

- State: Locally accepted on 12 July 2026; independent security, performance, and release reviews report no open local P0/P1 findings
- Delivered: injectable server-only provider composition for current sky, bounded events, Whole Sign, Saturn return, and Human Design; production fail-closed resolver; executable labelled fixture flows; server canonical formatting; response security policy; narrow offline shell cache; package and performance gates
- Evidence: 80 unit/contract/server tests and 10 desktop/mobile Playwright tests passed; clean install, full verify/build, high-severity dependency audit, package dry-runs, CLI smoke, and diff checks passed
- Performance: final production route measured 145,054 transferred JavaScript bytes and 150,670 bytes gzip by the conservative checked-in CI gate, below the 180 KiB budget; profiled mobile LCP p95 was 588 ms; maximum-window provider-neutral computation p95 stayed below 121 ms
- Security: no restricted Swiss assets, adapter code, secrets, or direct-source boundary violations found; no open local P0/P1; two moderate Next-bundled PostCSS advisories remain accepted pending a compatible upstream fix
- Local disposition: Foundation + Public V1 is technically ready in the provider-neutral sense; synthetic fixtures prove deterministic contracts and complete product flows, not scientific production accuracy
- External release blocks: authorized private adapter and secrets, licensed golden-fixture validation, private-provider latency qualification, hosted CI/CodeQL/Gitleaks results, and explicit owner approval for deployment/publication. Owner reports signed Swiss terms; the contract remains private and is not committed here.

## Deployment configuration — 12 July 2026

- Vercel project `astro-engine` (`prj_1coCbTdVD6VgJ7CzvzumjSGpYeyx`) now uses Root Directory `apps/web` with the Next.js preset.
- The project uses a Turbo-filtered workspace build (`@sukara/astro-web`) and no longer relies on a root-level `.next` copy workaround.
- Preview deployment remains SSO-protected and provider-neutral; no Swiss assets or secrets are configured.
- Verification of the new project settings requires a successful preview deployment from the linked repository; production promotion remains an explicit owner action.
