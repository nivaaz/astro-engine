/**
 * Local type definitions for astro-formatters.
 *
 * These mirror the canonical types in specs/astrology-event.schema.ts
 * so this package is self-contained (no dependency on astro-schema being built yet).
 *
 * When astro-schema is available, replace these with imports from there.
 */

// ─── Enums ───────────────────────────────────────────────────────

type Planet =
  | "sun" | "moon" | "mercury" | "venus" | "mars"
  | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto"
  | "chiron" | "north_node" | "south_node"
  | "lilith" | "ceres" | "pallas" | "juno" | "vesta";

type ZodiacSign =
  | "aries" | "taurus" | "gemini" | "cancer"
  | "leo" | "virgo" | "libra" | "scorpio"
  | "sagittarius" | "capricorn" | "aquarius" | "pisces";

type AspectType =
  | "conjunction"
  | "opposition"
  | "trine"
  | "square"
  | "sextile"
  | "quincunx"
  | "semi_sextile"
  | "semi_square"
  | "sesquiquadrate"
  | "quintile"
  | "bi_quintile";

type EventType =
  | "aspect"
  | "ingress"
  | "station"
  | "lunation"
  | "eclipse"
  | "void_of_course"
  | "cazimi"
  | "combust";

type EventStream =
  | "slow_sky"
  | "lunation"
  | "planetary"
  | "daily_moon";

type Significance = "daily" | "notable" | "major";

type AspectPhase = "applying" | "exact" | "separating";

type LunationType =
  | "new_moon"
  | "waxing_crescent"
  | "first_quarter"
  | "waxing_gibbous"
  | "full_moon"
  | "waning_gibbous"
  | "last_quarter"
  | "waning_crescent";

type StationType = "retrograde" | "direct";

type ExportFormat = "json" | "markdown" | "ics" | "plain" | "csv" | "html";

// ─── Core Structures ─────────────────────────────────────────────

interface PlanetPosition {
  readonly planet: Planet;
  readonly longitude: number;
  readonly latitude: number;
  readonly distance: number;
  readonly speed: number;
  readonly sign: ZodiacSign;
  readonly signDegree: number;
  readonly minute: number;
  readonly second: number;
  readonly house?: number;
  readonly isRetrograde: boolean;
}

interface Aspect {
  readonly type: AspectType;
  readonly exactAngle: number;
  readonly orb: number;
  readonly maxOrb: number;
  readonly phase: AspectPhase;
  readonly isPartile: boolean;
  readonly isApplying: boolean;
  readonly pass?: number;
}

interface AstrologyEvent {
  readonly id: string;
  readonly type: EventType;
  readonly stream: EventStream;
  readonly significance: Significance;

  readonly exactAtUtc: string;
  readonly exactAtJulianDay: number;

  readonly bodies: readonly Planet[];
  readonly positions: readonly PlanetPosition[];

  readonly aspect?: Aspect;

  readonly ingressTo?: ZodiacSign;
  readonly ingressFrom?: ZodiacSign;

  readonly station?: StationType;
  readonly lunation?: LunationType;
  readonly eclipse?: string;

  readonly sign: ZodiacSign;
  readonly degree: number;

  readonly isRetrograde: boolean;

  readonly passNumber?: number;
  readonly totalPasses?: number;

  readonly createdAt: string;
  readonly version: string;
}

interface LocationData {
  readonly latitude: number;
  readonly longitude: number;
  readonly altitude?: number;
  readonly timezone: string;
  readonly city?: string;
  readonly country?: string;
}

interface LocalizedEvent extends AstrologyEvent {
  readonly location: LocationData;
  readonly localTime: string;
  readonly localDate: string;
}

// ─── Options ─────────────────────────────────────────────────────

interface FormatterOptions {
  /** Indentation for JSON (default: 2) */
  readonly indent?: number;
  /** Duration in hours for ICS event (default: 1) */
  readonly durationHours?: number;
  /** Date format preference */
  readonly dateFormat?: "iso" | "local";
  /** Filter to specific streams */
  readonly streams?: readonly EventStream[];
  /** Filter to specific significance levels */
  readonly significance?: readonly Significance[];
  /** Include raw JSON in ICS DESCRIPTION */
  readonly icsIncludeJson?: boolean;
  /** Location for localized output */
  readonly location?: LocationData;
  /** Custom title for the document */
  readonly title?: string;
}

export type {
  Planet,
  ZodiacSign,
  AspectType,
  EventType,
  EventStream,
  Significance,
  AspectPhase,
  LunationType,
  StationType,
  ExportFormat,
  PlanetPosition,
  Aspect,
  AstrologyEvent,
  LocationData,
  LocalizedEvent,
  FormatterOptions,
};