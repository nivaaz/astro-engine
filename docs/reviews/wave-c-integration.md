# Wave C integration review

- Review class: T2 independent review
- Scope: formatters, private dev smoke CLI, and no-account PWA
- Snapshot: Wave C worktree before integration commit, 2026-07-11 AEST
- Decision: **Wave C locally accepted; ready for Wave D integration subject to the explicit external release gates**

## Verified strengths

- `@sukara/astro-formatters` validates unknown input against the canonical Zod schemas before rendering and produces JSON, Markdown, and prompt text without astronomical recomputation (`packages/astro-formatters/src/document.ts:31-46`). Its focused test passed locally: `npm run test -- --run packages/astro-formatters/src/__tests__/formatters.test.ts` (5/5).
- JSON output recursively sorts object keys, preserves canonical array order, normalizes negative zero, and makes freshness explicit (`packages/astro-formatters/src/json.ts:14-38`).
- Formatter prose is factual and neutral. The Human Design output is gates/lines only; Saturn output is windows/passes/status only. No interpretation language was found.
- The dev CLI is private, bounded to 1 MiB input, performs no calculation or network access, and consumes only `@sukara/astro-formatters` through declared exports (`apps/dev-cli/src/index.ts:1-87`).
- The web provider-unavailable response is fail-closed, `503`, and `no-store`; fixture mode is forbidden in production and explicitly labeled (`apps/web/src/app/api/sky/route.ts:5-15`). No Swiss source, data, binary, WASM, secret, or direct Swiss import was found in the reviewed surfaces.
- Birth fields presently live only in React state. No `localStorage`, `sessionStorage`, IndexedDB, URL serialization, request body, analytics call, or logging of birth inputs was found (`apps/web/src/app/page.tsx:41-49,153-154`).
- The page has explicit fixture/stale/offline/provider-unavailable language, visible focus styles, semantic labels/headings, reduced-motion handling, and mobile breakpoints.

## Findings

### P0 — The PWA bypasses the canonical object and formatter contracts

The web app defines `SkyPayload` independently in the client and repeats it as `SkyTransportResponse`; neither is a canonical schema object (`apps/web/src/app/page.tsx:5-16`, `apps/web/src/lib/sky-transport.ts:1-15`). The API fixture returns this projection directly (`apps/web/src/app/api/sky/route.ts:7-14`). The client then casts untrusted JSON rather than runtime-validating it (`apps/web/src/app/page.tsx:57-66`) and hand-writes plain, Markdown, and JSON exports (`apps/web/src/app/page.tsx:20-38,84-89`) instead of using `@sukara/astro-formatters`.

This creates a second truth with renamed and omitted fields: `degree` replaces canonical longitude/sign-degree semantics; event identity, significance, tolerance, completeness, canonical metadata, mapping version, source longitude, provenance, and freshness contracts are absent. It violates the canonical-event, protected formatter, runtime-boundary, and “all formatters derive from canonical objects” requirements. A UI projection is acceptable only after canonical parsing and must not become the transport/export contract.

Acceptance tests:

1. The route returns a discriminated, runtime-validated envelope containing canonical schema objects (or a typed canonical error), with fixture/production provenance intact.
2. A malformed, partial, wrong-instant, or unknown-field route payload fails closed and renders unavailable; no values render from a TypeScript cast.
3. Web JSON/Markdown/plain copy output equals `formatJson`, `formatMarkdown`, and `formatPromptText` for the exact canonical object supplied to the UI.
4. A boundary test fails if `apps/web` defines another planetary/event/HD result shape or serializes astronomical facts outside the formatter package.

### P1 — Public V1 flows are display-only and do not yet satisfy their contracts

Location input only changes event display timezone. It does not request or render a canonical Whole Sign chart, while the UI declares “Local context ready” for any finite numbers and any non-empty timezone (`apps/web/src/app/page.tsx:79-82,130-139,147-149`). Saturn return never submits or renders a canonical result; the button remains a provider placeholder (`apps/web/src/app/page.tsx:152-155`). Human Design displays a reduced handwritten fixture without canonical source longitude, mapping version, or provenance (`apps/web/src/lib/fixture-sky.ts`, `apps/web/src/app/page.tsx:156`).

The licensed private provider is an external gate, so fail-closed unavailability is correct today. It is not evidence that the Public V1 flows are technically complete.

Acceptance tests:

1. Valid manual/geolocation input produces and renders canonical Whole Sign data; invalid latitude outside `[-90, 90]`, longitude outside `[-180, 180]`, or invalid IANA timezone is rejected without a render exception.
2. Saturn submission constructs the protected session-personal request, returns typed unavailable/errors safely, and renders canonical windows, passes, orb, status, and provenance when an authorized provider is present.
3. Human Design renders the canonical transit result derived from canonical positions, including mapping version/source longitude in copy/export.
4. Desktop and mobile Playwright cover success fixtures plus provider unavailable, malformed provider output, stale, offline, geolocation denied, and invalid manual context.

### P1 — Privacy, installability, and offline claims lack acceptance proof

