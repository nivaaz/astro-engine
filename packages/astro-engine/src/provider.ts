import {
  EPHEMERIS_BODY_ORDER,
  LocalAnglesSchema,
  ProviderCapabilitiesSchema,
  validatePositionBatch,
  type AnglesRequest,
  type AstroError,
  type AstroResult,
  type EphemerisBody,
  type EphemerisProvider,
  type LocalAngles,
  type PositionBatch,
  type ProviderCallOptions,
  type ProviderProvenance,
  type UtcInstant,
} from "@sukara/astro-schema";

const INVALID_PROVIDER_OUTPUT: AstroError = {
  code: "invalid-provider-output",
  message: "Provider returned output that violates the requested contract",
  retryable: false,
};

const MAX_ABSOLUTE_LONGITUDE_SPEED: Readonly<Record<EphemerisBody, number>> = {
  sun: 2,
  moon: 20,
  mercury: 10,
  venus: 5,
  mars: 2,
  jupiter: 1,
  saturn: 0.2,
  uranus: 0.1,
  neptune: 0.1,
  pluto: 0.1,
  // Swiss true-node motion can exceed 0.2 deg/day near its fastest motion.
  "true-north-node": 0.3,
};

function runtimeFailure(options?: ProviderCallOptions): AstroResult<never> {
  return options?.signal?.aborted
    ? {
        ok: false,
        error: {
          code: "aborted",
          message: "Ephemeris request was aborted",
          retryable: false,
        },
      }
    : {
        ok: false,
        error: {
          code: "provider-unavailable",
          message: "Ephemeris provider failed before returning a result",
          retryable: true,
        },
      };
}

function validateProviderRequest(
  provider: EphemerisProvider,
  instant: UtcInstant,
  options?: ProviderCallOptions,
): AstroResult<ReturnType<typeof ProviderCapabilitiesSchema.parse>> {
  if (options?.signal?.aborted) return runtimeFailure(options);
  const capabilities = ProviderCapabilitiesSchema.safeParse(
    provider.capabilities,
  );
  if (!capabilities.success || !capabilities.data.positions) {
    return { ok: false, error: INVALID_PROVIDER_OUTPUT };
  }
  const time = Date.parse(instant);
  if (
    time < Date.parse(capabilities.data.supportedRange.start) ||
    time >= Date.parse(capabilities.data.supportedRange.end)
  ) {
    return {
      ok: false,
      error: {
        code: "unsupported-range",
        message: "Requested instant is outside the provider range",
        retryable: false,
      },
    };
  }
  return { ok: true, value: capabilities.data };
}

function sameProvenance(
  left: ProviderProvenance,
  right: ProviderProvenance,
): boolean {
  return (
    left.providerId === right.providerId &&
    left.providerVersion === right.providerVersion &&
    left.dataVersion === right.dataVersion &&
    left.quality === right.quality
  );
}

export async function requestPositions(
  provider: EphemerisProvider,
  instant: UtcInstant,
  bodies: readonly EphemerisBody[],
  options?: ProviderCallOptions,
): Promise<AstroResult<PositionBatch>> {
  const capabilityResult = validateProviderRequest(provider, instant, options);
  if (!capabilityResult.ok) return capabilityResult;
  const ordered = [...bodies].sort(
    (a, b) => EPHEMERIS_BODY_ORDER.indexOf(a) - EPHEMERIS_BODY_ORDER.indexOf(b),
  );
  const chunks: EphemerisBody[][] = [];
  const size = capabilityResult.value.maxBodiesPerRequest;
  for (let index = 0; index < ordered.length; index += size) {
    chunks.push(ordered.slice(index, index + size));
  }

  const batches: PositionBatch[] = [];
  for (const chunk of chunks) {
    const request = { instant, bodies: chunk } as const;
    let result: AstroResult<PositionBatch>;
    try {
      result = await provider.getPositions(request, options);
    } catch {
      return runtimeFailure(options);
    }
    if (!result.ok) return result;
    const validated = validatePositionBatch(request, result.value);
    if (!validated.ok) return validated;
    if (
      validated.value.positions.some(
        ({ body, longitudeSpeed }) =>
          Math.abs(longitudeSpeed) > MAX_ABSOLUTE_LONGITUDE_SPEED[body],
      )
    ) {
      return { ok: false, error: INVALID_PROVIDER_OUTPUT };
    }
    batches.push(validated.value);
  }

  const first = batches[0];
  if (
    first === undefined ||
    batches.some(
      ({ provenance }) => !sameProvenance(first.provenance, provenance),
    )
  ) {
    return { ok: false, error: INVALID_PROVIDER_OUTPUT };
  }

  return {
    ok: true,
    value: {
      instant,
      positions: batches.flatMap(({ positions }) => positions),
      provenance: first.provenance,
    },
  };
}

export async function requestLocalAngles(
  provider: EphemerisProvider,
  request: AnglesRequest,
  options?: ProviderCallOptions,
): Promise<AstroResult<LocalAngles>> {
  const capabilityResult = validateProviderRequest(
    provider,
    request.instant,
    options,
  );
  if (!capabilityResult.ok) return capabilityResult;
  if (!capabilityResult.value.angles) {
    return {
      ok: false,
      error: {
        code: "unsupported-capability",
        message: "Provider does not support local angles",
        retryable: false,
      },
    };
  }
  let result: AstroResult<LocalAngles>;
  try {
    result = await provider.getLocalAngles(request, options);
  } catch {
    return runtimeFailure(options);
  }
  if (!result.ok) return result;
  const parsed = LocalAnglesSchema.safeParse(result.value);
  if (
    !parsed.success ||
    parsed.data.instant !== request.instant ||
    parsed.data.location.latitude !== request.location.latitude ||
    parsed.data.location.longitude !== request.location.longitude ||
    parsed.data.location.timezone !== request.location.timezone
  ) {
    return { ok: false, error: INVALID_PROVIDER_OUTPUT };
  }
  return { ok: true, value: parsed.data };
}

export function provenanceMatches(
  left: ProviderProvenance,
  right: ProviderProvenance,
): boolean {
  return sameProvenance(left, right);
}
