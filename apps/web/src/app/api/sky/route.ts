import { NextResponse } from "next/server";
import { fixtureSky } from "../../../lib/fixture-sky";
import type {
  SkyTransportError,
  SkyTransportResponse,
} from "../../../lib/sky-transport";

export const dynamic = "force-dynamic";

export function GET(): NextResponse<SkyTransportResponse | SkyTransportError> {
  if (
    process.env["ASTRO_ENGINE_FIXTURE_MODE"] === "true" &&
    process.env["NODE_ENV"] !== "production"
  ) {
    return NextResponse.json(fixtureSky(), {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Astro-Data-Mode": "fixture",
      },
    });
  }

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "provider-unavailable",
        message: "The licensed ephemeris provider is not configured.",
        retryable: false,
      },
    },
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Astro-Data-Mode": "unavailable",
      },
    },
  );
}
