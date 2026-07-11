import {
  CurrentSkySchema,
  EventSearchResultSchema,
  HumanDesignTransitResultSchema,
  type CurrentSky,
  type EventSearchResult,
  type HumanDesignTransitResult,
} from "@sukara/astro-schema";
import { z } from "zod";

export const SkyTransportResponseSchema = z
  .object({
    mode: z.literal("fixture"),
    currentSky: CurrentSkySchema,
    upcomingEvents: EventSearchResultSchema,
    humanDesign: HumanDesignTransitResultSchema,
  })
  .strict()
  .readonly();

export type SkyTransportResponse = Readonly<{
  mode: "fixture";
  currentSky: CurrentSky;
  upcomingEvents: EventSearchResult;
  humanDesign: HumanDesignTransitResult;
}>;

export type SkyTransportError = Readonly<{
  ok: false;
  error: Readonly<{
    code: "provider-unavailable" | "invalid-provider-output";
    message: string;
    retryable: boolean;
  }>;
}>;
