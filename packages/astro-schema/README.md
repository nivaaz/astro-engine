# `@sukara/astro-schema`

Canonical Zod schemas, inferred TypeScript types, and the provider port for Public V1.

The package is private while the release/licensing hold is active. It contains no Swiss Ephemeris implementation or assets.

Contract conventions:

- Instants are canonical RFC 3339 UTC strings with exactly millisecond precision.
- Leap seconds and non-`Z` offsets are rejected at the canonical boundary. Local civil times require an IANA zone and explicit ambiguous-time policy; nonexistent times fail during resolution.
- Longitudes are tropical geocentric apparent ecliptic-of-date degrees in `[0, 360)`.
- Geographic longitude is east-positive degrees in `[-180, 180)`.
- Intervals are half-open: `[start, end)`.
- Canonical objects exclude processing-time metadata; arrays use the published rank constants.
- Birth-derived inputs and outputs are classified `session-personal` and may not be persisted or logged.
- Saturn-return requests use a bounded `0.5°..3°` orb so the versioned physical-motion search contract can guarantee window detection.
