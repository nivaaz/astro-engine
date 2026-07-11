import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@astro-engine/schema",
    "@astro-engine/ephemeris",
    "@astro-engine/astro-domain",
    "@astro-engine/astro-events",
    "@astro-engine/astro-formatters",
    "@astro-engine/astro-ui",
  ],
};

export default nextConfig;
