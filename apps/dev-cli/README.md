# Developer smoke CLI

Private, local-only smoke consumer. It validates and formats a built-in canonical fixture, a JSON file, or stdin. It performs no astronomical calculation and makes no network requests.

```sh
npm run build --workspace @sukara/dev-cli
npm run smoke --workspace @sukara/dev-cli -- --format markdown
node apps/dev-cli/dist/index.js --format json ./canonical-output.json
cat canonical-output.json | node apps/dev-cli/dist/index.js --format text -
```
