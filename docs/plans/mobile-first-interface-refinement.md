# Mobile-first interface refinement

- Status: Approved for local implementation
- Task class: T2; medium product and accessibility risk
- Source: Interface Craft critique of `/`, `/events`, and `/saturn-return` at 390 × 844, with desktop comparison at 1440 × 900
- Current decision: preserve the distinctive editorial visual language and all canonical computation/privacy contracts while making the mobile product substantially easier to navigate, scan, and act on
- Next action: implement in an isolated worktree from `codex/public-v1-refinements`, then complete screenshot-backed mobile acceptance review

## Audit baseline

- Overall mobile experience: `7.3 / 10`
- Visual taste and point of view are the strongest attributes.
- Navigation, first-task clarity, progressive disclosure, section pacing, and touch ergonomics are below the release-quality bar.
- At 390px, the home route is 5,636px tall; `Current sky` begins at approximately 1,883px and its section occupies approximately 1,667px.
- Mobile hides the complete primary navigation while leaving GitHub visible.
- Event copy actions render at approximately 34px high; several links and inputs are also below a 44px minimum touch target.
- The events hero leads with implementation language and delays the first useful event content.
- The Saturn-return flow sets expectations and privacy well, but critical supporting copy is too small and native validation lacks a designed inline error state.

## Product outcomes

1. A mobile user can move between Sky, Events, and Saturn return from every route without scrolling to the footer.
2. The current sky becomes the first substantive home task after the hero/status, with local structure presented as an optional contextual layer.
3. Core factual data remains complete while repetitive vertical presentation is materially compressed.
4. Hero and helper copy explain user value first; canonical methodology remains available without dominating the first screen.
5. Every interactive target is comfortably usable at 390px and keyboard/focus behavior remains explicit.
6. The interface still feels unmistakably like Astro Engine: near-black field, paper text, restrained gold, editorial serif hierarchy, fine rules, and no interpretation language.

## Non-negotiables

- Do not change canonical engine, provider, schema, formatter, event, Saturn-return, or Human Design results.
- Keep tropical + Whole Sign behavior, deterministic outputs, and compute-on-explicit-copy boundaries.
- Birth and location inputs remain client-memory-only and absent from URLs, browser storage, logs, analytics, and service-worker caches.
- Keep `/api/**` out of service-worker caching and preserve `no-store` responses.
- Keep Swiss provider code and assets private/server-only; fail closed when unavailable.
- Do not add interpretation, advice, accounts, persistence, analytics, third-party geocoding, public API/MCP, calendar subscriptions, deployment, publication, push, PR, or licence-policy changes.
- Reuse existing components and visual tokens before introducing new shared primitives.

## Implementation scope

### 1. Restore mobile wayfinding

- Add a persistent mobile route control for `Sky`, `Events`, and `Saturn`.
- Show an unambiguous active state using `aria-current`, color, and a non-color cue.
- Keep desktop navigation unchanged unless a small shared-component extraction improves consistency.
- Move GitHub to a secondary position on mobile if required to keep the route control clear.
- Respect safe-area insets and ensure fixed/sticky UI never obscures content, focus rings, messages, or footer links.

Acceptance:

- All three routes are reachable in one tap from every page at 390px.
- Each route target is at least 44 × 44px.
- Keyboard order matches visual order and the active route is announced.

### 2. Reorder and compress the home journey

- Preserve the hero’s editorial character, but reduce its mobile height and ornamental dominance.
- Add a clear anchor action to the current sky.
- Reorder the mobile narrative to: hero/status → current sky → local context → upcoming events → Saturn return → Human Design → footer.
- Renumber section indices to match the rendered order.
- Replace ten tall mobile planet cards with a compact, legible row treatment that preserves every position, sign, longitude, and retrograde state.
- Tighten excessive gaps between coordinates, aspects, events, and personal tools.

Acceptance:

- At 390 × 844, the `Current sky` heading begins no lower than 1,250px after fixture/provider data has loaded.
- The home route is at least 20% shorter than the 5,636px baseline without removing canonical data.
- No text truncation, horizontal scrolling, hidden values, or loss of position/aspect information.

### 3. Clarify local context through progressive disclosure

- Lead with the supported-city input and a secondary `Use my location` action.
- Move latitude, longitude, and timezone into an explicit advanced/details disclosure after a city resolves.
- Give the calculation one clear primary action and explain its result in plain language.
- Keep manual coordinates available for locations outside the bundled dataset.

Acceptance:

- A supported city can be selected and calculated without reading or editing coordinates.
- Manual latitude, longitude, and IANA timezone remain reachable and fully validated.
- No third-party lookup request is introduced.

### 4. Make route copy user-first

