# Wave B independent correctness review

- Review class: T2 / high risk
- Scope: provider-neutral astronomical domain, bounded event search, Whole Sign,
  Saturn return, Human Design source gate, and their tests
- Evidence reviewed: protected contracts, Wave A contract/research review,
  `packages/astro-schema`, current `packages/astro-engine` source and tests, and
  the selective Mirror Mindset reuse audit in the fixture protocol
- Review posture: static independent review. Mirror is implementation evidence,
  never a correctness oracle.
- Decision: **not accepted**. The Human Design lane is correctly blocked, but
  the engine has correctness and failure-closure defects that must be fixed and
  independently rechecked before Wave B can pass.

## Corrected implementation disposition — 11 July 2026

- Re-review evidence: corrected schema/engine/Human Design source, current
  research authorization record, and targeted Vitest execution.
- Targeted command:
  `npm exec vitest run packages/astro-engine/src/__tests__/core.test.ts packages/human-design/src/__tests__/gate-wheel.test.ts`
- Result: **2 files and 38 tests passed** on 11 July 2026.
- Updated decision: **accepted for provider-neutral Wave B integration with
  narrowed contracts**. No code defect from P0 or P1 remains blocking. Real
  astronomical accuracy, private Swiss-adapter behavior, and Whole Sign angle
  correctness remain external release-evidence gates, not claims established by
  these synthetic tests.

### Finding disposition

| Finding                                             | Disposition                                             | Corrected evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0.1 false Saturn pass at opposition                | **Closed**                                              | Pass bracketing now unwraps the right residual continuously and evaluates intermediate samples near that branch (`packages/astro-engine/src/saturn-return.ts:207-238`). Every candidate is re-evaluated and admitted only within `1e-7°` circular residual (`packages/astro-engine/src/saturn-return.ts:239-253`). The explicit `179° -> 181°` opposition regression returns no windows (`packages/astro-engine/src/__tests__/core.test.ts:392-416`).                                                                                                                                                                                                                                       |
| P0.2 missed narrow Saturn windows                   | **Narrowed and non-blocking**                           | The schema now enforces an orb of `0.5°..3°` (`packages/astro-schema/src/personal.ts:10-22,84-91`), while provider output is rejected above the `0.2°/day` Saturn speed ceiling (`packages/astro-engine/src/provider.ts:24-36,128-135`; independently repeated at `packages/astro-engine/src/saturn-return.ts:120-129`). Under the documented continuous physical-trajectory contract, one day cannot traverse the minimum one-degree-wide return interval between two outside samples (`packages/astro-engine/README.md:7`). Synthetic sub-day oscillation remains deliberately unsupported.                                                                                               |
| P0.3 provider/runtime failures escape `AstroResult` | **Closed**                                              | Capabilities are runtime-parsed, abort is checked, and the half-open supported range is enforced before calls (`packages/astro-engine/src/provider.ts:58-85`). Provider throws/rejections are converted to non-secret typed failures for positions and angles (`packages/astro-engine/src/provider.ts:116-136,159-197`). Public event and Saturn wrappers also close hasher/internal exceptions (`packages/astro-engine/src/events.ts:499-524`; `packages/astro-engine/src/saturn-return.ts:389-416`). Tests cover throwing positions, malformed runtime capabilities, supported-range end, and throwing event hasher (`packages/astro-engine/src/__tests__/core.test.ts:145-181,418-440`). |
| P1.1 time tolerance without angular proof           | **Closed**                                              | Refined ingress, lunation, and aspect candidates are re-queried and checked against `0.001°`; stations are checked against `1e-6°/day` before emission (`packages/astro-engine/src/events.ts:44-45,235-251,291-305,351-369,414-433`). Saturn passes are independently checked against `1e-7°` (`packages/astro-engine/src/saturn-return.ts:239-253`). Failure is typed `search-exhausted`, so the engine does not emit an unproven exact event. Swiss goldens remain required to validate real timestamps.                                                                                                                                                                                  |
| P1.2 fixed scans overstate completeness             | **Narrowed and non-blocking**                           | Runtime per-body speed ceilings bound endpoint motion (`packages/astro-engine/src/provider.ts:24-36,128-135`). The algorithm contract explicitly scopes six-hour completeness to continuous physical planetary motion without an interior cross-and-recross (`packages/astro-engine/README.md:9`). That is a deliberate provider-model restriction, not general scalar root completeness. The private adapter must prove it satisfies this physical contract before release.                                                                                                                                                                                                                |
| P1.3 station endpoint direction                     | **Closed**                                              | A zero-speed right endpoint is deferred to the next interval; only a zero-speed left endpoint or strict sign crossing is processed, so direction comes from the post-station right sample (`packages/astro-engine/src/events.ts:269-317`). The 12-hour regression emits exactly one Mercury station at the sampled endpoint with `retrograde` direction (`packages/astro-engine/src/__tests__/core.test.ts:256-291`).                                                                                                                                                                                                                                                                       |
| P1.4 event identity stability                       | **Closed by explicit contract**                         | `exactAt`, canonically serialized to milliseconds, and algorithm version are now explicitly identity-bearing (`packages/astro-engine/README.md:9`); key-order canonicalization remains protected (`packages/astro-engine/src/identity.ts:13-20`; `packages/astro-engine/src/__tests__/core.test.ts:204-218`). Event ordering remains time then ID (`packages/astro-engine/src/events.ts:454-459`). Provider/model changes that alter the canonical exact millisecond intentionally produce a different identity. Broader repeated-run/partition properties are useful hardening, not an unresolved contract decision.                                                                       |
| P1.5 Whole Sign lacks astronomical validation       | **Still externally gated; implementation non-blocking** | The arithmetic and provenance-frame checks remain internally coherent, but the only current engine test is synthetic (`packages/astro-engine/src/__tests__/core.test.ts:183-201`). Ascendant/MC and all-location categorical correctness still require the approved licensed Swiss angle corpus specified by `docs/research/ephemeris-reference-fixtures.md:74-87,123-128,141-149`. Do not describe Whole Sign astronomical accuracy as verified until that evidence exists.                                                                                                                                                                                                                |

