# Wave A contract review

- Review class: T2 / high risk
- Scope: Public V1 canonical schema, provider port, and deterministic output contracts
- Evidence reviewed: [canonical Notion source brief](https://app.notion.com/p/3994ba857af78071a489ec67b3db5398) (fetched 11 July 2026), repository contracts/governance/test strategy, and the Phase 1 foundation at `c33a1da`
- Decision: **not contract-ready until every P0 item below is resolved in executable schemas and tests**

The foundation has the correct dependency and licence boundaries. It does not yet define enough astronomy semantics to make independently implemented providers, domain functions, formatters, and consumers interoperable. A field name plus a TypeScript type is not a contract: every quantity needs a unit, frame, range, reference instant, boundary rule, ordering rule, and failure behavior.

## P0 — blocking contract findings

### P0.1 Coordinate, unit, body, and time semantics are not yet locked

The provider contract must not admit multiple reasonable meanings for the same number.

Acceptance criteria:

- Define one canonical UTC instant representation: RFC 3339/ISO 8601 with a required `Z`, millisecond policy stated, leap-second policy stated, and lexical variants normalized or rejected. A local datetime is never accepted without an IANA timezone.
- Define latitude as finite decimal degrees in `[-90, 90]` and longitude as finite east-positive decimal degrees in a single canonical interval (recommended `[-180, 180)`). Reject `NaN`, infinities, and negative zero if serialization identity could differ.
- Define ecliptic longitude as finite tropical degrees in `[0, 360)`; `360` is normalized to `0` at an explicit boundary, never stored. Define latitude and distance if exposed, or omit them from V1 rather than leaving their frame/unit implicit.
- Define longitude speed in degrees per UTC day and the precise retrograde rule. If V1 exposes only a boolean, `retrograde = longitudeSpeed < 0`; do not invent an undocumented station threshold.
- Lock the V1 celestial-body enum and ordering. “Planetary positions” is ambiguous about Earth, lunar nodes, Chiron, and points; unsupported bodies must fail validation rather than silently disappear.
- State coordinate origin/frame and provider assumptions: geocentric vs topocentric, ecliptic/equinox of date vs J2000, apparent vs true position, tropical zero point, time scale used internally, and supported date range.
- Golden fixtures assert units, frame, exact instant, provider/data version, tolerance, and at least the `0/360` longitude boundary.

### P0.2 Determinism is contradicted by unconstrained generation metadata and ordering

The same semantic request cannot produce byte-different canonical output because wall-clock time, object iteration, provider ordering, or floating noise changed.

Acceptance criteria:

- Distinguish the observation/calculation instant from processing time. `generatedAt` is either supplied as a deterministic input, excluded from the canonical deterministic object, or explicitly documented as non-deterministic envelope metadata.
- Define total ordering for every collection. Recommended: positions by canonical body rank; aspects by exactness/orb then canonical body pair; events by exact UTC instant, event-kind rank, body ranks, then ID.
- IDs are versioned, reproducible semantic IDs derived from normalized identity inputs, never random UUIDs and never derived from `generatedAt`, provider version, display text, array index, or unrounded floating serialization.
- The contract states which changes create a new identity (for example exact instant or event kind) and which only change provenance. Collision and duplicate suppression behavior are tested.
- Canonical JSON rejects `undefined`, non-finite numbers, and locale-sensitive formatting, and has a documented stable key/array policy for snapshots and copy/export.
- A fixture provider returning reversed arrays and numerically equivalent normalized values produces identical canonical domain output and IDs.

### P0.3 Provenance, validity, staleness, and cache semantics are incomplete

Without a precise validity envelope, the PWA cannot truthfully label current, stale, or offline data.

Acceptance criteria:

- Every top-level canonical result includes schema/contract version, calculation instant, zodiac, coordinate frame, provider identifier, provider version, ephemeris/data version or an explicit `unknown`, and a validity interval.
- Validity uses a half-open UTC interval `[validFrom, validUntil)` with `validFrom < validUntil`. Staleness is evaluated against an explicit `asOf`, not locale time or an implicit `Date.now()` inside the domain.
- Provenance differentiates production provider output from deterministic test fixtures; fixture provenance cannot be represented as production-quality Swiss output.
- Provider and domain responses are immutable values. Consumers may add transport/cache metadata in an outer envelope but may not rewrite canonical provenance.
- Offline rendering shows the calculation instant and stale state. It never relabels cached coordinates as “current.” Service-worker caching excludes session-only birth requests and outputs.

### P0.4 Aspect geometry and phase are under-specified

“Tight,” “orb,” and “applying/separating” can all be implemented incompatibly while appearing correct.

Acceptance criteria:

- Lock V1 aspects to conjunction `0°`, sextile `60°`, square `90°`, trine `120°`, and opposition `180°`; lock one default maximum orb per aspect or a versioned configuration contract. “Tight” is a number, not prose.
- Define orb as the absolute shortest angular deviation from the target angle, in degrees, within a stated epsilon/tolerance. Define inclusive/exclusive maximum-orb behavior.
- Define phase from the signed residual to the selected exact-aspect branch and its relative angular velocity, including wraparound at `0/360`; `applying` means absolute residual is decreasing. Do not infer phase from two instantaneous absolute longitudes alone. Document behavior when relative speed is zero or unavailable.
- If `exact` is a phase value, define its numerical/time tolerance and deterministic tie behavior. Otherwise use only `applying | separating` plus `orb = 0` within the declared tolerance.
- Canonicalize unordered body pairs by body rank. Do not emit both A–B and B–A.
- Boundary/property tests cover wraparound, all five aspect angles, exactness, max-orb equality, relative-speed sign reversal, and stationary/indeterminate phase.

### P0.5 Upcoming-event searches lack hard bounds and edge semantics

An arbitrary “next N days” search risks missed events, duplicate events, runaway computation, and disagreement at window boundaries.

Acceptance criteria:

- Request schema uses a half-open UTC interval `[start, end)`, enforces `start < end`, and locks a hard V1 maximum duration and result limit. Limit exhaustion is distinguishable from search failure.
- Define “major event” as a closed V1 enum/taxonomy and exact inclusion criteria. Do not use significance prose as an algorithm.
- Define scan step, bracketing, refinement tolerance, iteration ceiling, duplicate suppression, and abort behavior at the engine contract level or in a versioned algorithm contract.
- Events exactly at `start` are included; events exactly at `end` are excluded. Adjacent windows concatenate without loss or duplication.
- Results state whether they are complete for the requested window. Never return a silently partial success after provider/refinement failure.
- Tests cover empty windows, maximum window/limit, adjacent windows, retrograde multi-crossings, an event on each boundary, refinement exhaustion, and deterministic ordering.

### P0.6 Whole Sign semantics and local-context responsibilities are not explicit

Timezone and coordinates do not change global planetary longitude. Whole Sign placement requires a valid local ascendant, not merely a timezone label.

Acceptance criteria:

- Separate global positions from local context in schema and computation. Localisation never causes an independent recomputation of the global event object.
- Define the provider capability needed to obtain the ascendant/angles for a UTC instant and location, or explicitly define another validated source. The public domain must not calculate against undocumented provider-specific angle output.
- Whole Sign house 1 begins at `0°` of the tropical sign containing the ascendant; subsequent cusps advance by exact `30°` sign boundaries. A body on a cusp follows one explicit half-open boundary rule.
- House numbers are integers `1..12`; cusp longitudes are `[0, 360)`; sign and house ordering are canonical.
- IANA timezone resolves a local civil input to UTC, including DST gap/fold disambiguation. After conversion, timezone does not alter astronomical positions.
- Unknown birth time cannot produce natal houses or angles. Omit the local-house result or return a typed requirement error; never substitute noon or `0°`.
- Fixtures cover ascendant at a sign boundary, body at a house cusp, longitude wrap, northern/southern locations, DST gap/fold, and unknown birth time.

### P0.7 Saturn-return windows, passes, and status can currently disagree

A return is not one date. Retrograde motion can create multiple exact passes within one active window.

Acceptance criteria:

- Define a return as transiting Saturn conjunct natal tropical Saturn longitude using a locked, reported orb. Natal Saturn input is a validated canonical position at an explicit birth instant.
- Define an active window as a maximal continuous half-open interval inside the orb, with deterministic entry/exit refinement and behavior when the supported search range begins or ends inside the orb.
- Define a pass as an exact longitude crossing, with exact UTC instant, direction (`direct | retrograde`, plus an explicit stationary/tangent policy), sequence number, and containing window ID.
- Define status relative to explicit `asOf`: `upcoming` before window entry, `active` inside `[start, end)`, and `complete` at/after window end. If multiple lifecycle cycles are returned, state which window the status describes.
- Lock search horizon/age policy and define typed outcomes for no return in range, an incomplete edge window, refinement failure, and unsupported provider range.
- Tests cover one-pass and three-pass returns, station/tangent behavior, exact entry/end boundaries, `0/360` natal longitude, active between passes, completed window, and independently sourced golden dates.

### P0.8 Human Design gate/line mapping needs a versioned authoritative boundary table

A mathematically tidy `360 / 64` calculation is still wrong if the wheel order or anchor is wrong.

Acceptance criteria:

- Commit a versioned 64-gate tropical wheel sequence and an explicit zodiac anchor/orientation, backed by a documented independent reference. Do not infer gate number from ordinal longitude alone.
- Establish that the project may reproduce the factual mapping and terminology used. Do not copy proprietary Human Design artwork, prose, software tables, or branded bodygraph assets into public code or fixtures.
- Normalize input to `[0, 360)`. Define each gate and each of its six lines as half-open intervals, including exact-boundary ownership and `360 → 0` behavior.
- Output gate integer `1..64`, line integer `1..6`, normalized degree within gate/line if exposed, mapping version, source position identity, and provenance.
- Lock which V1 transiting bodies receive gate/line mappings. Human Design output is a projection of canonical positions, not a second ephemeris computation.
- Exhaustive boundary/property tests cover all 64 gate starts/ends, all 384 line starts/ends, epsilon on both sides, negative/`360+` normalization policy, and complete wheel coverage with no gaps or overlaps.
- No centers, channels, definitions, authority, type, profile, interpretation, or full bodygraph fields enter Public V1.

### P0.9 Failure contracts must be closed, typed, redacted, and consistent

Raw thrown provider errors create unstable consumer behavior and can leak inputs or implementation details.

Acceptance criteria:

- Choose one public failure model for async operations (recommended discriminated result or a documented typed-error boundary) and use stable codes such as invalid input, unsupported range/capability, provider unavailable, invalid provider output, search/refinement exhausted, aborted, and internal failure.
- Every provider response is runtime-validated before domain use. Missing bodies, duplicates, invalid order-independent values, non-finite numbers, out-of-range quantities, and inconsistent instant/provenance fail closed.
- Public errors contain stable code, safe message, retryability, and optional field path; they never expose stack traces, raw provider messages, licence paths, credentials, birth values, or coordinates.
- Abort/cancellation is explicit and cannot return a partial canonical success.
- Contract tests pass malformed and adversarial provider outputs through every boundary and assert stable redacted errors.

### P0.10 Privacy and commercial-licence boundaries require executable contract checks

The Notion source briefly suggests local browser storage, but the approved V1 contract supersedes it: birth inputs are session-only and never persisted.

Acceptance criteria:

- Birth date/time, timezone, latitude/longitude, natal positions derived from them, and Saturn-return request/results are classified as session-only personal data.
- No birth data appears in URLs, local/session storage, IndexedDB, Cache API, service-worker caches, analytics, logs, error reports, hydration payloads, or static build artifacts. “Session-only” means in-memory state cleared on refresh/tab close, not `sessionStorage`.
- Domain and schema packages have no logging, analytics, storage, Next, React, Swiss/WASM, or network dependencies.
- Public package contents and browser bundles contain no Swiss source, data, binaries, adapter code, licence material, private registry URLs, or credentials. Provider identifiers/provenance do not imply distribution rights.
- Golden fixtures contain only the minimum numerical reference outputs legally approved for repository use, with no copied Swiss data files or proprietary source. Fixture publication remains subject to the external licence review.
- Automated privacy, dependency-boundary, secret-scan, package-content, and browser-bundle assertions gate release.

## P1 — required before Wave B integration

### P1.1 Canonical object composition and versioning

- Define top-level result schemas rather than allowing consumers to assemble ad hoc intersections.
- Version schema, algorithm/config, mapping, and provenance independently where their compatibility differs.
- Discriminated unions must be closed and exhaustively handled; unknown future kinds fail clearly at runtime.
- Optional fields must have semantic meaning. Prefer explicit union variants over a large object whose `undefined` fields encode state.
- Canonical object schemas are strict about unknown keys. Normalization occurs at an explicit input boundary; already-canonical schemas validate rather than silently transform identity-bearing values.

### P1.2 Provider capability and batching contract

- Declare capabilities and supported date range explicitly; do not discover support by catching failures.
- A batch request returns one position per requested body at the same instant or fails atomically.
- Provider input/output must be readonly, runtime-validated, abortable, and isolated from provider-specific flags.
- Angle/local-context capability is separate from global positions so a provider cannot silently switch from geocentric to topocentric positions.

### P1.3 Moon-phase contract

- Define phase angle/orientation, illumination formula if exposed, and a closed phase enum with exact half-open boundaries.
- State whether phase is derived only from canonical Sun/Moon longitudes and ensure it does not trigger another provider call.
- Tests cover new, quarters, full, wraparound, and boundary epsilon; published values include units and calculation instant.

### P1.4 Formatter derivation and neutral-language contract

- JSON, Markdown, and prompt-ready text accept canonical validated objects only and perform no ephemeris/domain recomputation.
- All formats preserve calculation instant, units, zodiac/frame, provenance, and stale/validity information.
- Text uses UTC plus an explicitly supplied locale/timezone presentation layer; formatting never changes identity or canonical data.
- Ban interpretive/prescriptive language and undocumented significance claims. “Applying,” “active,” and “retrograde” are permitted only as computed structural facts.
- Snapshot tests cover ordering, escaping, precision/rounding, negative zero, stale data, and every typed result variant.

### P1.5 Precision and rounding policy

- Computation retains provider precision; display rounding is formatter-owned and never fed back into identity, phase, boundary, or search calculations.
- Define comparison tolerances per quantity/algorithm, not one global epsilon.
- Golden tests use tolerances justified by the reference and provider mode; snapshots test presentation precision separately.

### P1.6 Public export discipline

- Each package exports only reviewed named entry points through explicit `exports`; no wildcard, root barrel that accidentally expands API, `/src`, or provider adapter path.
- Zod schemas and inferred TypeScript types come from the same declaration. Public functions have explicit return types.
- Package-consumer tests import only package specifiers from built artifacts and verify no private Swiss/server module is reachable.

## P2 — quality improvements before release readiness

- Publish a compact data dictionary with every field’s unit, range, frame, nullability, identity role, and example.
- Add compatibility fixtures that round-trip canonical JSON across the four public packages.
- Record algorithm/reference citations and fixture provenance in machine-readable metadata where practical.
- Add deterministic fuzz seeds and persist minimized regressions for angular boundaries, DST resolution, and event searches.
- Document stable versus presentation-only fields so downstream builders know what may change without a schema major version.
- Add a neutral-language review checklist for README/examples/PWA copy; sample prompts must carry data context, not an interpretation instruction disguised as infrastructure output.

## Required Wave A exit evidence

Wave A may pass only when:

1. All P0 semantics are represented in executable Zod schemas, exported types/constants, or versioned contract documentation referenced by those schemas.
2. Contract tests demonstrate rejection of malformed inputs/provider outputs and deterministic equality under reordered equivalent provider data.
3. Boundary/property tests cover angular, temporal, Whole Sign, Saturn, and Human Design edges listed above.
4. Independent reference-fixture review records source, frame, instant, tolerance, licence-safe contents, and discrepancies.
5. Public exports and dependency tests prove the Swiss/server-only, privacy, and package-layer boundaries.
6. `npm run verify` passes, this review is dispositioned item-by-item, and unresolved P1/P2 items have an owner and stage before computation integration.

## Integration disposition — 11 July 2026

The primary integrator reviewed the package build and dry-run contents after this adversarial draft. Wave A locks the data and provider semantics; Wave B owns the deterministic algorithms that must satisfy them.

| Finding | Disposition                                                                                                                                                                                                                                                                            |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0.1    | Closed in strict branded primitives, canonical body ranks, fixed frame/version metadata, provider capability/range, and fixture protocol. Canonical UTC rejects leap seconds and non-`Z` offsets.                                                                                      |
| P0.2    | Closed at the contract boundary: no processing timestamp, strict canonical objects, ordered/unique collections, semantic ID shapes, and reordered provider-batch validation. ID generation implementation/property tests remain a Wave B gate.                                         |
| P0.3    | Closed with immutable metadata, half-open validity, explicit provider/data/quality provenance, and production-vs-fixture distinction. PWA stale/offline behavior remains a Wave C gate.                                                                                                |
| P0.4    | Contract closed with five aspect angles, versioned tight orbs, canonical body pairs, orb/phase enums, and boundary rejection. Signed-residual/relative-speed implementation and property tests remain a Wave B gate.                                                                   |
| P0.5    | Contract closed with `[start,end)`, 93-day/500-result limits, completeness/truncation, event taxonomy/IDs/order, scan/refinement ceilings. Search implementation remains a Wave B gate.                                                                                                |
| P0.6    | Contract closed with separate global-position/local-angle provider capabilities, IANA/civil-fold input, exact Whole Sign cusp validation, and canonical placements. DST resolution and house computation remain Wave B gates.                                                          |
| P0.7    | Contract closed with bounded requests, maximal-window/pass shapes, half-open lifecycle status, edge classification, ordered/non-overlapping windows, and pass containment. Search implementation/goldens remain Wave B gates.                                                          |
| P0.8    | Output/version/body scope is locked. The authoritative 64-gate boundary table and IP-safe citation are intentionally a blocking acceptance gate for the Wave B Human Design lane, matching the approved program sequence; no unsourced table is admitted.                              |
| P0.9    | Closed with stable redacted error codes, retryability/path bounds, atomic batch validation, abort signal port, and fail-closed provider-output handling. Domain operations must reuse this model in Wave B.                                                                            |
| P0.10   | Closed for package boundaries: private package, Zod-only runtime dependency, explicit exports, no Swiss/network/logging/storage/UI dependency, session-personal classification, package dry-run inspection, and repository boundary tests. PWA privacy assertions remain Wave C gates. |

P1 formatter requirements are assigned to Wave C. P2 documentation/compatibility/fuzz improvements are assigned to Wave D unless pulled forward by implementation evidence. Wave A exit checks passed: 13 tests, full `npm run verify`, dependency audit high-severity gate, built-package import, package dry-run inspection, and `git diff --check`.

## Scope guard

This review does not authorize or design public MCP/API, accounts, billing, calendar feeds, a public CLI, interpretations, Placidus, sidereal/Vedic astrology, or a full Human Design bodygraph. It also does not authorize public deployment, package publication, or distribution of Swiss Ephemeris materials.
