/**
 * Astro Engine — Canonical Astrology Event Schema
 *
 * This is the single source of truth for all astrology event data.
 * Every package, service, and consumer must use this type.
 *
 * See: specs/event-taxonomy.md for classification rules
 * See: docs/architecture/ for how events flow through the system
 */

// ─── Branded Types ───────────────────────────────────────────────

/** Degrees of arc (0–360) */
type Degree = number & { readonly __brand: "Degree" };

/** Julian Day Number — astronomical time standard */
type JulianDay = number & { readonly __brand: "JulianDay" };

/** ISO 8601 timestamp in UTC */
type UTCTimestamp = string & { readonly __brand: "UTCTimestamp" };

/** IANA timezone identifier (e.g. "Australia/Sydney") */
type IANATimezone = string & { readonly __brand: "IANATimezone" };

/** Orb in degrees */
type OrbDegrees = number & { readonly __brand: "OrbDegrees" };

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
  | "conjunction"    // 0°
  | "opposition"     // 180°
  | "trine"          // 120°
  | "square"         // 90°
  | "sextile"        // 60°
  | "quincunx"       // 150°
  | "semi_sextile"   // 30°
  | "semi_square"    // 45°
  | "sesquiquadrate" // 135°
  | "quintile"       // 72°
  | "bi_quintile"    // 144°;

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
  | "slow_sky"       // outer planet aspects, ingresses, stations, eclipses
  | "lunation"       // new moon, full moon, quarter moon
  | "planetary"      // inner planet aspects, ingresses, cazimi
  | "daily_moon";    // moon ingresses, void-of-course, moon aspects

type Significance =
  | "daily"   // frequent, low-impact (Moon trine Mercury)
  | "notable" // worth mentioning (Venus enters Leo)
  | "major";  // rare, high-impact (Saturn conjunct Neptune)

type AspectPhase =
  | "applying"   // aspect is forming (orb decreasing)
  | "exact"      // aspect is at exact degree
  | "separating" // aspect is dissolving (orb increasing)

type EclipseType =
  | "solar_new"
  | "solar_annular"
  | "solar_total"
  | "solar_hybrid"
  | "lunar_penumbral"
  | "lunar_partial"
  | "lunar_total";

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

type HouseSystem =
  | "placidus"
  | "whole_sign"
  | "equal"
  | "koch"
  | "regiomontanus"
  | "campanus"
  | "topocentric"
  | "porphyry";

type ZodiacType = "tropical" | "sidereal";

// ─── Core Data Structures ────────────────────────────────────────

interface PlanetPosition {
  readonly planet: Planet;
  readonly longitude: Degree;         // ecliptic longitude (0–360)
  readonly latitude: Degree;          // ecliptic latitude
  readonly distance: number;          // AU from Earth
  readonly speed: number;             // degrees per day (negative = retrograde)
  readonly sign: ZodiacSign;
  readonly signDegree: Degree;        // degree within sign (0–30)
  readonly minute: number;            // arc minute
  readonly second: number;            // arc second
  readonly house?: number;            // house placement (1–12), if location provided
  readonly isRetrograde: boolean;
}

interface Aspect {
  readonly type: AspectType;
  readonly exactAngle: Degree;        // e.g. 120 for trine
  readonly orb: OrbDegrees;           // current orb from exact
  readonly maxOrb: OrbDegrees;        // allowed orb for this aspect type
  readonly phase: AspectPhase;
  readonly isPartile: boolean;        // orb < 1°
  readonly isApplying: boolean;
  readonly pass?: number;             // 1st, 2nd, or 3rd pass for outer planets
}

interface HouseData {
  readonly system: HouseSystem;
  readonly cusps: readonly Degree[];  // 12 cusps (or fewer for some systems)
  readonly ascendant: Degree;
  readonly midheaven: Degree;
  readonly vertex?: Degree;
  readonly armc?: Degree;             // ARMC (sidereal time)
}

interface LocationData {
  readonly latitude: number;          // decimal degrees
  readonly longitude: number;         // decimal degrees
  readonly altitude?: number;         // metres above sea level
  readonly timezone: IANATimezone;
  readonly city?: string;
  readonly country?: string;
}

// ─── Canonical Event ─────────────────────────────────────────────

interface AstrologyEvent {
  readonly id: string;                // deterministic hash of event params
  readonly type: EventType;
  readonly stream: EventStream;
  readonly significance: Significance;

  // Timing
  readonly exactAtUtc: UTCTimestamp;
  readonly exactAtJulianDay: JulianDay;

