# Protected contracts

Changes to these surfaces are T2/high-risk by default:

1. Canonical Zod schemas and branded primitives.
2. `EphemerisProvider` inputs, outputs, error model, precision, and provenance.
3. UTC instant, timezone, coordinate, zodiac, and Whole Sign semantics.
4. Aspect orb and applying/exact/separating rules.
5. Event identity, ordering, bounded search windows, and provenance metadata.
6. Saturn-return window/pass/status semantics.
7. Human Design gate/line mapping boundaries.
8. JSON field names and formatter derivation from canonical objects.
9. Session-only birth-input handling and no-log guarantees.
10. Swiss licence and server-only distribution boundary.

A protected-contract change requires an active plan, fixture or boundary evidence, full verification, independent review, and a migration note when compatibility changes.

Wildcard package exports and direct cross-workspace `/src` imports are prohibited. Every public export must be deliberate and testable.
