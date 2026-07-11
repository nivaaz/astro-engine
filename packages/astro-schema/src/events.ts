import { z } from "zod";
import {
  AspectTypeSchema,
  CanonicalMetadataSchema,
  EphemerisBodySchema,
  ZodiacSignSchema,
} from "./astronomy.js";
import {
  EclipticLongitudeDegreesSchema,
  SecondsSchema,
  UtcInstantSchema,
  UtcIntervalSchema,
} from "./primitives.js";

export const MAX_EVENT_WINDOW_DAYS = 93;
export const MAX_EVENT_RESULTS = 500;
export const EVENT_ALGORITHM_VERSION = "major-events-v1";
export const EVENT_SEARCH_LIMITS = {
  scanStepHours: 6,
  refinementToleranceSeconds: 1,
  maxRefinementIterations: 80,
} as const;

export const EventSearchRequestSchema = z
  .object({
    window: UtcIntervalSchema,
    limit: z.number().int().min(1).max(MAX_EVENT_RESULTS).default(100),
  })
  .strict()
  .refine(
    ({ window }) =>
      Date.parse(window.end) - Date.parse(window.start) <=
      MAX_EVENT_WINDOW_DAYS * 86_400_000,
    {
      message: `Event window cannot exceed ${MAX_EVENT_WINDOW_DAYS} days`,
      path: ["window", "end"],
    },
  )
  .readonly();
export type EventSearchRequest = z.infer<typeof EventSearchRequestSchema>;

const EventIdentitySchema = z.string().regex(/^evt_v1_[a-f0-9]{64}$/);

const EventBaseSchema = z.object({
  id: EventIdentitySchema,
  exactAt: UtcInstantSchema,
  significance: z.enum(["notable", "major"]),
});

export const AspectEventSchema = EventBaseSchema.extend({
  kind: z.literal("aspect"),
  bodyA: EphemerisBodySchema,
  bodyB: EphemerisBodySchema,
  aspect: AspectTypeSchema,
  exactLongitude: EclipticLongitudeDegreesSchema,
}).strict();

export const IngressEventSchema = EventBaseSchema.extend({
  kind: z.literal("ingress"),
  body: EphemerisBodySchema,
  sign: ZodiacSignSchema,
}).strict();

export const StationEventSchema = EventBaseSchema.extend({
  kind: z.literal("station"),
  body: EphemerisBodySchema,
  direction: z.enum(["retrograde", "direct"]),
  longitude: EclipticLongitudeDegreesSchema,
}).strict();

export const LunationEventSchema = EventBaseSchema.extend({
  kind: z.literal("lunation"),
  phase: z.enum(["new", "first-quarter", "full", "last-quarter"]),
  longitude: EclipticLongitudeDegreesSchema,
}).strict();

export const MajorEventSchema = z
  .discriminatedUnion("kind", [
    AspectEventSchema,
    IngressEventSchema,
    StationEventSchema,
    LunationEventSchema,
  ])
  .readonly();
export type MajorEvent = z.infer<typeof MajorEventSchema>;

export const EventSearchResultSchema = z
  .object({
    metadata: CanonicalMetadataSchema,
    requestedWindow: UtcIntervalSchema,
    algorithmVersion: z.literal(EVENT_ALGORITHM_VERSION),
    events: z.array(MajorEventSchema).max(MAX_EVENT_RESULTS).readonly(),
    complete: z.boolean(),
    truncatedAtLimit: z.boolean(),
    exactTimeToleranceSeconds: SecondsSchema.max(60),
  })
  .strict()
  .refine(
    ({ requestedWindow, events }) =>
      events.every(
        ({ exactAt }) =>
          Date.parse(exactAt) >= Date.parse(requestedWindow.start) &&
          Date.parse(exactAt) < Date.parse(requestedWindow.end),
      ),
    {
      message: "Events must fall inside the requested half-open window",
      path: ["events"],
    },
  )
  .refine(
    ({ events }) =>
      events.every((event, index) => {
        if (index === 0) return true;
        const previous = events[index - 1]!;
        const timeDelta =
          Date.parse(previous.exactAt) - Date.parse(event.exactAt);
        return timeDelta < 0 || (timeDelta === 0 && previous.id < event.id);
      }),
    {
      message:
        "Events must use chronological order with semantic ID as the stable tie-breaker",
      path: ["events"],
    },
  )
  .refine(({ complete, truncatedAtLimit }) => complete !== truncatedAtLimit, {
    message: "A result is complete exactly when it was not truncated",
  })
  .readonly();
export type EventSearchResult = z.infer<typeof EventSearchResultSchema>;
