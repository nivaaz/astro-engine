# Contributing

Use Node 24.18.0 and npm 11.16.x.

```bash
nvm use
npm ci
npm run verify
```

Read `AGENTS.md`, the protected contracts, test strategy, and active plan before implementation. Use conventional commits and keep one logical change per commit. Protected-contract and computation changes require fixtures, full verification, and independent review.

Do not contribute interpretations, restricted Swiss assets, credentials, or direct cross-workspace source imports.
