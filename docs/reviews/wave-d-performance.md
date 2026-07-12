# Wave D performance and package audit

- Review class: T2 independent release audit
- Scope: production web assets/navigation, bounded provider-neutral computation,
  package tarballs, private dev CLI, and clean workspace behavior
- Runtime snapshot: 2026-07-11 AEST, Node 24.18.0, npm 11.16.0, macOS
  arm64, Apple M1 Max (10 cores), 32 GB RAM
- Decision: **performance and package release checks pass locally after the
  final server composition and client optimization**

## Findings

### Closed — Main-route JavaScript is below the release budget

A cold production navigation loaded six modern JavaScript assets with 145,054
encoded body bytes (141.7 KiB). The checked-in manifest-based budget command
conservatively counts seven assets at 150,670 gzip bytes (147.1 KiB). Both are
below the strict 180 KiB gzip budget (184,320 bytes), leaving at least 33,650
bytes (32.9 KiB) of headroom under the enforced calculation.

The page-owned production chunk is now 5,304 encoded bytes, down from 73,543
bytes in the initial audit. No Zod, engine computation, formatter runtime, or
Human Design projection symbol was found in emitted client chunks. Canonical
runtime parsing, formatting, provider-neutral engine work, and Human Design
projection live behind server routes; the client retains a small discriminant
guard and fail-closed presentation behavior.

Verified acceptance:

1. A production cold navigation transfers less than 184,320 encoded JavaScript
   body bytes for `/` in a modern Chromium client.
2. `npm run performance:web` fails at or above the budget and runs after the
   production build in `.github/workflows/ci.yml`.
3. Server composition retains canonical validation and formatter derivation;
   client bundles exclude their full runtimes.

### Closed — Route budget is enforced in CI

`scripts/check-web-bundle.mjs` reads the production build and route client
reference manifests, deduplicates the route/root assets, gzips them at level 9,
and exits nonzero at 184,320 bytes. `npm run performance:web` is checked into the
root package and CI quality job. LCP remains a profiled release check because
headless local timing is not a stable unit-test assertion. Provider-neutral
computation baselines remain recorded below; converting them to a stable CI
benchmark is a future hardening opportunity, not a current budget failure.

### Closed — Private CLI tarball uses an explicit build-output allowlist

`@sukara/dev-cli` is correctly `private`, has no `bin`, has no network/provider
dependency, caps input at 1 MiB, and imports only the formatter package. Its
package now allows only `dist` and `README.md`; `npm pack --dry-run` contains
compiled output, declarations/maps, README, and package metadata, with no
`src/*.ts` or TypeScript configuration.

## Initial web production baseline (before optimization)

Build command:

```sh
npm run build --workspace @sukara/astro-web
ASTRO_ENGINE_FIXTURE_MODE=true npm run start --workspace @sukara/astro-web -- --hostname 127.0.0.1 --port 3200
```

Measurement profile:

- Playwright/Chromium 149.0.7827.55, headless, Pixel 5 device profile
- cold browser context and disabled cache for every run
- 150 ms latency, 1.6 Mbit/s download, 750 Kbit/s upload
- 4x CPU slowdown through Chrome DevTools Protocol
- local production Next server; fixture mode enabled only to exercise the
  canonical presentation path
- five runs; `PerformanceObserver` buffered largest-contentful-paint entries
- this is a controlled local baseline, not field data or production-provider
  latency

Results:

| Metric                    | Runs |    Median |       p95 |        Budget | Result                     |
| ------------------------- | ---: | --------: | --------: | ------------: | -------------------------- |
| LCP (`H1`)                |    5 |    556 ms |    588 ms |     <2,500 ms | Pass                       |
| DOM content loaded        |    5 |    546 ms |    573 ms | recorded only | Baseline                   |
| load event                |    5 |  1,612 ms |  1,617 ms | recorded only | Baseline                   |
| modern first-load JS body |    5 | 213,293 B | 213,293 B |    <184,320 B | Initial fail; closed above |
| stylesheet body           |    5 |   4,284 B |   4,284 B | recorded only | Baseline                   |

Production asset attribution from the route manifest and network response
bodies:

