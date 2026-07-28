# Public V1 refinements

- Status: Locally complete — commit `7f68e65`; provider/release gates remain external
- Task class: T2; high risk for formatter, privacy, and route contracts
- Source: [canonical Notion execution plan](https://app.notion.com/p/3ab4ba857af7814195dcfd3e1fa35f62) and linked delivery tickets
- Current decision: preserve canonical engine/provider/schema results; add validated presentation projections, semantic routes, and one reusable AI-copy action
- Next action: owner review of the local evidence; no deployment, publication, push, or PR is authorized by this plan

## Scope

1. Filter Moon aspects and quarter lunations from event views; group by selected/browser local date; preview two populated dates; add `/events`.
2. Add `/saturn-return` with date + supported city, optional local time defaulting to disclosed noon, bounded active/next-cycle search, readable windows/passes, and per-pass copy.
3. Use one primary `Copy chart for AI` action for current sky, event/lunation, and Saturn-pass contexts. Keep programmatic JSON/Markdown exports; format all angles to nearest arcminute with carry/wrap correctness.
4. Add stable metadata, structured data, sitemap/robots, and concise `llms.txt` guidance without introducing public API/MCP or interpretation claims.

## Non-negotiables

- Tropical + Whole Sign; deterministic computation and compute-on-explicit-copy for event/pass charts.
- No duplicated schema types; runtime validation and fail-closed server routes.
- Birth inputs remain client-memory-only and out of URLs, storage, logs, and service-worker cache; responses remain `no-store`.
- Swiss provider remains private/server-only; public packages remain provider-neutral and clean of restricted assets.
- Deferred: accounts, saved data, subscriptions/calendar, other returns, sidereal/Vedic, eclipse computation, public API/MCP, deployment, publication, push, PR, and licence-policy changes.

## Done criteria

- Focused helper/formatter/route tests and desktop + 390px mobile Playwright evidence cover grouped events, empty/error/provider states, Saturn multiple passes and optional-time disclosure, copy seam/content, and keyboard/focus behavior.
- `npm run verify`, `npm run test:e2e`, production/package/import/budget/dependency checks represented by existing scripts, and `git diff --check` pass or have concrete blockers recorded.
- Final diff is reviewed for protected-contract drift, privacy, server/browser Swiss separation, licensing text, and unintended scope; completed work is committed with conventional commits.

## External gates

Production deployment, package publication, push, PR creation, and any public Swiss asset distribution remain unauthorized.