### Human Design source-gate disposition

The former P2.2 implementation blocker is **closed for private Public V1 work by
explicit owner authorization**, not by inference from public artwork. The
authorization record pins the Mirror source commit, wheel anchor, direction,
equal spans, half-open semantics, known source transcription correction, and
publication limits (`docs/research/human-design-gate-source.md:1-18,20-47,67-79`).
The implementation publishes that provenance and uses sequence-plus-exact
partition geometry (`packages/human-design/src/gate-wheel.ts:12-36,49-91`). Tests
prove all 64 gates are unique, every gate start and preceding epsilon, all 384
line starts and midpoints, normalization, non-finite rejection, immutability,
and canonical projection (`packages/human-design/src/__tests__/gate-wheel.test.ts:16-119`).
Public package publication remains separately approval-gated.

### Residual gates after correction

1. Acquire and independently reproduce the approved Swiss golden corpus before
   claiming production astronomical accuracy for positions, speeds, event times,
   Saturn passes, Ascendant/MC, or Whole Sign categories.
2. Review the private adapter against runtime flag/fallback, data/version,
   supported-range, speed-ceiling, abort, exception, and provenance requirements.
3. Keep Swiss distribution and public release blocked pending signed terms and
   explicit owner approval.

The original findings below are retained as the audit trail; this dated section
is their controlling disposition.

## Findings

### P0.1 Saturn can report a false exact return at the 180-degree residual discontinuity

**Evidence:** `packages/astro-engine/src/saturn-return.ts:120-123` reduces the
transit-to-natal displacement to `[-180, 180)`. The exact-pass scan then treats
any residual sign change as a bracketed zero (`packages/astro-engine/src/saturn-return.ts:193-213`),
while `refineBracket` assumes a continuous scalar and accepts a sign-changing
bracket (`packages/astro-engine/src/refinement.ts:14-41`). A normal crossing from
`+179.x` to `-179.x` is an opposition crossing, not a conjunction/return, but it
satisfies that test. Bisection converges on the discontinuity and the result is
stored without checking circular angular residual at the reported instant.

