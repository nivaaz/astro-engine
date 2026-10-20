import type { EphemerisProvider } from "@sukara/astro-schema";
import { uiFixtureProvider } from "./ui-fixture-provider";
import { resolveSwissEphemerisProvider } from "./private/swiss-provider";

export type ProviderResolver = () =>
  EphemerisProvider | null | Promise<EphemerisProvider | null>;

/**
 * Private deployments compose an authorized server-only adapter here.
 * The public repository deliberately fails closed and imports no adapter.
 */
export const resolveEphemerisProvider: ProviderResolver = () =>
  process.env["ASTRO_ENGINE_FIXTURE_MODE"] === "true" &&
  process.env["NODE_ENV"] !== "production"
    ? uiFixtureProvider()
    : process.env["ASTRO_ENGINE_PROVIDER"] === "swisseph"
      ? resolveSwissEphemerisProvider()
      : null;
