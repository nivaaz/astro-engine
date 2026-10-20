# Repository map

## Active foundation

```text
apps/web/                    private Next.js PWA consumer
docs/                        contracts, architecture, governance, security, tests, plans, status
tests/foundation/            repository and licensing boundary assertions
tests/e2e/                   desktop/mobile critical smoke
.github/                     CI and supply-chain controls
```

## Public V1 target

```text
packages/astro-schema/       @sukara/astro-schema: canonical Zod schemas and provider contracts
packages/astro-engine/       @sukara/astro-engine: deterministic tropical/Whole Sign domain
packages/astro-formatters/   @sukara/astro-formatters: canonical JSON, Markdown, and prompt text
packages/human-design/       @sukara/human-design: transit gate/line mapping only
apps/dev-cli/                private smoke consumer; not a published product
apps/web/                    no-account PWA using package exports
```

Packages are introduced only with real contracts, implementation, tests, and explicit exports. Deferred SDK, calendar, MCP, UI library, services, and public CLI packages stay outside the active workspace.

Dependency direction:

```text
astro-schema ← astro-engine ← astro-formatters
           ↖ human-design

apps/web and apps/dev-cli consume package exports only.
```
