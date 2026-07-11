# Threat model

## Assets

- Birth date, time, coordinates, and timezone
- Commercial Swiss licence material, binaries, data, and private registry credentials
- Integrity and provenance of deterministic astronomical outputs
- Package and CI supply chain

## Trust boundaries

- Browser input → PWA runtime
- PWA/server consumer → canonical runtime validation
- Public domain packages → private `EphemerisProvider` adapter
- Repository/CI → package registry and deployment systems

## Primary threats and controls

| Threat                                            | Control                                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Birth input persisted, cached, or logged          | Session memory only; no storage APIs, analytics payloads, server logs, or query-string transport; privacy assertions                       |
| Restricted Swiss assets reach Git/browser/package | Private server-only adapter; ignored binary patterns; boundary tests; secret scan; package-content inspection before release               |
| Forged or stale astronomical output               | Runtime validation, deterministic ordering, provider/provenance metadata, generated-at and valid-for timestamps, explicit stale/offline UI |
| Malformed location/time input                     | Zod validation, finite coordinate bounds, IANA timezone validation, bounded date/event windows                                             |
| Dependency or workflow compromise                 | Exact lockfile, `npm ci`, high-severity audit, Dependabot, CodeQL, minimal workflow permissions, pinned major actions                      |
| Contract bypass through source imports            | Explicit package exports, ESLint restriction, foundation boundary tests                                                                    |
| Resource exhaustion from event searches           | Hard maximum windows, deterministic stepping/refinement limits, abort/error contracts                                                      |

## Out of scope for Public V1

Accounts, durable personal data, billing, public API/MCP authentication, and multi-tenant authorization. Introducing any of these requires a new threat-model review.