**Impact:** A bounded Saturn search spanning the opposition to natal Saturn can
emit a fabricated exact return roughly 14-15 years away from the real return.
This corrupts passes, windows, lifecycle status, and semantic IDs.

**Required acceptance tests:**

1. A synthetic Saturn trajectory crossing natal opposition (`179 -> 181`
   degrees of unwrapped displacement) produces no exact pass and no return
   window.
2. Direct and retrograde trajectories crossing the `359 -> 0` conjunction do
   produce exactly one pass.
3. Every emitted pass is re-evaluated at `exactAt`; circular distance from natal
   Saturn is within the declared angular tolerance as well as the one-second
   time tolerance.
4. Property tests vary natal longitude and crossing direction across the
   `0/360` and `+/-180` branches.

### P0.2 The Saturn scan can miss contract-valid narrow return windows and passes

**Evidence:** The public request permits any finite positive orb up to 3 degrees
(`packages/astro-schema/src/personal.ts:14-22` plus the implementation-only
positive check at `packages/astro-engine/src/saturn-return.ts:53-61`). The engine
samples only once per day (`packages/astro-engine/src/saturn-return.ts:27-29,147-155`)
and opens a window only when adjacent endpoint samples differ in inside/outside
state (`packages/astro-engine/src/saturn-return.ts:157-190`). It likewise finds a
pass only from endpoint residual signs (`packages/astro-engine/src/saturn-return.ts:193-214`).
Therefore a sufficiently narrow interval can enter and leave the orb between
two samples with both endpoints outside, and a multi-turn/non-monotonic provider
trajectory is not bounded by the algorithm contract.

**Impact:** Valid inputs can return `none-in-range` or incomplete passes even
though the provider trajectory contains a return. This is a completeness defect,
not merely a precision limitation.

**Required acceptance tests:**

1. A return window wholly contained between two daily endpoints is detected, or
   the request contract enforces and documents an orb/derivative bound that
   mathematically makes that case impossible.
2. A synthetic direct-retrograde-direct three-pass trajectory returns all three
   passes in chronological sequence and the maximal containing window(s).
3. Tangent contact at the orb boundary and at exact conjunction has explicit,
   tested inclusion semantics.
4. Search-start/search-end cases prove half-open behavior without claiming an
   edge is complete when its exterior is unobserved.

### P0.3 Provider exceptions and invalid runtime capabilities escape the typed failure contract

**Evidence:** `requestPositions` trusts `provider.capabilities` without runtime
validation and uses `maxBodiesPerRequest` as a loop increment
(`packages/astro-engine/src/provider.ts:35-53`). A runtime value of zero can make
the chunk loop non-terminating, and unsupported instants are not checked against
`supportedRange`. Calls to `getPositions` and `getLocalAngles` are awaited with
no exception boundary (`packages/astro-engine/src/provider.ts:53-56,95-107`).
The semantic hasher/Web Crypto path also throws (`packages/astro-engine/src/identity.ts:39-67`),
and event/Saturn public functions do not convert that failure to `AstroResult`.

**Impact:** A malformed, unavailable, aborted, or throwing adapter can hang or
reject a public domain operation instead of failing closed with a canonical
`invalid-provider-output`, `unsupported-range`, `aborted`, or
`provider-unavailable` result. This violates the provider error model and makes
private-adapter failure behavior unsafe to compose.

**Required acceptance tests:**

1. Runtime-invalid capabilities (zero/NaN body limit, malformed range, false
   positions capability) fail immediately and never call the provider.
2. Requests before/at/after the half-open supported range return the specified
   typed result.
3. Synchronous throws and rejected promises from each provider method are mapped
   to an agreed non-secret typed error; abort is distinguished from availability.
4. A throwing/unavailable hasher cannot escape an `AstroResult` public API.
5. Malformed batches, reordered batches, duplicated bodies, wrong instants,
   provenance drift, and wrong local coordinates all fail closed.

### P1.1 Event refinement reports time tolerance without proving angular exactness

