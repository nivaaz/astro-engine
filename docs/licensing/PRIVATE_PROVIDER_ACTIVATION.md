# Private provider activation runbook

This runbook prepares the licensed production path without placing Swiss
Ephemeris material in the public repository. It is intentionally procedural;
it does not reproduce third-party source, data, binaries, or contract text.

## Activation evidence

Record in the private release evidence before a provider-enabled production promotion:

- the countersigned Astrodienst Professional licence contract;
- the licensed project name and licence edition/scope;
- the payment confirmation and contract effective date;
- the approved private adapter repository/package location; and
- the approved golden-fixture corpus location and tolerances.

The public repository does not store the contract or payment evidence. The
owner retains those privately and attaches a redacted release reference to
the operational record. The signed terms authorize the private adapter and
licensed validation; the public resolver remains fail-closed unless the
provider is explicitly enabled and the Vercel preview receives no Swiss
secrets until its deployment trace is verified.

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

## Current implementation

The authorized adapter uses the server-only native `sweph@2.10.3-7` N-API
binding. Build/setup acquires only `sepl_18.se1` and `semo_18.se1` from the
pinned `aloistr/swisseph` revision in
`config/private/ephemeris-manifest.json`, verifies byte length and SHA-256,
and writes them to the ignored `apps/web/.private/ephemeris/` directory.
Next output tracing includes those files only for the Node `/api/sky` route;
they are never copied to browser assets or public package artifacts. No object
storage, Astrodienst credentials, asteroid files, or client-side Swiss code are
needed for Public V1.

The native library has process-global settings and is single-threaded. The
adapter initializes `set_ephe_path()` once per process and never mutates Swiss
global settings during a request. Any missing file, integrity mismatch,
non-empty Swiss fallback message, unexpected return flags, wrong version, or
native-load failure returns a typed provider failure.

## Release sequence after countersignature

1. Add the private adapter through the existing resolver seam; do not add it to
   the public workspace packages.
2. Run the approved Swiss golden corpus for positions, speeds, angles, Whole
   Sign, events, Saturn returns, and provider failure/fallback behavior.
3. Run the provider performance profile and compare against the bounded engine
   budget.
4. Configure the provider-enabled preview build to acquire only the pinned
   manifest files, verify the server deployment trace, and verify the browser
   receives canonical outputs, never Swiss implementation details or source
   assets.
5. Re-run `npm run verify`, `npm run performance:web`, `npm run test:e2e`, the
   private golden suite, package scans, CodeQL, and full-history Gitleaks.
6. Obtain explicit owner approval before promoting the protected preview.
