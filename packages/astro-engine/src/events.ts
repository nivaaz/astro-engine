import {
  ASPECT_ANGLES,
  EVENT_ALGORITHM_VERSION,
  EVENT_SEARCH_LIMITS,
  EPHEMERIS_BODY_ORDER,
  EventSearchRequestSchema,
  EventSearchResultSchema,
  FRAME_VERSION,
  SCHEMA_VERSION,
  ZODIAC_SIGN_ORDER,
  type AspectType,
  type AstroResult,
  type EphemerisBody,
  type EphemerisProvider,
  type EventSearchRequest,
  type EventSearchResult,
  type MajorEvent,
  type PositionBatch,
  type ProviderCallOptions,
  type ProviderProvenance,
  type RawPlanetPosition,
} from "@sukara/astro-schema";
import { semanticId, type SemanticHasher } from "./identity.js";
import {
  circularDistance,
  MILLISECONDS_PER_HOUR,
  normalizeDegrees,
  signedAngularDelta,
  unwrapNear,
  utcFromMilliseconds,
} from "./math.js";
import { provenanceMatches, requestPositions } from "./provider.js";
import { refineBracket } from "./refinement.js";

export interface EventSearchOptions extends ProviderCallOptions {
  readonly hasher?: SemanticHasher;
}

type WithoutEventIdentity<T> = T extends unknown
  ? Omit<T, "id" | "exactAt">
  : never;
type EventFields = WithoutEventIdentity<MajorEvent>;

export const EVENT_EXACT_ANGULAR_TOLERANCE_DEGREES = 0.001;
export const STATION_SPEED_TOLERANCE_DEGREES_PER_DAY = 1e-6;

const SLOW_BODIES = new Set<EphemerisBody>([
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
]);
const MAJOR_INGRESS_BODIES = new Set<EphemerisBody>([
  "saturn",
  "uranus",
  "neptune",
  "pluto",
]);

function targetsBetween(
  left: number,
  right: number,
  bases: readonly number[],
): number[] {
  const minimum = Math.min(left, right);
  const maximum = Math.max(left, right);
  const targets: number[] = [];
  for (const base of bases) {
    const first = Math.ceil((minimum - base) / 360);
    const last = Math.floor((maximum - base) / 360);
    for (let cycle = first; cycle <= last; cycle += 1) {
      const target = base + cycle * 360;
      if (target >= minimum && target <= maximum) targets.push(target);
    }
  }
  return [...new Set(targets)].sort((a, b) => a - b);
}

function position(
  batch: PositionBatch,
  body: EphemerisBody,
): RawPlanetPosition {
  const found = batch.positions.find((candidate) => candidate.body === body);
  if (found === undefined) throw new Error(`Missing requested body: ${body}`);
  return found;
}

function aspectSignificance(
  bodyA: EphemerisBody,
  bodyB: EphemerisBody,
): "notable" | "major" {
  return SLOW_BODIES.has(bodyA) && SLOW_BODIES.has(bodyB) ? "major" : "notable";
}