- Remove visible `Public V1` launch-language from hero eyebrows.
- On `/events`, replace canonical-contract language in the hero with a concise explanation of what is shown and whose timezone is used.
- Move filter/methodology details—Moon-aspect exclusions, quarter-lunation exclusions, and deferred eclipse computation—into a secondary `About this feed` disclosure.
- On `/saturn-return`, explain the task in one compact sentence, while retaining `dates only; no interpretation` and session-only privacy expectations.
- Keep developer/build context in the footer or a secondary route, not ahead of the primary task.

Acceptance:

- Each route hero fits comfortably in the first mobile viewport with the start of the next meaningful section visible or immediately discoverable.
- Copy remains factual and makes no interpretive, predictive, or accuracy claim beyond verified contracts.

### 5. Rebalance repeated event actions

- Preserve one copy action per event/pass, but reduce its visual competition with the event itself.
- Use the filled-gold treatment only for the page’s primary action; use a quieter button treatment for repeated copy controls.
- Keep visible success/failure feedback adjacent to the triggering action without layout-breaking shifts.

Acceptance:

- Every copy action is at least 44px high, keyboard reachable, and retains the accessible name `Copy chart for AI`.
- Clipboard success and failure remain announced.
- Event name, time, type, and date remain visually stronger than its copy action.

### 6. Refine the Saturn-return form

- Increase input, button, privacy, precision, and error-copy legibility on mobile.
- Add designed inline validation for missing date and unsupported city while retaining native semantics.
- Keep the optional-time/noon approximation notice visible before submission and repeated in results when used.
- Keep the offline major-city dataset and explicit selection behavior.

Acceptance:

- Form controls are at least 48px high; supporting and privacy copy is at least 14px with a readable line height.
- Errors are specific, focus is moved or linked to the first invalid field, and messages are announced once.
- Date + supported city works with and without local birth time; refresh clears all inputs.

### 7. Finish the lower-page rhythm

- Present Sun, Earth, and Moon Human Design transit values as a balanced three-item mobile group rather than an incomplete 2 × 2 grid.
- Add one concise factual sentence that names the three displayed bodies and clarifies `gate.line`.
- Standardize section spacing so route sections feel intentional rather than uniformly oversized.
- Preserve the restrained border-led visual language; do not add decorative cards, gradients, or motion without a user-purpose.

Acceptance:

- The Human Design group has no visually empty quadrant at 390px.
- Section spacing uses a small named scale and remains coherent at 390px, 768px, and 1440px.

### 8. Close accessibility and responsive gaps

- Enforce minimum touch targets for header, footer, route navigation, buttons, inputs, and copy actions.
- Preserve visible focus treatment and reduced-motion behavior.
- Verify text contrast for paper, muted, gold, red, and green states on their actual backgrounds.
- Remove any mobile-only overflow masking that could hide a real layout defect; keep zero horizontal overflow through correct sizing.
- Confirm loading, fixture, current, stale, offline, empty, unavailable, error, copy-success, and copy-failure states.

Acceptance:

- No interactive target is below 44 × 44px at 390px.
- No horizontal overflow at 320px, 390px, 768px, or 1440px.
- Headings remain sequential; form labels, status regions, and `aria-current` remain correct.
- The three page-top mobile screenshots and representative below-fold screenshots pass visual review without clipped text, obscured content, or accidental empty space.

## Execution order

1. Extract a shared site header/mobile route control and add route-level active-state tests.
2. Apply mobile spacing and touch-target tokens.
3. Reorder/compress the home presentation without changing data contracts.
4. Refine local-context disclosure and compact position rows.
5. Shorten route copy and add the events methodology disclosure.
6. Rebalance repeated copy controls and Saturn validation/typography.
7. Finish Human Design layout and footer consistency.
8. Run contract, accessibility, responsive, performance, and screenshot acceptance gates.

## Required evidence

- Focused component/helper tests for route control, disclosure, validation, and unchanged presentation data.
- Playwright coverage at 320 × 720, 390 × 844, 768 × 1024, and 1440 × 900.
- Mobile full-journey screenshots for `/`, `/events`, and `/saturn-return`, plus Saturn result, empty/unavailable, offline, and copy feedback states.
- `npm run format:check`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run test:e2e`
- `npm run performance:web`
- `npm run audit:dependencies`
- Canonical package dry-run/boundary checks represented by the existing verification workflow
- `git diff --check`

## Completion gate

- All sub-8 audit dimensions reach at least `8 / 10` in a second Interface Craft review.
- The final review explicitly separates screenshot evidence from code/test evidence.
- Any provider-enabled Swiss validation blocker is reported as an environment gate; no restricted asset or fallback is added.
- Implementation is committed locally with conventional commits.

## External gates

Production deployment, package publication, push, PR creation, hosted provider validation, and any public Swiss asset distribution remain unauthorized.
