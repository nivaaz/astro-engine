# Ephemeris reference fixtures

Status: research protocol for Public V1. This document does not contain or
distribute Swiss Ephemeris source, binaries, data files, credentials, or
licence material.

## Verified source facts

- Astrodienst documents `swetest` as its command-line test interface and as a
  tool for creating tabular ephemerides. Its maintained source defines UTC
  input (`-utc`), planet selection (`-p`), decimal longitude/speed output
  (`-fls`), the Swiss engine (`-eswe`), the ephemeris directory (`-edir`), and
  high-precision speed (`-speed`). It also identifies `0` through `9` as Sun
  through Pluto and `t` as the true lunar node.
  [Astrodienst overview](https://www.astro.com/swisseph/swephinfo_e.htm),
  [`swetest.c` options](https://github.com/aloistr/swisseph/blob/master/swetest.c#L2327-L2456),
  [`swetest.c` formats and bodies](https://github.com/aloistr/swisseph/blob/master/swetest.c#L3011-L3226)
- `swe_calc_ut()` accepts a Julian day in UT and returns longitude, latitude,
  distance, longitude speed, latitude speed, and distance speed. Astrodienst
  recommends calling `swe_set_ephe_path()` before calculation. `SEFLG_SPEED`
  requests high-precision speed; when Swiss files are missing, the library can
  fall back to Moshier, so the returned flags/provider identity must be checked
  rather than inferred from the requested flag.
  [Swiss Ephemeris Programmer's Manual](https://www.astro.com/swisseph/swephprg.pdf)
- Swiss house functions take UT plus geographic latitude/longitude; east and
  north are positive. `swetest` identifies `W` as equal/Whole Sign and requires
  UT for house calculation.
  [Programmer's Manual, house functions](https://www.astro.com/swisseph/swephprg.pdf),
  [`swetest.c` house options](https://github.com/aloistr/swisseph/blob/master/swetest.c#L2458-L2537)
- JPL Horizons can independently report observer-centred, apparent,
  ecliptic-of-date longitude/latitude (quantity 31). Its documentation warns
  users to align time scale, reference frame, observer centre, and requested
  quantities rather than trust defaults.
  [JPL Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html),
  [Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html)
- IANA tzdb represents historical civil-time rules and changes as political
  authorities update offsets and daylight-saving rules. A timezone identifier
  is therefore not a timeless offset; fixture provenance must pin the tzdb
  release. RFC 3339 defines numeric offsets as local time minus UTC and does
  not itself supply timezone rules.
  [IANA Time Zone Database](https://www.iana.org/time-zones),
  [RFC 3339](https://datatracker.ietf.org/doc/html/rfc3339)
- The Human Design mandala has 64 fixed gate partitions and six lines per gate.
  The public official material inspected does not provide a complete,
  machine-readable normative longitude-boundary table.
  [Human Design America mandala](https://hdtasks.humandesignamerica.com/mandala)
- Astrodienst requires a developer to choose AGPL or a signed Professional
  licence before distributing software containing Swiss Ephemeris or activating
  a public service that uses it. Exact Professional terms govern permitted
  copying and redistribution.
  [Astrodienst licensing](https://www.astro.com/swisseph/swephinfo_e.htm)

## Acquisition protocol (recommended)

1. Create fixtures only inside an owner-approved, access-controlled validation
   environment covered by the confirmed licence. Pin and record the Swiss
   library tag/commit, `swetest` build hash, ephemeris family and data-file
   checksums, command, platform, and acquisition timestamp.
2. Use explicit UTC instants and explicit calculation settings. Do not acquire
   golden values from a browser chart, screenshot, rounded PDF table, or an
   application's own adapter.
3. Generate the raw reference with the official `swetest` executable built from
   the same pinned upstream revision. A representative shape is:

   ```text
   swetest -b11.7.2026 -utc00:00:00 -p0123456789t -eswe -speed \
     -fTJPlbs -g, -head -edir<OWNER_APPROVED_EPHE_PATH>
   ```

   Treat this as a command template, not a checked-in script: confirm it against
   `swetest -?` from the pinned build, capture stdout/stderr and exit status, and
   verify the reported calculation flags did not fall back to Moshier.

4. Acquire Whole Sign/angle references separately with explicit coordinates and
   `-house<east-longitude>,<latitude>,W` plus UTC input. Keep geocentric planet
   positions separate from location-dependent angles/houses.
5. Transform raw output into small, reviewable JSON fixtures containing only the
   numeric expectations needed by tests. Do not commit upstream data files,
   Swiss binaries/source, paths, licence text, or bulk ephemeris tables. Obtain
   written licence confirmation before committing any Swiss-derived golden
   numeric output; until then keep generated values private and commit only
   synthetic/provider-neutral fixtures.
6. Have a second reviewer reproduce a representative subset from a clean
   environment. For Sun, Moon, inner/outer planets and a station case, also run
   JPL Horizons from Earth geocentre with apparent observer ecliptic-of-date
   coordinates. Record settings and compare; do not silently loosen tolerances
   when models or frames differ.

## Fixture record

Each fixture should carry:

```text
fixture_id, purpose, acquired_at_utc, reviewed_at_utc
input: utc_instant, julian_day_ut, local_datetime?, iana_zone?, tzdb_version?
location: latitude?, east_longitude?, elevation_m?
calculation: tropical, geocentric, apparent, ecliptic_of_date, whole_sign?
provider: name, library_version, source_commit, returned_flags
data: ephemeris_family, file_checksums_private_reference, delta_t_model
tool: swetest_version, executable_sha256, exact_command, platform
expected: bodies[longitude, latitude, longitude_speed], angles?, house_cusps?
derived_expected: retrograde?, moon_phase?, aspects?, events?, saturn_return?, hd_gate_line?
tolerances: per-field absolute/circular/time tolerance and rationale
review: reviewer, independent_source, result, exceptions
licence: classification and approval reference (never contract text or secrets)
```

Use RFC 3339 `Z` timestamps for instants. If a fixture starts with civil time,
retain the original local fields, IANA zone, chosen offset/fold, resolved UTC
instant, and tzdb version. Reject nonexistent local times. Require an explicit
choice for duplicated clock times; never auto-shift or guess.

## Coverage matrix

- Positions/retrograde: every V1 body; direct, retrograde, just before/at/after
  a station; longitude wrap near 0/360; sign boundaries.
- Moon phase: new, first quarter, full, last quarter, and waxing/waning samples.
  Define phase from normalized geocentric Sun-Moon elongation; keep illumination
  percentage out of the contract unless separately specified.
- Aspects/events: each major aspect, both applying and separating, exactness,
  orb entry/exit, wrap-around, equal-speed edge cases, search-window start/end,
  and stable event ordering/identity.
- Whole Sign: both hemispheres, east/west longitudes, multiple latitudes,
  Ascendant immediately around a sign boundary, and all 12 rising signs.
- Saturn return: zero, one, and three-pass histories; active boundary; upcoming
  and complete states; search-window edges. The natal and transit Saturn values
  must originate from the provider fixture, while window/pass/status assertions
  exercise domain logic.
- Human Design transit gates/lines: all 64 synthetic gate intervals; every gate
  and line start/end; 0/360 wrap; one ULP/epsilon on both sides. Add a small set
  of real provider longitudes only after an owner-approved normative table or
  licensed reference calculator has been independently verified.
- Time: UTC baseline plus DST gap/fold, fractional-hour offsets, historical rule
  changes, and dates on both sides of a pinned tzdb update.

## Tolerance policy (recommended initial gate)

Tolerances are contract values, not a way to absorb unexplained disagreement.
Compare angles with circular distance.

| Check                                             |                        Initial tolerance | Rule                                                                                               |
| ------------------------------------------------- | ---------------------------------------: | -------------------------------------------------------------------------------------------------- |
| Same pinned Swiss build/data: longitude, latitude |                                  `1e-7°` | Failure blocks merge; first rule out flags, time scale, file fallback, and frame.                  |
| Same pinned Swiss build/data: longitude speed     |                              `1e-8°/day` | Store full precision; classify retrograde from the provider speed, with explicit station fixtures. |
| Whole Sign Ascendant/MC                           |                                  `1e-6°` | Categorical house/sign must still match exactly; boundary fixtures use bracketing, not rounding.   |
| Exact-event time, same provider/root contract     |                               `1 second` | Recompute the angular residual at the reported instant; time alone is insufficient.                |
| JPL cross-provider longitude/latitude             |    `1 arcsecond` investigation threshold | Not a replacement golden. Any excess requires a documented frame/model analysis and review.        |
| JPL cross-provider event time                     |     `60 seconds` investigation threshold | Match observer, apparent/geometric choice, ecliptic/equinox, time scale, and aberration first.     |
| Derived enum/string/identity/order                |                                    exact | Never snapshot rounded display output as the computation oracle.                                   |
| Synthetic degree/gate/line boundary               | exact category at boundary and `±1e-10°` | Publish half-open interval semantics; test 0/360 explicitly.                                       |

Before locking these numbers, run the full corpus on every supported runtime and
tighten to the smallest stable tolerance with evidence. Do not widen a tolerance
without a recorded cause, protected-contract review, and migration note.

## Mirror Mindset reuse audit

Inspected read-only on 11 July 2026:

- `src/app/lib/astro-core/planets.ts`: longitude normalization, tropical sign
  partitioning, and `speed < 0` retrograde classification are small,
  provider-neutral candidates. Reimplement behind canonical types and protect
  0/360, sign-boundary, `-0`, and station behavior with tests.
- `src/app/lib/astro-core/houses.ts`: Whole Sign assignment from the Ascendant's
  sign is conceptually reusable. Independently validate the Ascendant, all 12
  rising signs, and boundary semantics; do not copy app-local types/imports.
- `src/app/charts/astro/ephemeris/chart.ts`: not reusable as the engine contract.
  It imports Swiss/WASM directly, caches birth-derived charts in module memory,
  emits a nondeterministic `generatedAt`, uses an app-local fixed 3° orb, and
  derives aspect phase from a local signed-delta rule without reference
  fixtures. It also requests Swiss Whole Sign cusps while separately deriving
  Whole Sign assignment, which needs one canonical contract.
- `src/app/charts/astro/ephemeris/swephClient.ts` and the ephemeris HTTP route:
  implementation evidence only. They deliver WASM/data through the app and can
  fall back across local, bundled, and remote storage. That conflicts with this
  repository's private server-only adapter and licence boundary.
- `src/app/lib/time/timezone.ts`: the UTC-to-Julian-day conversion is simple, but
  local-time handling is not reusable unchanged. It attempts to resolve DST
  gaps by scanning forward and does not expose an explicit fold choice for
  ambiguous local times. Public V1 should reject gaps and require a fold/offset
  decision.
- `src/app/charts/human-design/gateMapping.ts`: the half-open interval approach
  and range-wrap structure are useful patterns, but its hand-entered range table
  is not independently sourced in the inspected code. It also computes
  color/tone/base outside V1. Rebuild gates/lines only from an approved normative
  table and boundary fixtures; do not inherit interpretation/classification
  code from `src/app/lib/transits/humanDesign.ts`.

No hand-written Meeus production implementation was found in the selectively
audited computation paths. That is not proof none exists elsewhere; the
integration reviewer should retain a repository-wide prohibition check.

## Acceptance and review

A fixture set is acceptable only when its acquisition is reproducible, provider
and returned flags are explicit, every transformation is reviewable, tolerances
are justified, an independent reviewer has reproduced the critical subset, and
licensing approval covers storage and repository visibility. A provider adapter
must fail closed on missing/wrong assets or fallback flags; it must never produce
apparently valid canonical output with unknown provenance.
