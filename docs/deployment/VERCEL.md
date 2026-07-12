# Vercel deployment

The `astro-engine` Vercel project is configured as a monorepo deployment:

- Root Directory: `apps/web`
- Framework preset: Next.js
- Install command: `npm ci --engine-strict=false`
- Build command: `cd ../.. && npx turbo run build --filter=@sukara/astro-web`
- Output directory: framework default (`.next`)
- Runtime: Node.js (the app must not be deployed to Edge while the private provider is server-only)

The repository intentionally has no root `vercel.json`. Root-level `.next` copying is not part of the deployment contract; project settings own the Vercel build configuration.

Preview protection remains enabled. The preview is provider-neutral and must not receive Swiss source, data, binaries, licence files, or private registry credentials. Add those only through the private-provider activation runbook after validating the signed terms and owner-approved release scope.
