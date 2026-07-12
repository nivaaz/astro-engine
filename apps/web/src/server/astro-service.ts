import {
  calculateCurrentSky,
  calculateSaturnReturn,
  calculateWholeSignChart,
  searchUpcomingMajorEvents,
} from "@sukara/astro-engine";
import {
  CurrentSkySchema,
  DegreesSchema,
  EventSearchRequestSchema,
  EventSearchResultSchema,
  GeoLocationSchema,
  HUMAN_DESIGN_MAPPING_VERSION,
  HumanDesignTransitResultSchema,
  SaturnReturnRequestSchema,
  SaturnReturnResultSchema,
  SESSION_PERSONAL_CLASSIFICATION,
  UtcInstantSchema,
  UtcIntervalSchema,
  WholeSignChartSchema,
  type AstroError,
  type AstroResult,
  type EphemerisProvider,
} from "@sukara/astro-schema";
import { mapPositionsToHumanDesignTransits } from "@sukara/human-design";
import { z } from "zod";

const CurrentSkyOperationSchema = z
  .object({ operation: z.literal("current-sky"), instant: UtcInstantSchema })
  .strict();

const EventsOperationSchema = z
  .object({
    operation: z.literal("events"),
    request: EventSearchRequestSchema,
  })
  .strict();

const WholeSignOperationSchema = z
  .object({
    operation: z.literal("whole-sign"),
    instant: UtcInstantSchema,
    location: GeoLocationSchema,
  })
  .strict();

const SaturnReturnOperationSchema = z
  .object({
    operation: z.literal("saturn-return"),
    birthInstant: UtcInstantSchema,
    asOf: UtcInstantSchema,
    searchWindow: UtcIntervalSchema,
    orb: DegreesSchema.min(0.5).max(3),
  })
  .strict()
  .refine(
    ({ birthInstant, asOf }) => Date.parse(birthInstant) < Date.parse(asOf),
    {
      message: "birthInstant must precede asOf",
      path: ["birthInstant"],
    },
  );

const HumanDesignOperationSchema = z
  .object({ operation: z.literal("human-design"), instant: UtcInstantSchema })
  .strict();

export const AstroOperationSchema = z.discriminatedUnion("operation", [
  CurrentSkyOperationSchema,
  EventsOperationSchema,
  WholeSignOperationSchema,
  SaturnReturnOperationSchema,
  HumanDesignOperationSchema,
]);

export type AstroOperation = z.infer<typeof AstroOperationSchema>;

export type AstroOperationValue =
  | z.infer<typeof CurrentSkySchema>
  | z.infer<typeof EventSearchResultSchema>
  | z.infer<typeof WholeSignChartSchema>
  | z.infer<typeof SaturnReturnResultSchema>
  | z.infer<typeof HumanDesignTransitResultSchema>;

const invalidInput = (): AstroResult<never> => ({
  ok: false,
  error: {
    code: "invalid-input",
    message: "The astronomy request is invalid.",
    retryable: false,
  },
});

const internalFailure = (): AstroResult<never> => ({
  ok: false,
  error: {
    code: "internal-failure",
    message: "The astronomy request could not be completed.",
    retryable: false,
  },
});

function projectHumanDesign(
  sky: z.infer<typeof CurrentSkySchema>,
): AstroResult<z.infer<typeof HumanDesignTransitResultSchema>> {
  const projection = HumanDesignTransitResultSchema.safeParse({
    metadata: {
      ...sky.metadata,
      algorithmVersion: HUMAN_DESIGN_MAPPING_VERSION,
    },
    transits: mapPositionsToHumanDesignTransits(sky.positions),
  });
  return projection.success
    ? { ok: true, value: projection.data }
    : internalFailure();
}

async function currentSky(
  provider: EphemerisProvider,
  instant: z.infer<typeof UtcInstantSchema>,
) {
  const result = await calculateCurrentSky(provider, instant);
  if (!result.ok) return result;
  const parsed = CurrentSkySchema.safeParse(result.value);
  return parsed.success
    ? ({ ok: true, value: parsed.data } as const)
    : ({
        ok: false,
        error: {
          code: "invalid-provider-output",
          message: "Current sky output failed runtime validation.",
          retryable: false,
        },
      } as const);
}

export async function executeAstroOperation(
  provider: EphemerisProvider,
  input: unknown,
): Promise<AstroResult<AstroOperationValue>> {
  const parsed = AstroOperationSchema.safeParse(input);
  if (!parsed.success) return invalidInput();

  try {
    switch (parsed.data.operation) {
      case "current-sky":
        return await currentSky(provider, parsed.data.instant);
      case "events": {
        const result = await searchUpcomingMajorEvents(
          provider,
          parsed.data.request,
        );
        if (!result.ok) return result;
        const value = EventSearchResultSchema.safeParse(result.value);
        return value.success
          ? { ok: true, value: value.data }
          : internalFailure();
      }
      case "whole-sign": {
        const result = await calculateWholeSignChart(
          provider,
          parsed.data.instant,
          parsed.data.location,
        );
        if (!result.ok) return result;
        const value = WholeSignChartSchema.safeParse(result.value);
        return value.success
          ? { ok: true, value: value.data }
          : internalFailure();
      }
      case "saturn-return": {
        const natalSky = await calculateCurrentSky(
          provider,
          parsed.data.birthInstant,
          ["sun", "moon", "saturn"],
        );
        if (!natalSky.ok) return natalSky;
        const natalSaturn = natalSky.value.positions.find(
          ({ body }) => body === "saturn",
        );
        if (natalSaturn === undefined) return internalFailure();
        const request = SaturnReturnRequestSchema.safeParse({
          classification: SESSION_PERSONAL_CLASSIFICATION,
          natalSaturnLongitude: natalSaturn.longitude,
          birthInstant: parsed.data.birthInstant,
          asOf: parsed.data.asOf,
          searchWindow: parsed.data.searchWindow,
          orb: parsed.data.orb,
        });
        if (!request.success) return invalidInput();
        const result = await calculateSaturnReturn(provider, request.data);
        if (!result.ok) return result;
        const value = SaturnReturnResultSchema.safeParse(result.value);
        return value.success
          ? { ok: true, value: value.data }
          : internalFailure();
      }
      case "human-design": {
        const sky = await currentSky(provider, parsed.data.instant);
        return sky.ok ? projectHumanDesign(sky.value) : sky;
      }
    }
  } catch {
    return internalFailure();
  }
}

export function unavailableError(): AstroError {
  return {
    code: "provider-unavailable",
    message: "The licensed ephemeris provider is not configured.",
    retryable: false,
  };
}
