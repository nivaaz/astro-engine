import { NextResponse } from "next/server";
import { fixtureSky } from "../../../lib/fixture-sky";
import type {
  SkyTransportError,
  SkyTransportResponse,
} from "../../../lib/sky-transport";
import { resolveEphemerisProvider } from "../../../server/provider-resolver";
import { createAstroRouteHandlers } from "../../../server/route-factory";

export const dynamic = "force-dynamic";

const providerHandlers = createAstroRouteHandlers(resolveEphemerisProvider);

export function GET():
  | NextResponse<SkyTransportResponse | SkyTransportError>
  | Promise<NextResponse> {
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

  return providerHandlers.GET();
}

export const POST = providerHandlers.POST;
