import { NextResponse } from "next/server";
import { UtcInstantSchema, type AstroError } from "@sukara/astro-schema";
import {
  executeAstroOperation,
  unavailableError,
  type AstroOperationValue,
} from "./astro-service";
import type { ProviderResolver } from "./provider-resolver";

export interface AstroRouteEnvelope {
  readonly ok: true;
  readonly operation: string;
  readonly value: AstroOperationValue;
}

export interface AstroRouteErrorEnvelope {
  readonly ok: false;
  readonly error: AstroError;
}

const headers = {
  "Cache-Control": "no-store, max-age=0",
  "X-Astro-Data-Mode": "provider",
} as const;

function failureStatus(error: AstroError): number {
  if (error.code === "invalid-input") return 400;
  if (error.code === "provider-unavailable") return 503;
  if (error.code === "unsupported-range") return 422;
  if (error.code === "unsupported-capability") return 422;
  if (error.code === "aborted") return 408;
  return 502;
}

function unavailable(): NextResponse<AstroRouteErrorEnvelope> {
  return NextResponse.json(
    { ok: false, error: unavailableError() },
    {
      status: 503,
      headers: { ...headers, "X-Astro-Data-Mode": "unavailable" },
    },
  );
}

export function createAstroRouteHandlers(
  resolveProvider: ProviderResolver,
  now: () => Date = () => new Date(),
) {
  async function dispatch(input: unknown) {
    let provider;
    try {
      provider = await resolveProvider();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "internal-failure",
            message: "The astronomy provider could not be initialized.",
            retryable: false,
          },
        } satisfies AstroRouteErrorEnvelope,
        { status: 502, headers },
      );
    }
    if (provider === null) return unavailable();
    const result = await executeAstroOperation(provider, input);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error } satisfies AstroRouteErrorEnvelope,
        { status: failureStatus(result.error), headers },
      );
    }
    const operation =
      typeof input === "object" && input !== null && "operation" in input
        ? String(input.operation)
        : "unknown";
    return NextResponse.json(
      { ok: true, operation, value: result.value } satisfies AstroRouteEnvelope,
      { headers },
    );
  }

  return {
    GET: () =>
      dispatch({
        operation: "current-sky",
        instant: UtcInstantSchema.parse(now().toISOString()),
      }),
    POST: async (request: Request) => {
      let input: unknown;
      try {
        input = await request.json();
      } catch {
        input = null;
      }
      return dispatch(input);
    },
  };
}