  // Bodies involved
  readonly bodies: readonly Planet[];
  readonly positions: readonly PlanetPosition[];

  // Aspect-specific
  readonly aspect?: Aspect;

  // Ingress-specific
  readonly ingressTo?: ZodiacSign;
  readonly ingressFrom?: ZodiacSign;

  // Station-specific
  readonly station?: StationType;

  // Lunation-specific
  readonly lunation?: LunationType;

  // Eclipse-specific
  readonly eclipse?: EclipseType;

  // Sign & degree
  readonly sign: ZodiacSign;
  readonly degree: Degree;

  // Retrograde context
  readonly isRetrograde: boolean;

  // Multi-pass (for outer planets that aspect 3 times)
  readonly passNumber?: number;       // 1, 2, or 3
  readonly totalPasses?: number;

  // Metadata
  readonly createdAt: UTCTimestamp;
  readonly version: string;           // schema version
}

// ─── Localised Event (extends base with location context) ────────

interface LocalizedEvent extends AstrologyEvent {
  readonly location: LocationData;
  readonly localTime: string;         // ISO 8601 with timezone offset
  readonly localDate: string;         // YYYY-MM-DD in local timezone
  readonly eventChart?: {
    readonly houses: HouseData;
    readonly ascendant: PlanetPosition;
    readonly midheaven: PlanetPosition;
  };
}

// ─── Natal Chart ─────────────────────────────────────────────────

interface NatalChart {
  readonly id: string;
  readonly birthData: {
    readonly datetime: UTCTimestamp;
    readonly location: LocationData;
  };
  readonly positions: readonly PlanetPosition[];
  readonly houses: HouseData;
  readonly aspects: readonly Aspect[];
  readonly metadata: {
    readonly zodiac: ZodiacType;
    readonly houseSystem: HouseSystem;
    readonly ayanamsa?: string;       // for sidereal
    readonly calculatedAt: UTCTimestamp;
    readonly engine: string;          // e.g. "astro-engine@0.1.0"
  };
}

// ─── Transit Overlay ─────────────────────────────────────────────

interface TransitHit {
  readonly transitEvent: AstrologyEvent;
  readonly natalPlanet: Planet;
  readonly aspect: Aspect;
  readonly significance: Significance;
  readonly interpretation?: string;   // non-deterministic, clearly marked
}

interface TransitTimeline {
  readonly chartId: string;
  readonly startDate: string;         // YYYY-MM-DD
  readonly endDate: string;           // YYYY-MM-DD
  readonly hits: readonly TransitHit[];
  readonly metadata: {
    readonly filters: EventFilter;
    readonly generatedAt: UTCTimestamp;
  };
}

// ─── Filters & Queries ───────────────────────────────────────────

interface EventFilter {
  readonly planets?: readonly Planet[];
  readonly aspects?: readonly AspectType[];
  readonly eventTypes?: readonly EventType[];
  readonly streams?: readonly EventStream[];
  readonly significance?: readonly Significance[];
  readonly signs?: readonly ZodiacSign[];
  readonly maxOrb?: OrbDegrees;
  readonly dateRange?: {
    readonly start: string;           // YYYY-MM-DD
    readonly end: string;             // YYYY-MM-DD
  };
  readonly location?: LocationData;
  readonly includeRetrogrades?: boolean;
}

// ─── Export Formats ──────────────────────────────────────────────

type ExportFormat =
  | "json"          // structured data
  | "markdown"      // human-readable
  | "ics"           // calendar event
  | "plain"         // prompt-ready text
  | "csv"           // spreadsheet
  | "html";         // rich display

interface ExportedEvent {
  readonly format: ExportFormat;
  readonly content: string;
  readonly metadata: {
    readonly eventCount: number;
    readonly generatedAt: UTCTimestamp;
    readonly format: ExportFormat;
  };
}

export type {
  // Branded types
  Degree, JulianDay, UTCTimestamp, IANATimezone, OrbDegrees,
  // Enums
  Planet, ZodiacSign, AspectType, EventType, EventStream, Significance,
  AspectPhase, EclipseType, LunationType, StationType, HouseSystem, ZodiacType,
  // Core
  PlanetPosition, Aspect, HouseData, LocationData,
  // Events
  AstrologyEvent, LocalizedEvent,
  // Charts
  NatalChart, TransitHit, TransitTimeline,
  // Queries
  EventFilter,
  // Exports
  ExportFormat, ExportedEvent,
};
