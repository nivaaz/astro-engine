# Vercel deployment

The `astro-engine` Vercel project is configured as a monorepo deployment:

- Root Directory: `apps/web`
- Framework preset: Next.js
- Install command: `npm ci --engine-strict=false`
- Build command (provider-enabled preview): `cd ../.. && npm run private:ephemeris && npx turbo run build --filter=@sukara/astro-web`
- Output directory: framework default (`.next`)
- Runtime: Node.js (the app must not be deployed to Edge while the private provider is server-only)

The repository intentionally has no root `vercel.json`. Root-level `.next` copying is not part of the deployment contract; project settings own the Vercel build configuration.

Preview protection remains enabled. A provider-enabled preview may receive only the two manifest-verified ephemeris files at build time; Swiss source, licence files, credentials, and public package artifacts remain excluded. Production promotion and package publication remain explicit owner actions.
