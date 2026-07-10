# Licensing

## Overview

Astro Engine uses a dual-licensing model because of a key dependency: Swiss Ephemeris.

---

## Package Licenses

| Component | License | Reason |
|-----------|---------|--------|
| All non-ephemeris packages | MIT | Maximise adoption and reuse |
| `packages/ephemeris` | AGPL | Swiss Ephemeris requirement |
| Documentation | CC BY 4.0 | Shareable with attribution |

---

## The Swiss Ephemeris Question

Swiss Ephemeris uses a dual-licensing model:

1. **AGPL** — Free to use, but the entire project using it must be AGPL-compatible
2. **Professional Licence** — Paid licence from Astrodienst, allows proprietary hosting

### Option A: AGPL (Current Default)

**Advantages:**
- Philosophically aligned with open-source mission
- Strong community credibility
- No licensing cost
- Hosted competitors using modified versions must share source

**Disadvantages:**
- Harder to offer a permissive MIT-style SDK
- Some companies avoid AGPL dependencies entirely
- Requires careful repository and deployment compliance
- Must ensure all AGPL-incompatible code is isolated

### Option B: Professional Swiss Ephemeris Licence

**Advantages:**
- More flexibility for proprietary hosted products
- Easier commercial integrations
- Cleaner option for Mirror Mindset and future products
- MIT licensing possible across the board

**Disadvantages:**
- Licensing cost (contact Astrodienst for pricing)
- Less ideologically pure as an entirely open stack
- Terms need professional legal review

---

## Decision Status

**Current default:** AGPL for the ephemeris package, MIT for everything else.

**This decision must be resolved before v1.0 public launch.**

### Mitigation Strategy

The ephemeris package is architecturally isolated:

```
packages/ephemeris/     ← AGPL (Swiss Ephemeris bindings)
packages/astro-domain/  ← MIT (calls ephemeris but doesn't embed it)
packages/astro-schema/  ← MIT (pure types, no ephemeris dependency)
```

The ephemeris package exposes a clean interface. Downstream packages depend on the interface, not the implementation. This makes it possible to:
1. Swap in a different ephemeris backend
2. Offer a commercial licence path alongside AGPL
3. Let self-hosters choose their own licence compliance

---

## Open-Core Model

The project follows an open-core approach:

**Open (MIT/AGPL):**
- Computation interfaces and event schemas
- Aspect detection and event classification
- Formatters and calendar generation
- UI components
- Basic MCP server
- Documentation, skills, starter repos

**Paid/Hosted:**
- Managed computation infrastructure
- Saved charts and private data
- OAuth, calendar feeds, alerts
- MCP authentication and usage limits
- Hosted API with SLA

People aren't paying for secret calculations. They're paying because they don't want to host, secure, update, and operate the celestial infrastructure themselves.

---

## Action Items

- [ ] Contact Astrodienst for Professional Licence pricing
- [ ] Legal review of AGPL compliance boundaries
- [ ] Confirm ephemeris package isolation is complete
- [ ] Add licence headers to all source files
- [ ] Create LICENCE file at repo root
- [ ] Document self-hosting compliance requirements
