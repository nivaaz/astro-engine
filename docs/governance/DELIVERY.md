# Delivery governance

## Task classes

| Class | Typical work                                                                  | Required control                                     |
| ----- | ----------------------------------------------------------------------------- | ---------------------------------------------------- |
| T0    | Copy or docs with no contract change                                          | Targeted check                                       |
| T1    | Bounded implementation within an existing contract                            | Targeted tests + full verification                   |
| T2    | Public contract, computation, privacy, dependency, or workflow change         | Active plan + independent review + full verification |
| T3    | Licence, secret, publication, deployment, destructive data, or external spend | T2 controls + explicit owner authority               |

## Risk tiers

| Tier     | Examples                                                                      | Evidence                                                          |
| -------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Low      | Internal docs, non-behavioral cleanup                                         | Diff review                                                       |
| Medium   | UI interaction, formatter output, build tooling                               | Targeted test + `npm run verify`                                  |
| High     | Schema/provider contract, astronomical algorithm, personal data, supply chain | Reference fixtures, boundary tests, full gate, independent review |
| Critical | Licence boundary, public release, secrets, destructive actions                | Explicit owner approval and recorded decision                     |

## Stage flow

`Not started → In progress → In review → Shipped`, with `Blocked` used only when an external dependency prevents safe progress.

Each stage ends with:

1. Targeted acceptance checks.
2. `npm run verify` and any applicable Playwright/security checks.
3. Self-review of diff, contracts, privacy, and licensing.
4. One logical conventional commit.
5. Notion evidence: command, result, commit, blocker, residual risk, shipped time.

Plans live in `docs/plans/`; only plans listed by `docs/plans/README.md` are active. Completed plans move to `docs/archive/plans/`.
