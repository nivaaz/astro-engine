# Runtime boundaries

## Ephemeris port

`@sukara/astro-schema` owns the `EphemerisProvider` input/output contract. `@sukara/astro-engine` consumes that port and remains ignorant of the provider implementation.

The public repository contains no production low-precision fallback. Tests may use explicit deterministic fixtures, but fixture providers must be labelled and cannot masquerade as production ephemeris data.

## Swiss adapter

The commercial Swiss Ephemeris adapter is private, server-only, and outside public package exports. It may be connected only after signed terms, private registry access, and secret handling are confirmed. Browser bundles and public packages must remain free of Swiss source, data, binaries, and credentials.

## Local context

Global coordinates are computed once for a UTC instant. Timezone, coordinates, and Whole Sign placement add local context without recomputing the global event.

## Consumer isolation

Domain packages do not import Next.js, React, UI components, auth, billing, storage, analytics, or logging. Formatters render canonical objects without altering them. Consumers validate external input at runtime before invoking domain code.
