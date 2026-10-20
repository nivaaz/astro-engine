# Production audit fixes and integrated release

- Status: Shipped
- Task class: T3 release, with T2 civil-time and privacy controls
- Risk tier: High for local-time conversion; Critical for production promotion
- Authority: Owner requested the four hosted fixes, daylight-saving correction, integration of the latest work, and production deployment on 20 October 2026. Signed commercial Swiss terms are recorded as confirmed in `docs/licensing/LICENSING.md`.
- Base: `dce2ad9` includes the foundation, Public V1 refinements, and mobile interface work. Preserve unrelated changes in the original checkout.
- Current decision: retain canonical astronomical/provider contracts; fix presentation and civil-time resolution in the consumer; reject nonexistent times and require an explicit choice for repeated times.
- Next action: None for this release. Verified production identity and evidence are recorded in `docs/releases/2026-10-20-public-v1.md`.

## Acceptance

1. A newly calculated sky is current for a documented five-minute UI freshness window; fixtures remain labelled fixtures and offline remains explicit.
2. Live calculation feedback never claims fixture data; local feedback stays beside the inputs/result.
3. Both event surfaces request the canonical maximum for the bounded 30-day range and disclose incomplete searches before filtering/display.
4. Whole Sign results and feedback remain readable without overlap at 390, 1280, and 1440 pixels.
5. Civil inputs round-trip exactly. Invalid dates and skipped local times produce no calculation request. Repeated times require a first/second occurrence choice; half-hour shifts and skipped dates are covered.
6. Session-only inputs, canonical calculation results, provider provenance, export contracts, and Swiss server-only boundaries are preserved.
7. Pinned-toolchain verification, browser checks, licensed Swiss goldens, dependency/security/package checks, and independent review are recorded before release.
8. Deploy the selected commit using production settings; verify the live calculation and copy flows, then record the production URL, commit, deployment, and residual risks.

## Verification

Targeted Vitest and Playwright regressions; full `npm run verify`; `npm run validate:swiss`; `npm run performance:web`; dependency audit; workspace/package and browser-asset boundary checks; secret scan and hosted CI/security checks; real-provider hosted smoke with invented birth input.

Package publication, unrelated documentation work, additional calculators, and changes to Swiss distribution rights are outside this release.
