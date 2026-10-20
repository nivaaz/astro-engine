import {
  calculateCurrentSky,
  calculateWholeSignChart,
} from "@sukara/astro-engine";
import {
  CurrentSkySchema,
  GeoLocationSchema,
  UtcInstantSchema,
  WholeSignChartSchema,
  type AstroError,
  type EphemerisProvider,
} from "@sukara/astro-schema";
import { formatAiChartCopy } from "@sukara/astro-formatters";
import { NextResponse } from "next/server";
import { z } from "zod";

const ChartTypeSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .refine((value) => !/[\u0000-\u001f\u007f]/u.test(value));

const CurrentSkyCopySchema = z
  .object({
    context: z.literal("current-sky"),
    chartType: ChartTypeSchema,
    date: UtcInstantSchema,
    currentSky: CurrentSkySchema,
    wholeSignChart: WholeSignChartSchema.optional(),
  })
  .strict();

const ComputedCopySchema = z
  .object({
    context: z.enum(["event", "lunation", "saturn-return-pass"]),
    chartType: ChartTypeSchema,
    instant: UtcInstantSchema,
    location: GeoLocationSchema.optional(),
  })
  .strict()
  .refine(
    ({ context, location }) => context !== "saturn-return-pass" || location,
    { message: "Saturn-return pass copy requires a selected location" },
  );

const ChartCopyRequestSchema = z.discriminatedUnion("context", [
  CurrentSkyCopySchema,
  ComputedCopySchema,
]);

const headers = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
} as const;

function errorResponse(
  error: AstroError | "invalid-input" | "invalid-canonical-object",
  status: number,
) {
  return NextResponse.json({ ok: false, error }, { status, headers });
}

export function createChartCopyHandler(
  resolveProvider: () =>
    EphemerisProvider | null | Promise<EphemerisProvider | null>,
) {
  return async function POST(request: Request) {
    let input: unknown;
    try {
      input = await request.json();
    } catch {
      return errorResponse("invalid-input", 400);
    }
    const parsed = ChartCopyRequestSchema.safeParse(input);
    if (!parsed.success) return errorResponse("invalid-input", 400);

    if (parsed.data.context === "current-sky") {
      try {
        const output = formatAiChartCopy({
          chartType: parsed.data.chartType,
          date: parsed.data.date,
          currentSky: parsed.data.currentSky,
          wholeSignChart: parsed.data.wholeSignChart,
        });
        return NextResponse.json({ ok: true, output }, { headers });
      } catch {
        return errorResponse("invalid-canonical-object", 400);
      }
    }

    let provider: EphemerisProvider | null;
    try {
      provider = await resolveProvider();
    } catch {
      return errorResponse(
        {
          code: "internal-failure",
          message: "The astronomy provider could not be initialized.",
          retryable: false,
        },
        502,
      );
    }
    if (provider === null) {
      return errorResponse(
        {
          code: "provider-unavailable",
          message: "The licensed ephemeris provider is not configured.",
          retryable: false,
        },
        503,
      );
    }

    const sky = await calculateCurrentSky(provider, parsed.data.instant);
    if (!sky.ok) return errorResponse(sky.error, 503);
    const currentSky = CurrentSkySchema.safeParse(sky.value);
    if (!currentSky.success)
      return errorResponse("invalid-canonical-object", 502);

    let wholeSignChart: z.infer<typeof WholeSignChartSchema> | undefined;
    if (parsed.data.location !== undefined) {
      const chart = await calculateWholeSignChart(
        provider,
        parsed.data.instant,
        parsed.data.location,
      );
      if (!chart.ok) return errorResponse(chart.error, 503);
      const parsedChart = WholeSignChartSchema.safeParse(chart.value);
      if (!parsedChart.success)
        return errorResponse("invalid-canonical-object", 502);
      wholeSignChart = parsedChart.data;
    }

    try {
      const output = formatAiChartCopy({
        chartType: parsed.data.chartType,
        date: parsed.data.instant,
        currentSky: currentSky.data,
        wholeSignChart,
      });
      return NextResponse.json({ ok: true, output }, { headers });
    } catch {
      return errorResponse("invalid-canonical-object", 502);
    }
  };
}
