# `@sukara/astro-engine`

Deterministic tropical astrology calculations over the public
`EphemerisProvider` port. This package contains no ephemeris implementation,
networking, persistence, logging, UI, or interpretation layer.

Saturn-return completeness is defined for continuous physical ephemeris trajectories with `|longitudeSpeed| <= 0.2°/day` and request orbs from `0.5°` to `3°`. Outputs fail closed when sampled provider speed violates that contract. Synthetic providers that oscillate between samples are outside the supported astronomical provider model.

Event completeness is likewise scoped to continuous physical planetary motion within the engine's per-body speed ceilings and without cross-and-recross oscillation inside one six-hour scan interval. Every refined event is re-evaluated against an angular or station-speed tolerance before it is emitted. `exactAt`, quantized to canonical milliseconds, and the algorithm version are identity-bearing fields.