**Evidence:** `refineBracket` stops when the time interval is at most the
tolerance and returns the rounded midpoint without evaluating it
(`packages/astro-engine/src/refinement.ts:29-35`). Event results then advertise a
one-second exact-time tolerance (`packages/astro-engine/src/events.ts:401-416`),
but ingress, lunation, aspect, and station creation never verify the final
angular/speed residual (`packages/astro-engine/src/events.ts:207-380`). The
approved fixture protocol explicitly requires recomputing angular residual at
the reported instant (`docs/research/ephemeris-reference-fixtures.md:141-149`).

**Impact:** The timestamp bracket may be narrow while the claimed exact event is
not demonstrably exact, especially around high derivative, discontinuity, or
non-monotonic cases.

**Required acceptance tests:** For every event family, re-query at `exactAt` and
assert the applicable angular or speed residual is within a documented bound.
Cover both directions, `0/360`, target-at-scan-end, and provider nonlinearity.

### P1.2 Fixed endpoint scans do not establish event-search completeness

**Evidence:** Every event family infers crossings solely from six-hour endpoint
samples (`packages/astro-schema/src/events.ts:18-22` and
`packages/astro-engine/src/events.ts:197-383`). Longitude/phase/aspect deltas are
unwrapped by the shortest endpoint arc (`packages/astro-engine/src/events.ts:210-228,287-315,337-360`),
and station detection allows at most one sign change per interval
(`packages/astro-engine/src/events.ts:248-283`). There is no provider speed or
acceleration bound in the contract proving that a target cannot be crossed and
recrossed between endpoints.

**Impact:** `complete: true` can overstate completeness for the accepted provider
contract. The behavior may be adequate for real Swiss planetary motion, but that
is an unproven physical assumption rather than an enforced algorithm invariant.

**Required acceptance tests:** Either enforce documented provider derivative
bounds and prove the six-hour step safe for every V1 body/event family, or use an
adaptive/bracket strategy that detects interior extrema. Include synthetic
cross-and-recross, exact endpoint, station-at-endpoint, and two-root intervals.

### P1.3 Station direction is wrong when zero speed lands on a scan endpoint

**Evidence:** A speed transition to exactly zero passes the sign-change condition
(`packages/astro-engine/src/events.ts:248-268`), but direction is derived only
from the right endpoint (`packages/astro-engine/src/events.ts:270-280`). For a
direct-to-retrograde station whose right endpoint is exactly zero, the code emits
`direct`; the adjacent interval can emit a second semantic event with a different
direction depending on refinement rounding.

**Required acceptance tests:** Put each station exactly at the left endpoint,
right endpoint, and interval interior for both direction changes. Require one
event with direction derived from samples strictly before and after the root.

### P1.4 Event identity is deterministic but its stability contract is incomplete

**Evidence:** Object keys are canonically sorted before hashing
(`packages/astro-engine/src/identity.ts:13-20`), and event ordering uses time then
ID (`packages/astro-engine/src/events.ts:385-390`). However IDs include the
refinement-rounded `exactAt` (`packages/astro-engine/src/events.ts:175-194`), and
deduplication fingerprints also include it. A sub-second provider/refinement
change can therefore rename the same semantic astronomical event, or fail to
deduplicate detections that round to adjacent milliseconds. No tests cover
repeated-run stability, input order, scan partitioning, limit prefixes, or
algorithm-version migration.

**Required acceptance tests:** Lock and document whether exact time is identity
or evidence. Prove identical IDs/order across requested body order, provider
chunking, repeated runs, and equivalent scan partitions; prove changing the
algorithm version has the intended migration behavior. If `exactAt` remains in
identity, define its canonical quantization.

### P1.5 Whole Sign arithmetic is internally coherent but not astronomically validated

**Evidence:** The engine derives the first house from the Ascendant sign and
assigns sign-offset houses (`packages/astro-engine/src/whole-sign.ts:58-82`),
with schema checks for canonical cusps/order
(`packages/astro-schema/src/astronomy.ts:231-281`). Existing tests cover only one
Pisces-Ascendant synthetic fixture (`packages/astro-engine/src/__tests__/core.test.ts:143-161`).