async function searchUpcomingMajorEventsInternal(
  provider: EphemerisProvider,
  input: EventSearchRequest,
  options?: EventSearchOptions,
): Promise<AstroResult<EventSearchResult>> {
  const request = EventSearchRequestSchema.safeParse(input);
  if (!request.success) {
    return {
      ok: false,
      error: {
        code: "invalid-input",
        message: "Invalid bounded event search request",
        retryable: false,
      },
    };
  }
  const start = Date.parse(request.data.window.start);
  const end = Date.parse(request.data.window.end);
  const step = EVENT_SEARCH_LIMITS.scanStepHours * MILLISECONDS_PER_HOUR;
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
      EPHEMERIS_BODY_ORDER,
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
          message: "Event search samples must share one provider provenance",
          retryable: false,
        },
      };
    }
    provenance = result.value.provenance;
    cache.set(rounded, result.value);
    return result;
  }

  async function cyclicRoot(
    leftMs: number,
    rightMs: number,
    leftValue: number,
    rightValue: number,
    target: number,
    valueAt: (batch: PositionBatch) => number,
  ): Promise<AstroResult<number>> {
    return refineBracket(
      leftMs,
      rightMs,
      leftValue - target,
      rightValue - target,
      async (milliseconds) => {
        const batch = await batchAt(milliseconds);
        if (!batch.ok) return batch;
        const ratio = (milliseconds - leftMs) / (rightMs - leftMs);
        const reference = leftValue + (rightValue - leftValue) * ratio;
        return {
          ok: true,
          value: unwrapNear(valueAt(batch.value), reference) - target,
        };
      },
      EVENT_SEARCH_LIMITS.refinementToleranceSeconds * 1_000,
      EVENT_SEARCH_LIMITS.maxRefinementIterations,
    );
  }

  const events: MajorEvent[] = [];
  const fingerprints = new Set<string>();
  async function addEvent(
    exactMilliseconds: number,
    semantic: Readonly<Record<string, unknown>>,
    fields: EventFields,
  ): Promise<void> {
    const exactAt = utcFromMilliseconds(exactMilliseconds);
    const fingerprint = JSON.stringify({ ...semantic, exactAt });
    if (
      fingerprints.has(fingerprint) ||
      exactMilliseconds < start ||
      exactMilliseconds >= end
    )
      return;
    fingerprints.add(fingerprint);
    const id = await semanticId(
      "evt_v1",
      { algorithmVersion: EVENT_ALGORITHM_VERSION, ...semantic, exactAt },
      options?.hasher,
    );
    events.push({ ...fields, id, exactAt } as MajorEvent);
  }

  let leftMs = start;
  let leftResult = await batchAt(leftMs);
  if (!leftResult.ok) return leftResult;
  while (leftMs < end) {
    const rightMs = Math.min(leftMs + step, end);
    const rightResult = await batchAt(rightMs);
    if (!rightResult.ok) return rightResult;
    const left = leftResult.value;
    const right = rightResult.value;

    for (const body of EPHEMERIS_BODY_ORDER) {
      const first = position(left, body);
      const second = position(right, body);
      const unwrappedEnd =
        first.longitude +
        signedAngularDelta(second.longitude - first.longitude);
      const signBoundaries = [
        0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330,
      ];
      for (const target of targetsBetween(
        first.longitude,
        unwrappedEnd,
        signBoundaries,
      )) {
        if (first.longitude === unwrappedEnd) continue;
        const exact = await cyclicRoot(
          leftMs,
          rightMs,
          first.longitude,
          unwrappedEnd,
          target,
          (batch) => position(batch, body).longitude,
        );
        if (!exact.ok) return exact;
        const exactBatch = await batchAt(exact.value);
        if (!exactBatch.ok) return exactBatch;
        if (
          circularDistance(
            position(exactBatch.value, body).longitude,
            normalizeDegrees(target),
          ) > EVENT_EXACT_ANGULAR_TOLERANCE_DEGREES
        ) {
          return {
            ok: false,
            error: {
              code: "search-exhausted",
              message: "Ingress refinement did not satisfy angular tolerance",
              retryable: false,
            },
          };
        }
        const direct = unwrappedEnd > first.longitude;
        const signIndex = direct
          ? Math.floor(normalizeDegrees(target) / 30)
          : Math.floor(normalizeDegrees(target - 1e-9) / 30);
        const sign = ZODIAC_SIGN_ORDER[signIndex]!;
        await addEvent(
          exact.value,
          { kind: "ingress", body, sign },
          {
            kind: "ingress",
            body,
            sign,
            significance: MAJOR_INGRESS_BODIES.has(body) ? "major" : "notable",
          },
        );
      }

      const startsAtStation =
        first.longitudeSpeed === 0 && second.longitudeSpeed !== 0;
      const crossesStation = first.longitudeSpeed * second.longitudeSpeed < 0;
      if (startsAtStation || crossesStation) {
        const exact = await refineBracket(
          leftMs,
          rightMs,
          first.longitudeSpeed,
          second.longitudeSpeed,
          async (milliseconds) => {
            const batch = await batchAt(milliseconds);
            return batch.ok
              ? {
                  ok: true,
                  value: position(batch.value, body).longitudeSpeed,
                }
              : batch;
          },
          EVENT_SEARCH_LIMITS.refinementToleranceSeconds * 1_000,
          EVENT_SEARCH_LIMITS.maxRefinementIterations,
        );
        if (!exact.ok) return exact;
        const exactBatch = await batchAt(exact.value);
        if (!exactBatch.ok) return exactBatch;
        if (
          Math.abs(position(exactBatch.value, body).longitudeSpeed) >
          STATION_SPEED_TOLERANCE_DEGREES_PER_DAY
        ) {
          return {
            ok: false,
            error: {
              code: "search-exhausted",
              message: "Station refinement did not satisfy speed tolerance",
              retryable: false,
            },
          };
        }
        const direction = second.longitudeSpeed < 0 ? "retrograde" : "direct";
        await addEvent(
          exact.value,
          { kind: "station", body, direction },
          {
            kind: "station",
            body,
            direction,
            longitude: position(exactBatch.value, body).longitude,
            significance: SLOW_BODIES.has(body) ? "major" : "notable",
          },
        );
      }
    }

    const firstPhase = normalizeDegrees(
      position(left, "moon").longitude - position(left, "sun").longitude,
    );
    const rawSecondPhase = normalizeDegrees(
      position(right, "moon").longitude - position(right, "sun").longitude,
    );
    const secondPhase =
      firstPhase + signedAngularDelta(rawSecondPhase - firstPhase);
    const lunations = [
      [0, "new"],
      [90, "first-quarter"],
      [180, "full"],
      [270, "last-quarter"],
    ] as const;
    for (const [base, phase] of lunations) {
      for (const target of targetsBetween(firstPhase, secondPhase, [base])) {
        if (firstPhase === secondPhase) continue;
        const exact = await cyclicRoot(
          leftMs,
          rightMs,
          firstPhase,
          secondPhase,
          target,
          (batch) =>
            normalizeDegrees(
              position(batch, "moon").longitude -
                position(batch, "sun").longitude,
            ),
        );
        if (!exact.ok) return exact;
        const exactBatch = await batchAt(exact.value);
        if (!exactBatch.ok) return exactBatch;
        const exactPhase = normalizeDegrees(
          position(exactBatch.value, "moon").longitude -
            position(exactBatch.value, "sun").longitude,
        );
        if (
          circularDistance(exactPhase, normalizeDegrees(target)) >
          EVENT_EXACT_ANGULAR_TOLERANCE_DEGREES
        ) {
          return {
            ok: false,
            error: {
              code: "search-exhausted",
              message: "Lunation refinement did not satisfy angular tolerance",
              retryable: false,
            },
          };
        }
        await addEvent(
          exact.value,
          { kind: "lunation", phase },
          {
            kind: "lunation",
            phase,
            longitude: position(exactBatch.value, "moon").longitude,
            significance: "notable",
          },
        );
      }
    }

    const aspectBases = Object.entries(ASPECT_ANGLES) as [AspectType, number][];
    for (let a = 0; a < EPHEMERIS_BODY_ORDER.length; a += 1) {
      for (let b = a + 1; b < EPHEMERIS_BODY_ORDER.length; b += 1) {
        const bodyA = EPHEMERIS_BODY_ORDER[a]!;
        const bodyB = EPHEMERIS_BODY_ORDER[b]!;
        const firstDelta = normalizeDegrees(
          position(left, bodyB).longitude - position(left, bodyA).longitude,
        );
        const rawSecondDelta = normalizeDegrees(
          position(right, bodyB).longitude - position(right, bodyA).longitude,
        );
        const secondDelta =
          firstDelta + signedAngularDelta(rawSecondDelta - firstDelta);
        for (const [aspect, angle] of aspectBases) {
          const bases =
            angle === 0 || angle === 180 ? [angle] : [angle, 360 - angle];
          for (const target of targetsBetween(firstDelta, secondDelta, bases)) {
            if (firstDelta === secondDelta) continue;
            const exact = await cyclicRoot(
              leftMs,
              rightMs,
              firstDelta,
              secondDelta,
              target,
              (batch) =>
                normalizeDegrees(
                  position(batch, bodyB).longitude -
                    position(batch, bodyA).longitude,
                ),
            );
            if (!exact.ok) return exact;
            const exactBatch = await batchAt(exact.value);
            if (!exactBatch.ok) return exactBatch;
            const exactDelta = normalizeDegrees(
              position(exactBatch.value, bodyB).longitude -
                position(exactBatch.value, bodyA).longitude,
            );
            if (
              circularDistance(exactDelta, normalizeDegrees(target)) >
              EVENT_EXACT_ANGULAR_TOLERANCE_DEGREES
            ) {
              return {
                ok: false,
                error: {
                  code: "search-exhausted",
                  message:
                    "Aspect refinement did not satisfy angular tolerance",
                  retryable: false,
                },
              };
            }
            await addEvent(
              exact.value,
              { kind: "aspect", bodyA, bodyB, aspect },
              {
                kind: "aspect",
                bodyA,
                bodyB,
                aspect,
                exactLongitude: position(exactBatch.value, bodyA).longitude,
                significance: aspectSignificance(bodyA, bodyB),
              },
            );
          }
        }
      }
    }
    leftMs = rightMs;
    leftResult = rightResult;
  }

  events.sort((a, b) => {
    const time = Date.parse(a.exactAt) - Date.parse(b.exactAt);
    return time !== 0 ? time : a.id.localeCompare(b.id);
  });
  const truncatedAtLimit = events.length > request.data.limit;
  const selected = events.slice(0, request.data.limit);
  if (provenance === undefined) {
    return {
      ok: false,
      error: {
        code: "internal-failure",
        message: "Event search produced no provider provenance",
        retryable: false,
      },
    };
  }
  const result = EventSearchResultSchema.safeParse({
    metadata: {
      schemaVersion: SCHEMA_VERSION,
      algorithmVersion: EVENT_ALGORITHM_VERSION,
      calculatedAt: request.data.window.start,
      zodiac: "tropical",
      frame: FRAME_VERSION,
      validFor: request.data.window,
      provenance,
    },
    requestedWindow: request.data.window,
    algorithmVersion: EVENT_ALGORITHM_VERSION,
    events: selected,
    complete: !truncatedAtLimit,
    truncatedAtLimit,
    exactTimeToleranceSeconds: EVENT_SEARCH_LIMITS.refinementToleranceSeconds,
  });
  return result.success
    ? { ok: true, value: result.data }
    : {
        ok: false,
        error: {
          code: "internal-failure",
          message: "Engine could not construct canonical event search output",
          retryable: false,
        },
      };
}

export async function searchUpcomingMajorEvents(
  provider: EphemerisProvider,
  input: EventSearchRequest,
  options?: EventSearchOptions,
): Promise<AstroResult<EventSearchResult>> {
  try {
    return await searchUpcomingMajorEventsInternal(provider, input, options);
  } catch {
    return options?.signal?.aborted
      ? {
          ok: false,
          error: {
            code: "aborted",
            message: "Event search was aborted",
            retryable: false,
          },
        }
      : {
          ok: false,
          error: {
            code: "internal-failure",
            message: "Event search failed before producing canonical output",
            retryable: false,
          },
        };
  }
}
