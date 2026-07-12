# Private provider activation runbook

This runbook prepares the licensed production path without placing Swiss
Ephemeris material in the public repository. It is intentionally procedural;
it does not reproduce third-party source, data, binaries, or contract text.

## Activation gate

Before activating the provider, record in the private release evidence:

- the countersigned Astrodienst Professional licence contract;
- the licensed project name and licence edition/scope;
- the payment confirmation and contract effective date;
- the approved private adapter repository/package location; and
- the approved golden-fixture corpus location and tolerances.

The public repository does not store the contract or payment evidence. The
owner must retain those privately and attach a redacted release reference to
the operational record before activating distribution. Until the private
adapter and secrets are configured, the public resolver remains fail-closed
and the Vercel preview receives no Swiss secrets.

## Private adapter requirements

The adapter must implement `EphemerisProvider` and stay in a private,
server-only package or deployment artifact. It must:

1. expose only the provider port to `@sukara/astro-engine`;
2. preserve provider id/version/data version and `quality: "production"`;
3. declare supported UTC range, angles capability, and body/request limits;
4. map Swiss flags and failures to the typed Astro Engine error model;
5. avoid logging or persisting birth inputs and avoid returning them in errors;
6. prove frame, time-scale, fallback, speed, station, and house semantics; and
7. remain absent from browser bundles and public package tarballs.

## Release sequence after countersignature

1. Add the private adapter through the existing resolver seam; do not add it to
   the public workspace packages.
2. Run the approved Swiss golden corpus for positions, speeds, angles, Whole
   Sign, events, Saturn returns, and provider failure/fallback behavior.
3. Run the provider performance profile and compare against the bounded engine
   budget.
4. Configure Vercel production secrets only in the private project scope and
   verify the browser receives canonical outputs, never Swiss implementation
   details or source assets.
5. Re-run `npm run verify`, `npm run performance:web`, `npm run test:e2e`, the
   private golden suite, package scans, CodeQL, and full-history Gitleaks.
6. Obtain explicit owner approval before promoting the protected preview.