| Attribution                     | Encoded bytes |
| ------------------------------- | ------------: |
| Next/React/shared runtime       |       139,447 |
| Page-owned chunk (includes Zod) |        73,543 |
| Layout/PWA-registration chunk   |           303 |
| **Total modern route JS**       |   **213,293** |

The service worker is separate from first-load route JavaScript (1,317 raw
bytes; 524 bytes under local `gzip -9`) and was not counted in the route budget.
The CSS asset is 14,907 raw bytes and 4,215 bytes under local `gzip -9` (the
server response body measured 4,284 encoded bytes).

## Provider-neutral computation baseline

The benchmark used an immediate, deterministic in-process provider fixture and
the maximum schema windows: 93 days/500 results for major events and 35 years
for Saturn return. It measures engine/schema work only; real ephemeris I/O is
explicitly excluded and remains part of the licensed private-adapter release
evidence. Each workflow was warmed once. Current sky, Whole Sign, and events
used 30 measured iterations; Saturn used 10.

| Workflow                        |     Median |        p95 |        Max | 250 ms p95 budget |
| ------------------------------- | ---------: | ---------: | ---------: | ----------------- |
| Current sky (11 bodies)         |   0.326 ms |   0.634 ms |   1.004 ms | Pass              |
| Whole Sign (11 placements)      |   0.159 ms |   0.260 ms |   0.311 ms | Pass              |
| Upcoming major events (93 days) |  30.229 ms |  35.550 ms |  40.503 ms | Pass              |
| Saturn return (35 years)        | 112.875 ms | 120.614 ms | 120.614 ms | Pass              |

These timings prove bounded local overhead, not astronomical correctness or
production end-to-end latency. Re-run against the authorized private provider
and supported server hardware before release.

## Package-content inspection

Reproducible command:

```sh
for workspace in @sukara/astro-schema @sukara/astro-engine \
  @sukara/astro-formatters @sukara/human-design @sukara/dev-cli; do
  npm pack --dry-run --json --workspace "$workspace"
done
```

| Workspace                  |   Packed |  Unpacked | Entries | Disposition          |
| -------------------------- | -------: | --------: | ------: | -------------------- |
| `@sukara/astro-schema`     | 16,895 B | 102,553 B |      26 | Pass                 |
| `@sukara/astro-engine`     | 22,489 B | 107,053 B |      46 | Pass                 |
| `@sukara/astro-formatters` |  8,289 B |  33,691 B |      26 | Pass                 |
| `@sukara/human-design`     |  3,127 B |   9,980 B |      10 | Pass                 |
| `@sukara/dev-cli`          |  3,300 B |   9,214 B |      10 | Pass after allowlist |

The four canonical packages include only `dist`, README, and package metadata as
declared. No dependencies are bundled. No Swiss source/data/binary, WASM, Next,
React, auth, billing, Supabase, logging, or generated tarball was found in the
package outputs. All packages remain `private: true`, correctly enforcing the
current publication hold. Declared package entry points import successfully;
direct `@sukara/*/src/*` imports fail with `ERR_PACKAGE_PATH_NOT_EXPORTED`.

## Install, build, and CLI evidence

- `npm ci` completed from the exact lockfile: 425 packages added, 432 audited,
  8.46 seconds wall time. It reported two moderate advisories; the separate
  security audit owns their release disposition.
- `npx turbo run build --force` completed all six workspaces with zero cache
  hits in 10.83 seconds wall time. The web route was statically prerendered;
  `/api/sky` remained dynamic.
- `npm run smoke --workspace @sukara/dev-cli -- --format json` and
  `--format text` both rendered the explicitly labelled non-ephemeris fixture.
- The CLI has no public executable declaration, accepts fixture/file/stdin only,
  rejects non-files and inputs above 1 MiB, performs no computation or network
  access, and emits bounded non-secret error messages.

## Disposition

Package contents, workspace boundaries, clean install/build behavior, private
CLI scope, mobile LCP, provider-neutral computation, and final first-load web
performance are locally acceptable. The enforced final build is below the
180 KiB route budget, and server-only composition dependencies do not enter the
client asset set.
