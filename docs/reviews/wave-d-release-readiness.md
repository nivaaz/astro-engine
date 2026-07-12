# Wave D release-readiness review

- Review class: T2 independent release review with T3 licence/release gates
- Snapshot: Wave D integration worktree after local P0/P1 closure, 11 July 2026 AEST
- Scope: Foundation + Public V1 contracts, packages, provider-neutral server composition, PWA, tests, governance, security, performance, and release claims
- Decision: **locally technically ready; public release remains blocked by explicit external scientific, licence, hosted-CI, and owner-approval gates**

## Re-review of prior findings

### Closed — Provider-neutral PWA success path

The prior local P0 is resolved. The server now exposes five strict operations—current sky, bounded events, Whole Sign, Saturn return, and Human Design—through one provider-neutral composition boundary. Requests and canonical results are runtime-validated, failures are typed/redacted, responses are `no-store`, resolver exceptions fail closed, and production resolves no provider unless a private deployment deliberately composes an authorized adapter.

An unrestricted synthetic provider is gated to explicitly labelled non-production fixture mode. Seven focused server tests cover all five canonical success envelopes, missing-provider behavior, malformed inputs, and resolver redaction. Desktop and mobile browser tests execute Whole Sign and Saturn-return flows rather than leaving them as placeholders. The browser does not receive the private formatter/schema implementation: canonical validation and copy/export formatting occur on server routes, while the client performs a small defensive envelope check.

### Closed — Performance release budget

The production build now reports 150,670 bytes gzip across the seven main-route JavaScript assets, below the strict 184,320-byte budget. `npm run performance:web` deterministically attributes the route assets from the Next build manifests, exits non-zero on regression, and runs in CI after the production build. This supersedes the earlier 213,293-byte observation.

The recorded Pixel 5 profile remains below the 2.5-second LCP budget, and the recorded provider-neutral computation p95 baselines remain below 250 ms for current sky, Whole Sign, maximum-window events, and maximum-horizon Saturn return. These local engine timings deliberately exclude private-provider I/O; end-to-end production-provider performance remains part of the external adapter qualification.

### Closed — Security policy, service-worker ownership, and CLI packaging

The application now owns a restrictive response-header policy covering CSP, MIME sniffing, referrer leakage, framing, opener isolation, and least-privilege browser capabilities. The service worker deletes only Astro Engine-owned cache versions and positively allows only navigation, immutable Next static assets, the manifest, and the icon; query-bearing and API responses remain excluded.

The private smoke CLI remains unpublishable, has no public `bin`, and now limits any dry-run package content to `dist` and README through an explicit allowlist.

## Acceptance matrix

| Area                          | Evidence in the final Wave D worktree                                                                             | Disposition                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Foundation/toolchain          | Pinned Node/npm, exact lockfile, strict checks, explicit workspaces, clean-install evidence                       | Pass locally                                                    |
| Package boundaries            | Four canonical private packages, explicit exports, no direct `/src` or Swiss/WASM imports                         | Pass locally                                                    |
| Canonical contracts           | Runtime Zod schemas, provider port, provenance, typed failures, deterministic formatter inputs                    | Pass locally                                                    |
| Provider-neutral computation  | Current sky, aspects, Moon phase, bounded events, Whole Sign, Saturn return                                       | Pass synthetic tests; scientific accuracy externally unverified |
| Human Design                  | Owner-authorized Mirror mapping provenance; exhaustive gate/line boundaries; transit-only scope                   | Pass locally                                                    |
| Formatters/dev CLI            | Canonical JSON/Markdown/plain text; private bounded CLI with package allowlist                                    | Pass locally                                                    |
| Server composition            | Five typed operations, runtime validation, redacted failures, no-store responses, production fail-closed resolver | Pass locally                                                    |
| PWA product flow              | Current sky, events, Whole Sign, Saturn return, HD, location, canonical copy/export                               | Pass deterministic fixture flow                                 |
| Privacy                       | Session-memory inputs, one-shot no-store requests, no URL/storage/log/cache persistence, refresh clearing         | Pass locally                                                    |
| Installability/offline        | Manifest, icon, narrow shell service worker, explicit stale/offline/unavailable states                            | Pass locally                                                    |
| Interpretation/scope boundary | No interpretation engine or deferred MCP/API/accounts/billing/calendar/public CLI/bodygraph scope                 | Pass                                                            |
| Security/supply chain         | Security headers, restricted-artifact assertions, high-severity audit, CI/CodeQL/Dependabot/Gitleaks configured   | Pass locally; hosted results pending                            |
| Web performance               | 150,670 bytes gzip with checked-in CI budget; profiled mobile LCP below 2.5 seconds                               | Pass locally                                                    |
| Engine performance            | Recorded maximum-window provider-neutral p95 below 250 ms                                                         | Pass locally; private-provider qualification pending            |
| Licensed provider/goldens     | Not available and correctly excluded                                                                              | External release block                                          |
| Deployment/publication        | Not attempted                                                                                                     | Correctly blocked                                               |

## Independently verified evidence

This final re-review ran the following against the integrated worktree:

- `npm run verify`: formatting, 10/10 workspace typecheck/build tasks, lint, and 80/80 tests passed.
- `npm run performance:web`: 150,670 bytes gzip, below the 180 KiB main-route budget.
- `npm run test:e2e`: 10/10 desktop/mobile Chromium tests passed, including executable Whole Sign and Saturn-return fixture flows.
- `npm run audit:dependencies`: exited 0 at the configured high-severity threshold; two moderate transitive PostCSS findings remain.
- `git diff --check`: clean.

The recorded Wave D evidence additionally includes a clean `npm ci`, uncached six-workspace build, package-content inspection, formatter/CLI smoke, mobile LCP profile, and bounded computation benchmark. No Swiss source, data, binary, WASM, credential, private registry URL, or adapter implementation is present in public sources, packages, or reviewed browser assets.

## Remaining external gates and residual risks

1. Signed commercial Swiss Ephemeris terms have not been confirmed. No public deployment, package publication, or restricted-asset distribution is authorized.
2. The authorized private server adapter, its provider flags/fallback behavior, supported range, data version, and secrets are not available in this worktree.
3. Planetary positions/speeds, Ascendant/MC, Whole Sign classification, exact event times, and Saturn-return passes still require the approved licensed golden corpus with documented tolerances. Synthetic fixtures prove deterministic contracts, not production astronomical accuracy.
4. Private-provider end-to-end latency must be measured on the supported production runtime; current computation baselines intentionally isolate domain overhead.
5. Hosted CI, CodeQL, and full-history Gitleaks results must be attached from the eventual remote commit/PR. Local configuration and targeted scans do not substitute for those remote checks.
6. Two moderate PostCSS advisories remain through Next 16.2.10. The high-severity gate passes, and npm currently proposes only an unacceptable breaking downgrade; track the first compatible upstream fix.
7. Production deployment and package publication require explicit owner approval even after every scientific and hosted check passes.

## Final disposition

Foundation + Public V1 is **technically ready in the local, provider-neutral sense**. The repository now contains the four intended canonical packages, deterministic domain algorithms, owner-authorized Human Design transit mapping, canonical formatters, bounded private CLI, server-only provider composition, and a complete no-account PWA flow with privacy, offline, security, browser, package, and performance evidence. No local P0 or P1 finding remains in this review.

This disposition is not a scientific-production or release approval. GitHub and the PWA may ship together only after signed commercial Swiss terms, the authorized private adapter, licensed golden-fixture validation, private-provider performance qualification, successful hosted security/CI checks, and explicit owner authorization. Until then, production must continue to fail closed and packages must remain private.
