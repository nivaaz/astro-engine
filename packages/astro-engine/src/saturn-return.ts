import {
  FRAME_VERSION,
  SATURN_RETURN_ALGORITHM_VERSION,
  SCHEMA_VERSION,
  SESSION_PERSONAL_CLASSIFICATION,
  SaturnReturnRequestSchema,
  SaturnReturnResultSchema,
  type AstroResult,
  type EphemerisProvider,
  type PositionBatch,
  type ProviderCallOptions,
  type ProviderProvenance,
  type SaturnReturnPass,
  type SaturnReturnRequest,
  type SaturnReturnResult,
  type SaturnReturnWindow,
} from "@sukara/astro-schema";
import { semanticId, type SemanticHasher } from "./identity.js";
import {
  circularDistance,
  MILLISECONDS_PER_DAY,
  signedAngularDelta,
  unwrapNear,
  utcFromMilliseconds,
} from "./math.js";
import { provenanceMatches, requestPositions } from "./provider.js";
import { refineBracket } from "./refinement.js";

export const SATURN_SCAN_STEP_DAYS = 1;
export const MAX_SATURN_SPEED_DEGREES_PER_DAY = 0.2;
export const SATURN_EXACT_ANGULAR_TOLERANCE_DEGREES = 1e-7;
const SATURN_REFINEMENT_TOLERANCE_MILLISECONDS = 1_000;
const SATURN_MAX_REFINEMENT_ITERATIONS = 80;
const STATIONARY_SPEED_EPSILON = 1e-9;

export interface SaturnReturnOptions extends ProviderCallOptions {
  readonly hasher?: SemanticHasher;
}

interface Sample {
  readonly milliseconds: number;
  readonly residual: number;
  readonly speed: number;
}

interface WindowBoundary {
  readonly start: number;
  readonly end: number;
  readonly edge: SaturnReturnWindow["edge"];
}