**Required acceptance tests:** Cover all 12 rising signs, every cusp boundary and
epsilon on both sides, `0/360`, every placement house, both hemispheres and
east/west locations. Approved Swiss angle goldens must validate Ascendant/MC and
categorical first-house results; the domain must continue to reject provenance
frame mismatch.

### P2.1 Current aspect and Moon-phase tests are examples, not boundary/property proof

**Evidence:** Aspect phase tests cover one square branch and equal speed
(`packages/astro-engine/src/__tests__/core.test.ts:77-102`); Moon phase tests use
representative values but omit all classification boundaries and epsilon cases
(`packages/astro-engine/src/__tests__/core.test.ts:104-117`). There is no property
proof for swapping body input order, both branches of sextile/square/trine,
opposition ambiguity, wrap invariance, or custom-orb validation.

**Required acceptance tests:** Add table/property coverage for every aspect,
both geometric branches, applying/separating in both motion directions, exact
and equal-speed behavior, body-order invariance, orb boundary +/- epsilon, and
all Moon phase boundaries +/- epsilon across `0/360`.

### P2.2 Human Design is correctly blocked; schema presence must not imply delivery

**Evidence:** The source review finds no authoritative, reusable complete wheel
table and explicitly forbids creating `@sukara/human-design` yet
(`docs/research/human-design-gate-source.md:1-18,42-79`). No Human Design package
exists. The schema currently exposes a mapping version and result shape
(`packages/astro-schema/src/personal.ts:139-159`), but cannot establish the gate
order, anchor, orientation, or half-open boundary ownership.

**Acceptance gate:** Keep the implementation absent and Wave B/Public V1 marked
blocked for this lane until the owner supplies the evidence listed in
`docs/research/human-design-gate-source.md:70-84`. After approval, independently
reproduce against a second authorized reference and exhaustively test all 64
gate and 384 line boundaries, wrap, normalization, gap-free coverage, body
projection rules (including derived Earth/south node), and provenance. Do not
reuse Mirror's unsourced hand-entered table.

## What is verified in this review

- Circular degree normalization itself maps arbitrary finite degree inputs to
  `[0, 360)` and explicitly removes negative zero.
- Aspect geometry selects the nearer positive/negative branch for symmetric
  major aspects; the reviewed examples are internally consistent, but the test
  matrix is insufficient for acceptance.
- Provider batches are runtime-parsed and checked for requested bodies/instant;
  chunk provenance drift and Whole Sign position/angle provenance mismatch fail
  closed when providers return an `AstroResult` normally.
- Event results are sorted chronologically with semantic ID tie-breaking and use
  a half-open requested window.
- Whole Sign cusp/placement arithmetic follows the documented Ascendant-sign
  model.
- The Human Design source/IP gate is conservative and correctly prevents an
  unsourced implementation.

## Not provable without approved private evidence

The following remain explicitly unverified and must not be represented as
production-correct or release-ready:

1. Planetary longitude, latitude, speed, retrograde state, Ascendant, and MC
   accuracy against a pinned licensed Swiss build/data set.
2. Returned Swiss calculation flags, fallback rejection, frame/time-scale
   fidelity, delta-T behavior, supported range, and private adapter failure
   closure; no approved private adapter was available in this review.
3. One-second event times, phase geometry, stations, Whole Sign categorical
   outputs, and Saturn passes against approved Swiss golden fixtures and the JPL
   investigation subset.
4. Human Design gate/line numeric correctness and redistribution safety; the
   authoritative/IP-safe source gate is still externally blocked.

Synthetic fixture tests can prove domain invariants, but they cannot substitute
for those provider/reference gates. No Swiss-derived numeric fixture, source,
binary, data file, licence material, or credential was inspected or added.

## Wave B exit conditions

Wave B should pass only after P0 findings are closed, P1 search/identity decisions
are either closed or explicitly narrowed by enforceable contracts, targeted
adversarial tests pass, `npm run verify` passes, and this independent review is
re-run on the corrected implementation. Human Design remains a recorded external
blocker unless its source/IP acceptance evidence arrives. Public release remains
separately blocked by signed Swiss terms and owner approval.
