# Wave D security, privacy, and dependency review

- Reviewed base commit: `9958dcb3289cecf16cb535e401798986a7d022fa`
- Re-review: Wave D working-tree candidate after response-policy, cache-scope, and provider-composition fixes
- Scope: privacy egress, browser/API caching, secret and licence exposure, dependency posture, package publication boundaries, and provider isolation
- Disposition: **accept the private technical candidate with P2 residuals; no open P0/P1 security findings; public release remains closed by external licence, remote-scan, deployment, and owner-approval gates**

## Findings

### P0

None found.

### P1

None open.

#### Closed — Application-owned web response policy

`apps/web/next.config.ts` now applies a CSP, `no-referrer`, `nosniff`, frame denial, same-origin opener isolation, and an explicit Permissions Policy across application routes. The CSP restricts all resource classes to the application boundary, denies objects and framing, constrains forms, and permits only the inline script/style behavior currently required by the Next.js runtime. `unsafe-eval` is development-only. Desktop Playwright verified the CSP frame restriction, geolocation permission scope, and `nosniff` header from a live response. HSTS remains correctly deferred to the confirmed HTTPS deployment boundary.

#### Closed — Service-worker cache ownership and allowlist

`apps/web/public/sw.js` now deletes only obsolete cache names carrying the Astro Engine prefix. Runtime caching requires a same-origin, query-free GET and is limited to navigations, Next static assets, the manifest, and the icon. API routes and query-bearing requests cannot enter Cache Storage. Existing Playwright privacy and offline checks passed after the change.

### P2 — Two moderate transitive PostCSS advisories remain

`npm audit --json` reports two moderate findings: Next.js `16.2.10` bundles PostCSS `8.4.31`, affected by GHSA-qx2v-qp2m-jg93. There are zero high or critical findings, and `npm run audit:dependencies` passes at the repository's high-severity gate. npm offers only a breaking downgrade to Next `9.3.3`, so `npm audit fix --force` is not an acceptable remediation. Track the upstream Next release that carries PostCSS `>=8.5.10`; reassess the exposure if untrusted CSS is ever accepted or generated.

### P2 — Local secret scan could not be independently rerun

The local `gitleaks` binary was unavailable. The repository does contain a full-history Gitleaks workflow on pull requests and `main`, and targeted tracked-source/token-pattern scans found no credential material. Treat the CI Gitleaks result as required release evidence; this review does not substitute for it.

## Verified evidence

- Birth and location inputs remain only in React component state until the user explicitly requests a calculation. They are sent once in a validated POST body to the no-store calculation route, never placed in a URL, cookie, browser storage, cache, or application log. Refresh clears them.
- `GET` and `POST /api/sky` compose only through the canonical `EphemerisProvider` port. Every response, including success and failure, carries `Cache-Control: no-store, max-age=0`. Invalid request content and thrown adapter details are replaced by fixed public errors rather than echoed.
- `/api/format` validates a strict request envelope and canonical formatter input and returns only fixed errors with no-store and `nosniff` headers.
- The public provider resolver imports no licensed adapter and fails closed with a typed `503`. Its unrestricted synthetic provider resolves only when `ASTRO_ENGINE_FIXTURE_MODE=true` and `NODE_ENV` is not production; fixture provenance remains explicit.
- The service worker permits only same-origin, query-free navigations and named static shell resources. Playwright assertions cover cookies, local/session storage, URL leakage, API Cache Storage exclusion, refresh clearing, offline suppression of astronomical values, and live response security headers.
- Provider-composition tests: 1 file and 7 tests passed. They cover unavailable fail-closed behavior, canonical envelopes for all five operations, no-store responses, invalid request redaction, and resolver-exception redaction.
- Desktop Playwright: 5 tests passed, including privacy/offline behavior, security headers, installability, validation/clipboard failure, and the fixture Whole Sign/Saturn-return flows.
- `npm run test:boundaries`: 1 file and 4 tests passed. These assert explicit exports, private packages, no direct `/src` workspace imports, no `sweph-wasm`, and no `.se1`, `.se2`, or `.wasm` assets under apps/packages.
- All four package dry-runs succeeded from their package directories. Contents were limited to `dist`, README, and package manifest; no bundled dependencies or restricted Swiss artifacts were present. All four manifests remain `private: true` with explicit, non-wildcard exports.
- Domain-source import inspection found only `@sukara/astro-schema` plus local modules and test tooling. No Next.js, React, UI, auth, billing, logging, Swiss, or WASM dependency was present in domain packages.
- Targeted tracked-file and build-output scans found no private keys, registry tokens, GitHub tokens, Swiss binaries, Swiss adapter implementation, or ephemeris credentials. Build-output references to the unavailable ephemeris message are expected product copy, not licence material.
- Supply-chain controls are present: exact lockfile/toolchain, high-severity npm audit in CI, Gitleaks full-history workflow, CodeQL for JavaScript/TypeScript, and weekly Dependabot updates for npm and GitHub Actions.

## External gates

- Signed commercial Swiss Ephemeris terms are not confirmed in this worktree.
- No private adapter, provider secrets, or approved golden Swiss corpus is present; therefore real astronomical accuracy is not established by this review.
- Package publication, production deployment, restricted-asset distribution, and release approval remain explicitly owner-authorized T3 actions.
- CI Gitleaks and CodeQL results must be attached to the release evidence from the eventual remote commit/PR context.

## Final disposition

The Wave D candidate preserves the session-only privacy rule, keeps API and astronomical responses out of service-worker storage, applies an application-owned browser security policy, redacts server/provider failures, exposes no Swiss assets or secrets, holds every package private, and maintains the provider-neutral domain boundary. The P1 response-policy and P2 cache-scope findings are closed. The private technical candidate is accepted with the moderate dependency advisory and remote-scan evidence recorded as P2 residuals. Public release remains unauthorized until remote security workflows pass and all licence, publication, deployment, and owner-approval gates close.
