# Test strategy

Tests follow risk, not file count.

## High priority

- Golden Swiss reference fixtures with source, timestamp, coordinate frame, tolerance, and provider version
- Boundary/property tests for degree wrap, signs, houses, aspect phase, search windows, Saturn passes, and Human Design gate/line transitions
- Runtime validation of every external and provider boundary
- Privacy assertions proving birth inputs are not logged, persisted, cached, or placed in URLs
- Package/export/licensing boundary tests

## Contract and presentation

- Formatter snapshots derive only from canonical objects
- API/runtime-shape tests cover success and typed failure contracts
- Minimal component tests cover stateful interactions, validation, copy/export, stale/offline state, and session clearing
- Desktop Chrome and mobile Chrome Playwright smoke cover the critical no-account flow

## Do not test

Static text, CSS classes, basic shadcn rendering, trivial getters, or implementation details.

## Required gates

- Every change: targeted tests plus `npm run verify`
- User-facing flow: `npm run test:e2e`
- Protected contract/computation: reference fixtures, boundary/property tests, independent review
- Release candidate: clean `npm ci`, full gate, Playwright, dependency audit, secret scan, CodeQL, package-content and bundle inspection, and performance budgets

Initial performance budgets: first-load JavaScript under 180 KiB gzip for the main route, mobile LCP under 2.5 seconds on the agreed test profile, and bounded computation completing under 250 ms p95 in the supported server runtime. Baselines must record hardware/runtime and may be tightened with evidence.