async function calculateSaturnReturnInternal(
  provider: EphemerisProvider,
  input: SaturnReturnRequest,
  options?: SaturnReturnOptions,
): Promise<AstroResult<SaturnReturnResult>> {
  const request = SaturnReturnRequestSchema.safeParse(input);
  if (!request.success || request.data.orb <= 0) {
    return {
      ok: false,
      error: {
        code: "invalid-input",
        message: "Saturn return requires a valid request and a positive orb",
        retryable: false,
      },
    };
  }
  const data = request.data;
  const start = Date.parse(data.searchWindow.start);
  const end = Date.parse(data.searchWindow.end);
  const step = SATURN_SCAN_STEP_DAYS * MILLISECONDS_PER_DAY;
  const cache = new Map<number, PositionBatch>();
  let provenance: ProviderProvenance | undefined;

  async function batchAt(
    milliseconds: number,
  ): Promise<AstroResult<PositionBatch>> {
    const rounded = Math.round(milliseconds);
    const cached = cache.get(rounded);
    if (cached !== undefined) return { ok: true, value: cached };
    const result = await requestPositions(
      provider,
      utcFromMilliseconds(rounded),
      ["saturn"],
      options,
    );
    if (!result.ok) return result;
    if (
      provenance !== undefined &&
      !provenanceMatches(provenance, result.value.provenance)
    ) {
      return {
        ok: false,
        error: {
          code: "invalid-provider-output",
          message: "Saturn return samples must share one provider provenance",
          retryable: false,
        },
      };
    }
    provenance = result.value.provenance;
    cache.set(rounded, result.value);
    return result;
  }

  async function sampleAt(milliseconds: number): Promise<AstroResult<Sample>> {
    const batch = await batchAt(milliseconds);
    if (!batch.ok) return batch;
    const saturn = batch.value.positions[0];
    if (saturn === undefined || saturn.body !== "saturn") {
      return {
        ok: false,
        error: {
          code: "invalid-provider-output",
          message: "Provider omitted Saturn from a Saturn-only request",
          retryable: false,
        },
      };
    }
    if (Math.abs(saturn.longitudeSpeed) > MAX_SATURN_SPEED_DEGREES_PER_DAY) {
      return {
        ok: false,
        error: {
          code: "invalid-provider-output",
          message: "Saturn speed exceeds the bounded search contract",
          retryable: false,
        },
      };
    }
    return {
      ok: true,
      value: {
        milliseconds: Math.round(milliseconds),
        residual: signedAngularDelta(
          saturn.longitude - data.natalSaturnLongitude,
        ),
        speed: saturn.longitudeSpeed,
      },
    };
  }

  async function refineScalar(
    left: Sample,
    right: Sample,
    scalar: (sample: Sample) => number,
  ): Promise<AstroResult<number>> {
    return refineBracket(
      left.milliseconds,
      right.milliseconds,
      scalar(left),
      scalar(right),
      async (milliseconds) => {
        const sample = await sampleAt(milliseconds);
        return sample.ok ? { ok: true, value: scalar(sample.value) } : sample;
      },
      SATURN_REFINEMENT_TOLERANCE_MILLISECONDS,
      SATURN_MAX_REFINEMENT_ITERATIONS,
    );
  }

  const samples: Sample[] = [];
  for (let instant = start; instant < end; instant += step) {
    const sample = await sampleAt(instant);
    if (!sample.ok) return sample;
    samples.push(sample.value);
  }
  const finalSample = await sampleAt(end);
  if (!finalSample.ok) return finalSample;
  samples.push(finalSample.value);

  const boundaries: WindowBoundary[] = [];
  let openStart: number | undefined =
    Math.abs(samples[0]!.residual) <= data.orb ? start : undefined;
  let startsBeforeSearch = openStart !== undefined;
  for (let index = 0; index < samples.length - 1; index += 1) {
    const left = samples[index]!;
    const right = samples[index + 1]!;
    const leftInside = Math.abs(left.residual) <= data.orb;
    const rightInside = Math.abs(right.residual) <= data.orb;
    if (leftInside === rightInside) continue;
    const boundary = await refineScalar(
      left,
      right,
      (sample) => Math.abs(sample.residual) - data.orb,
    );
    if (!boundary.ok) return boundary;
    if (!leftInside) {
      openStart = boundary.value;
      startsBeforeSearch = false;
    } else if (openStart !== undefined) {
      boundaries.push({
        start: openStart,
        end: boundary.value,
        edge: startsBeforeSearch ? "starts-before-search" : "complete",
      });
      openStart = undefined;
    }
  }
  if (openStart !== undefined && openStart < end) {
    boundaries.push({
      start: openStart,
      end,
      edge: startsBeforeSearch ? "starts-before-search" : "ends-after-search",
    });
  }

  const exactPasses: Sample[] = [];
  for (let index = 0; index < samples.length - 1; index += 1) {
    const left = samples[index]!;
    const right = samples[index + 1]!;
    const rightContinuous =
      left.residual + signedAngularDelta(right.residual - left.residual);
    const crossing =
      left.residual !== rightContinuous &&
      Math.sign(left.residual) !== Math.sign(rightContinuous);
    if (crossing) {
      const exact = await refineBracket(
        left.milliseconds,
        right.milliseconds,
        left.residual,
        rightContinuous,
        async (milliseconds) => {
          const sample = await sampleAt(milliseconds);
          if (!sample.ok) return sample;
          const ratio =
            (milliseconds - left.milliseconds) /
            (right.milliseconds - left.milliseconds);
          const reference =
            left.residual + (rightContinuous - left.residual) * ratio;
          return {
            ok: true,
            value: unwrapNear(sample.value.residual, reference),
          };
        },
        SATURN_REFINEMENT_TOLERANCE_MILLISECONDS,
        SATURN_MAX_REFINEMENT_ITERATIONS,
      );
      if (!exact.ok) return exact;
      const sample = await sampleAt(exact.value);
      if (!sample.ok) return sample;
      if (
        exact.value >= start &&
        exact.value < end &&
        circularDistance(sample.value.residual, 0) <=
          SATURN_EXACT_ANGULAR_TOLERANCE_DEGREES &&
        !exactPasses.some(
          ({ milliseconds }) =>
            Math.abs(milliseconds - sample.value.milliseconds) <=
            SATURN_REFINEMENT_TOLERANCE_MILLISECONDS,
        )
      ) {
        exactPasses.push(sample.value);
      }
    }

    const bracketsStation =
      left.speed === 0 ||
      right.speed === 0 ||
      Math.sign(left.speed) !== Math.sign(right.speed);
    if (bracketsStation && left.speed !== right.speed) {
      const station = await refineScalar(left, right, (sample) => sample.speed);
      if (!station.ok) return station;
      const sample = await sampleAt(station.value);
      if (!sample.ok) return sample;
      if (
        station.value >= start &&
        station.value < end &&
        circularDistance(sample.value.residual, 0) <=
          SATURN_EXACT_ANGULAR_TOLERANCE_DEGREES &&
        !exactPasses.some(
          ({ milliseconds }) =>
            Math.abs(milliseconds - sample.value.milliseconds) <=
            SATURN_REFINEMENT_TOLERANCE_MILLISECONDS,
        )
      ) {
        exactPasses.push(sample.value);
      }
    }
  }
  exactPasses.sort((left, right) => left.milliseconds - right.milliseconds);

  const windows: SaturnReturnWindow[] = [];
  for (const boundary of boundaries) {
    const interval = {
      start: utcFromMilliseconds(boundary.start),
      end: utcFromMilliseconds(boundary.end),
    };
    const windowId = await semanticId(
      "sat_window_v1",
      {
        algorithmVersion: SATURN_RETURN_ALGORITHM_VERSION,
        natalSaturnLongitude: data.natalSaturnLongitude,
        interval,
      },
      options?.hasher,
    );
    const contained = exactPasses.filter(
      ({ milliseconds }) =>
        milliseconds >= boundary.start && milliseconds < boundary.end,
    );
    const passes: SaturnReturnPass[] = [];
    for (let index = 0; index < contained.length; index += 1) {
      const pass = contained[index]!;
      const exactAt = utcFromMilliseconds(pass.milliseconds);
      const direction =
        Math.abs(pass.speed) <= STATIONARY_SPEED_EPSILON
          ? "stationary"
          : pass.speed < 0
            ? "retrograde"
            : "direct";
      passes.push({
        id: await semanticId(
          "sat_pass_v1",
          {
            algorithmVersion: SATURN_RETURN_ALGORITHM_VERSION,
            natalSaturnLongitude: data.natalSaturnLongitude,
            exactAt,
            direction,
          },
          options?.hasher,
        ),
        sequence: index + 1,
        exactAt,
        direction,
        windowId,
      });
    }
    windows.push({ id: windowId, interval, edge: boundary.edge, passes });
  }

  const asOf = Date.parse(data.asOf);
  const active = windows.find(
    ({ interval }) =>
      asOf >= Date.parse(interval.start) && asOf < Date.parse(interval.end),
  );
  const upcoming = windows.find(
    ({ interval }) => asOf < Date.parse(interval.start),
  );
  const status = active
    ? "active"
    : upcoming
      ? "upcoming"
      : windows.length > 0
        ? "complete"
        : "none-in-range";
  const statusWindowId =
    active?.id ?? upcoming?.id ?? windows.at(-1)?.id ?? null;
  if (provenance === undefined) {
    return {
      ok: false,
      error: {
        code: "internal-failure",
        message: "Saturn return search produced no provider provenance",
        retryable: false,
      },
    };
  }
  const result = SaturnReturnResultSchema.safeParse({
    metadata: {
      schemaVersion: SCHEMA_VERSION,
      algorithmVersion: SATURN_RETURN_ALGORITHM_VERSION,
      calculatedAt: data.asOf,
      zodiac: "tropical",
      frame: FRAME_VERSION,
      validFor: data.searchWindow,
      provenance,
    },
    algorithmVersion: SATURN_RETURN_ALGORITHM_VERSION,
    classification: SESSION_PERSONAL_CLASSIFICATION,
    natalSaturnLongitude: data.natalSaturnLongitude,
    orb: data.orb,
    asOf: data.asOf,
    status,
    statusWindowId,
    windows,
  });
  return result.success
    ? { ok: true, value: result.data }
    : {
        ok: false,
        error: {
          code: "internal-failure",
          message: "Engine could not construct canonical Saturn return output",
          retryable: false,
        },
      };
}

export async function calculateSaturnReturn(
  provider: EphemerisProvider,
  input: SaturnReturnRequest,
  options?: SaturnReturnOptions,
): Promise<AstroResult<SaturnReturnResult>> {
  try {
    return await calculateSaturnReturnInternal(provider, input, options);
  } catch {
    return options?.signal?.aborted
      ? {
          ok: false,
          error: {
            code: "aborted",
            message: "Saturn return search was aborted",
            retryable: false,
          },
        }
      : {
          ok: false,
          error: {
            code: "internal-failure",
            message:
              "Saturn return search failed before producing canonical output",
            retryable: false,
          },
        };
  }
}
