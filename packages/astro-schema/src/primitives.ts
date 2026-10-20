import { z } from "zod";

const CANONICAL_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const CANONICAL_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/;

function isCanonicalUtc(value: string): boolean {
  if (!CANONICAL_UTC.test(value)) return false;
  const milliseconds = Date.parse(value);
  return (
    Number.isFinite(milliseconds) &&
    new Date(milliseconds).toISOString() === value
  );
}

function isNegativeZero(value: number): boolean {
  return Object.is(value, -0);
}

export const UtcInstantSchema = z
  .string()
  .refine(
    isCanonicalUtc,
    "Expected canonical RFC 3339 UTC with millisecond precision",
  )
  .brand<"UtcInstant">();
export type UtcInstant = z.infer<typeof UtcInstantSchema>;

export const LatitudeDegreesSchema = z
  .number()
  .finite()
  .min(-90)
  .max(90)
  .refine((value) => !isNegativeZero(value), "Negative zero is not canonical")
  .brand<"LatitudeDegrees">();
export type LatitudeDegrees = z.infer<typeof LatitudeDegreesSchema>;

export const EastLongitudeDegreesSchema = z
  .number()
  .finite()
  .gte(-180)
  .lt(180)
  .refine((value) => !isNegativeZero(value), "Negative zero is not canonical")
  .brand<"EastLongitudeDegrees">();
export type EastLongitudeDegrees = z.infer<typeof EastLongitudeDegreesSchema>;

export const EclipticLongitudeDegreesSchema = z
  .number()
  .finite()
  .gte(0)
  .lt(360)
  .refine((value) => !isNegativeZero(value), "Negative zero is not canonical")
  .brand<"EclipticLongitudeDegrees">();
export type EclipticLongitudeDegrees = z.infer<
  typeof EclipticLongitudeDegreesSchema
>;

export const DegreesSchema = z
  .number()
  .finite()
  .nonnegative()
  .brand<"Degrees">();
export type Degrees = z.infer<typeof DegreesSchema>;

export const SecondsSchema = z
  .number()
  .finite()
  .nonnegative()
  .brand<"Seconds">();
export type Seconds = z.infer<typeof SecondsSchema>;

export const DegreesPerDaySchema = z
  .number()
  .finite()
  .refine((value) => !isNegativeZero(value), "Negative zero is not canonical")
  .brand<"DegreesPerDay">();
export type DegreesPerDay = z.infer<typeof DegreesPerDaySchema>;

export const IanaTimezoneSchema = z
  .string()
  .min(1)
  .max(255)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value }).format(0);
      return value.includes("/") || value === "UTC";
    } catch {
      return false;
    }
  }, "Expected a supported IANA timezone")
  .brand<"IanaTimezone">();
export type IanaTimezone = z.infer<typeof IanaTimezoneSchema>;

export const CivilTimeInputSchema = z
  .object({
    localDateTime: z.string().regex(CANONICAL_LOCAL),
    timezone: IanaTimezoneSchema,
    fold: z.enum(["reject-ambiguous", "earlier", "later"]),
  })
  .strict()
  .readonly();
export type CivilTimeInput = z.infer<typeof CivilTimeInputSchema>;

export const GeoLocationSchema = z
  .object({
    latitude: LatitudeDegreesSchema,
    longitude: EastLongitudeDegreesSchema,
    timezone: IanaTimezoneSchema,
  })
  .strict()
  .readonly();
export type GeoLocation = z.infer<typeof GeoLocationSchema>;

export const UtcIntervalSchema = z
  .object({ start: UtcInstantSchema, end: UtcInstantSchema })
  .strict()
  .refine(({ start, end }) => Date.parse(start) < Date.parse(end), {
    message: "Expected a non-empty half-open interval [start, end)",
    path: ["end"],
  })
  .readonly();
export type UtcInterval = z.infer<typeof UtcIntervalSchema>;
