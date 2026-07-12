import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveEphemerisProvider } from "../provider-resolver";

describe("public provider resolver gate", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("fails closed in production even when fixture mode is requested", () => {
    vi.stubEnv("ASTRO_ENGINE_FIXTURE_MODE", "true");
    vi.stubEnv("NODE_ENV", "production");
    expect(resolveEphemerisProvider()).toBeNull();
  });

  it("allows only the explicitly labelled non-production fixture", () => {
    vi.stubEnv("ASTRO_ENGINE_FIXTURE_MODE", "true");
    vi.stubEnv("NODE_ENV", "test");
    expect(resolveEphemerisProvider()).toMatchObject({
      capabilities: { positions: true },
    });
  });
});
