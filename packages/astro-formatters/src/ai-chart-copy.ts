import {
  CurrentSkySchema,
  UtcInstantSchema,
  WholeSignChartSchema,
  type CurrentSky,
  type WholeSignChart,
} from "@sukara/astro-schema";
import { z } from "zod";
import { displayName, number } from "./common.js";
import { formatArcminutes } from "./arcminutes.js";

export const AI_CHART_PROMPT =
  "As a top 0.01% astrology expert explain the themes, challenges and gifts of this chart. Consider planets, houses, signs and aspects from the chart to back up all your claims. In your response ensure you add a short 1 line explainer of where the claim comes from and how you arrived at it. Your aim is to educate the user as you provide information.";

const ChartTypeSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .refine((value) => !/[\u0000-\u001f\u007f]/u.test(value), {
    message: "Chart type must be a single line",
  });

export const AiChartCopyContextSchema = z
  .object({
    chartType: ChartTypeSchema,
    date: UtcInstantSchema,
    currentSky: CurrentSkySchema,
    wholeSignChart: WholeSignChartSchema.optional(),
  })
  .strict()
  .readonly();

export type AiChartCopyContext = z.infer<typeof AiChartCopyContextSchema>;

function houseFor(
  chart: WholeSignChart | undefined,
  body: CurrentSky["positions"][number]["body"],
): number | undefined {
  return chart?.placements.find((placement) => placement.body === body)?.house;
}

function locationLine(chart: WholeSignChart): string {
  return `Location: latitude ${number(chart.location.latitude)}, longitude ${number(chart.location.longitude)}, timezone ${chart.location.timezone}`;
}

/**
 * Concise, factual copy for an explicit user action. All positions/aspects are
 * already computed canonical values; the prompt is the only interpretive text.
 */
export function formatAiChartCopy(input: unknown): string {
  const context = AiChartCopyContextSchema.parse(input);
  const chart = context.wholeSignChart;
  const positions = context.currentSky.positions.map((position) => {
    const house = houseFor(chart, position.body);
    const retrograde = position.retrograde ? " [Retrograde]" : "";
    const houseText = house === undefined ? "" : ` · House ${house}`;
    return `- ${displayName(position.body)} in ${displayName(position.sign)} at ${formatArcminutes(position.signDegree)}${retrograde}${houseText}`;
  });
  const aspects =
    context.currentSky.aspects.length === 0
      ? ["- None"]
      : context.currentSky.aspects.map(
          (aspect) =>
            `- ${displayName(aspect.bodyA)}–${displayName(aspect.bodyB)}: ${displayName(aspect.type)} · orb ${formatArcminutes(aspect.orb)} · ${aspect.phase}`,
        );

  return [
    `# ${context.chartType}`,
    `Date: ${context.date}`,
    "Zodiac: Tropical",
    ...(chart ? ["House system: Whole Sign", locationLine(chart)] : []),
    "Data from ASTRO ENGINE by sukara.tech",
    "",
    "Planet positions:",
    ...positions,
    "",
    "Aspects:",
    ...aspects,
    "",
    "Prompt:",
    AI_CHART_PROMPT,
    "",
  ].join("\n");
}

export function validateAiChartCopyContext(input: unknown): AiChartCopyContext {
  return AiChartCopyContextSchema.parse(input);
}
