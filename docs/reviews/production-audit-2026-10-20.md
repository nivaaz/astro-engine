# Production audit release review — 20 October 2026

Owner-authorized independent read-only review of `fix/production-audit-release`, based on `dce2ad9`.

## Disposition

No blocking findings remain in the civil-time conversion, freshness and event-coverage presentation, request invalidation, local result layout, server-only Swiss traces, or dependency patch. The review identified a pending-request race when the repeated-time choice changed; explicit abort and request identity checks close it, with a browser regression.

## Civil-time evidence

- Targeted unit review: 21/21 tests passed.
- 7,436 exact civil-time round trips across all 143 supported city timezones at representative dates from 1800–2399: zero failures.
- 9,130 stored TZif transition cases independently compared with Python ZoneInfo, including gaps, folds, historical second offsets, half-hour changes and skipped dates: zero failures, using tzdb 2026c.
- Other browser timezone database versions and future POSIX recurrence transitions were not exhaustively enumerated. Runtime IANA/ICU rules remain an external dependency.

## Dependency and distribution evidence

Next and eslint-config-next 16.4.2, Sharp 0.35.5, Node 24 and React 19 have compatible declared requirements. Sharp loaded and generated a PNG; bundled librsvg is 2.63.2. Resolved transitive patches are nanoid 3.3.20, source-map-js 1.2.2 and baseline-browser-mapping 2.11.30. Lockfile tarballs use the HTTPS npm registry and integrity hashes, with no added lifecycle script in changed packages.

The reviewer could not perform a fresh registry audit under sandbox DNS restrictions. The primary release gate separately ran a network-enabled production dependency audit: zero vulnerabilities. Both `/api/sky` and `/api/format` trace the two manifest-verified private data files server-side. Main-route browser assets passed the restricted-marker scan at 174,774 gzip bytes against a 184,320-byte budget. Four canonical package dry-runs contain no restricted assets.

## Offline release regression

Both development bundlers reproduced a cached-shell hydration stall after the runtime update. A static offline status document now handles failed navigations without depending on framework hydration. The versioned shell cache no longer stores navigation responses; origin, query and API exclusions remain intact. Independent privacy review found no blocker. The browser regression also checks reconnect/reload recovery. Existing controlled tabs may retain the old service worker until closed, following the normal waiting-worker lifecycle.

## Release requirements

Promote only after browser regressions, hosted CI/security checks and actual Linux/Swiss provider smoke pass. Verify the production offline flow separately from the development server. Session inputs remain memory-only; this release adds no accounts, saved charts, public packages or additional calculator contracts.

## Hosted closure

The final hosted install runs from repository root and includes the lock-pinned development build tools. Hosted Node 24.21.0 / npm 11.19.0 satisfy the declared ranges. Independent follow-up review cleared the explicit provider environment hash, upload exclusions, four-package browser-test prerequisite and Sydney timezone fixture assertion. All final CI checks and the actual provider/copy/offline gates passed before promotion. Production identity and remaining limits are recorded in the release report.