The implementation is currently memory-only, but the required privacy assertions and updated end-to-end flow are absent; `tests/e2e/foundation.spec.ts` still asserts the old foundation shell. The manifest and generated icon exist, but there is no automated installability check or offline navigation proof. The app truthfully says it does not present cached data as current, yet a network-state listener alone does not prove the installable PWA behavior required by scope.

Acceptance tests:

1. A privacy test enters unique birth/location sentinels and proves they never appear in URL/history, storage APIs, caches, console output, analytics, server logs, or unrelated requests; refresh clears them.
2. Closing the birth panel either explicitly clears its state or the copy states accurately that only refresh/tab close clears it.
3. Playwright verifies manifest, a usable icon response, standalone metadata, offline navigation behavior, and an explicit offline/unavailable/stale state that never labels fixture or cached data current.
4. The mobile and desktop critical smoke replaces the obsolete foundation-shell assertion.

### P1 — Manual context validation can crash the rendered event flow

`locationValid` accepts out-of-range coordinates and arbitrary timezone text (`apps/web/src/app/page.tsx:79-81`). That timezone is passed directly to `Intl.DateTimeFormat` during render (`apps/web/src/app/page.tsx:24-26,149`); an invalid zone throws `RangeError`, taking down the event section/page. Birth coordinates receive only non-empty validation.

Acceptance tests:

1. Schema-backed client/server validation enforces coordinate ranges and a supported IANA timezone before calculation or formatting.
2. Typing `999`, `999`, and `Not/AZone` leaves the action disabled, shows field-specific errors, and never throws.
3. Valid negative coordinates, UTC, and representative DST zones render deterministically.

### P2 — Copy interaction does not fail safely or announce its result

`navigator.clipboard.writeText` is awaited without error handling, and the changing status text is not a live region (`apps/web/src/app/page.tsx:84-89,141-142`). Permission denial therefore produces an unhandled rejection and no useful user state.

Acceptance tests:

1. Clipboard success announces the selected canonical format through a polite live region.
2. Clipboard denial produces a visible, announced failure and does not claim success.
3. Copy actions remain disabled for unavailable or invalid data and never fall back to a noncanonical projection.

### P2 — Prompt text permits provenance to inject structural lines

Canonical metadata strings permit newline characters, and prompt text emits them verbatim (`packages/astro-formatters/src/common.ts:25-40`, `packages/astro-formatters/src/prompt-text.ts:84-96`). The existing snapshot demonstrates a provider ID splitting the provenance line (`packages/astro-formatters/src/__tests__/formatters.test.ts:145-166`). This does not alter astronomical data, but it weakens prompt-ready structure and lets provider-controlled metadata masquerade as another fact/instruction line.

Acceptance tests:

1. Prompt text encodes or replaces CR/LF and control characters in all free-form metadata fields while preserving deterministic output.
2. A fixture containing newline, carriage return, delimiter, and instruction-like provenance remains exactly one labeled provenance record.
3. Markdown escaping and JSON round-trip behavior remain unchanged.

## External release gate

The independent scientific release gate remains open. Mirror Mindset Human Design mapping is owner-confirmed as correct and may be reused with its recorded provenance, but Astro Engine still needs its own boundary/property tests at every gate/line transition. Separately, production astronomical claims require the authorized private `EphemerisProvider`, signed commercial Swiss terms, and documented licensed golden fixtures with tolerances/provider/data versions. Until those external conditions and owner approval exist, do not deploy publicly, publish packages, or distribute Swiss source, data, binaries, licence material, or credentials.

## Review disposition

Final re-review on 2026-07-11 accepts Wave C locally. The canonical transport/formatter P0 is resolved: the transport contains canonical schema objects, fixture and client boundaries runtime-validate them, and web copy/export delegates to `@sukara/astro-formatters`. Prompt metadata control characters are normalized deterministically. Latitude, longitude, and IANA timezone readiness use canonical schemas. Birth inputs remain memory-only; tests cover cookies, Web Storage, URL, write requests, Cache Storage API exclusion, and refresh clearing. The runtime-cached shell excludes `/api/`, offline reload presents no cached astronomical result, the icon and service-worker registration are verified, and clipboard failure is caught and announced through a live status region.

Targeted evidence passed:

- `npm run test -- --run packages/astro-formatters/src/__tests__/formatters.test.ts tests/foundation/workspace-boundaries.test.ts` — 9/9 tests.
- `npm run typecheck` — 8/8 tasks.
- `npm run lint` — clean.
- `npm run test:e2e` — 8/8 desktop/mobile tests, including privacy egress, refresh clearing, API cache exclusion, icon/service-worker availability, offline reload truthfulness, invalid local context, and clipboard denial.

Disposition: **ready for Wave D integration** with no open local Wave C P0/P1/P2 findings from this review. The authorized private provider, signed commercial Swiss terms, and licensed Swiss golden fixtures remain explicit external release gates rather than Wave C implementation defects. They still block production astronomical claims, public deployment, and package publication. This review does not approve deployment or publication.
