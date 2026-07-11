/**
 * @astro-engine/schema — Canonical type definitions
 *
 * Derived from Mirror Mindset's proven astro-core types.
 * Source: nivaaz/astroai/src/app/lib/astro-core/types.ts
 *
 * This is the single source of truth for all astrology event data.
 * Every package, service, and consumer must use these types.
 */

// ─── Geographic Coordinates ──────────────────────────────────────

export interface GeoLocation {
  /** Latitude in decimal degrees, positive for north */
  readonly latitude: number;
  /** Longitude in decimal degrees, positive for east */
  readonly longitude: number;
  /** Optional altitude in meters above sea level */
  readonly altitudeMeters?: number;
}

// ─── Enums ───────────────────────────────────────────────────────

export type HouseSystem =
  | "WHOLE_SIGN"
  | "PLACIDUS"
  | "KOCH"
  | "EQUAL"
  | "REGIOMONTANUS"
  | "CAMPANUS";

export type ZodiacType = "TROPICAL" | "SIDEREAL";

export type ZodiacSign =
  | "ARIES" | "TAURUS" | "GEMINI" | "CANCER"
  | "LEO" | "VIRGO" | "LIBRA" | "SCORPIO"
  | "SAGITTARIUS" | "CAPRICORN" | "AQUARIUS" | "PISCES";

export type CelestialBody =
  | "SUN" | "MOON" | "MERCURY" | "VENUS" | "MARS"
  | "JUPITER" | "SATURN" | "URANUS" | "NEPTUNE" | "PLUTO"
  | "EARTH" | "NORTH_NODE" | "SOUTH_NODE" | "CHIRON" | "LILITH" | "CERES" | "PALLAS" | "JUNO" | "VESTA";

export type AspectType =
  | "CONJUNCTION"
  | "OPPOSITION"
  | "TRINE"
  | "SQUARE"
  | "SEXTILE"
  | "QUINCUNX"
  | "SEMI_SEXTILE"
  | "SEMI_SQUARE"
  | "SESQUIQUADRATE"
  | "QUINTILE"
  | "BI_QUINTILE";

export type EventType =
  | "ASPECT"
  | "INGRESS"
  | "STATION"
  | "LUNATION"
  | "ECLIPSE"
  | "VOID_OF_COURSE"
  | "CAZIMI"
  | "COMBUST";

export type EventStream =
  | "SLOW_SKY"
  | "LUNATION"
  | "PLANETARY"
  | "DAILY_MOON";

export type Significance = "DAILY" | "NOTABLE" | "MAJOR";

export type AspectPhase = "APPLYING" | "EXACT" | "SEPARATING";

export type StationType = "RETROGRADE" | "DIRECT";

export type LunationType =
  | "NEW_MOON" | "WAXING_CRESCENT" | "FIRST_QUARTER" | "WAXING_GIBBOUS"
  | "FULL_MOON" | "WANING_GIBBOUS" | "LAST_QUARTER" | "WANING_CRESCENT";

export type EclipseType =
  | "SOLAR_NEW" | "SOLAR_ANNULAR" | "SOLAR_TOTAL" | "SOLAR_HYBRID"
  | "LUNAR_PENUMBRAL" | "LUNAR_PARTIAL" | "LUNAR_TOTAL";

export type ExportFormat = "JSON" | "MARKDOWN" | "ICS" | "PLAIN" | "CSV" | "HTML";

// ─── Chart Input Types (from Mirror Mindset) ─────────────────────

export type ChartInputSource = "USER" | "API";

export interface ChartBirthInput {
  readonly localISO: string;
  readonly utcISO: string;
  readonly timezone: string;
  readonly timezoneOffsetMinutes: number;
  readonly source: ChartInputSource;
}

export interface ChartLocationInput {
  readonly label: string;
  readonly lat: number;
  readonly lon: number;
  readonly source: ChartInputSource;
}

export interface ChartInput {
  readonly birth: ChartBirthInput;
  readonly location: ChartLocationInput;
}

export interface AstroChartOptions {
  readonly houseSystem?: HouseSystem;
  readonly zodiacType?: ZodiacType;
  readonly includeTrueNode?: boolean;
  readonly ephemerisKey?: string;
}

// ─── Position & Aspect Data ──────────────────────────────────────

export interface PlanetPosition {
  /** The celestial body being described */
  readonly body: CelestialBody;
  /** Named zodiac sign */
  readonly sign: ZodiacSign;
  /** Zodiac sign index (0 = Aries, 11 = Pisces) */
  readonly signIndex: number;
  /** Absolute ecliptic longitude in decimal degrees (0–360) */
  readonly longitude: number;
  /** Absolute ecliptic latitude in decimal degrees */
  readonly latitude: number;
  /** Daily speed in longitude degrees (negative = retrograde) */
  readonly speed: number;
  /** Position within the current sign in decimal degrees (0–30) */
  readonly signLongitude: number;
  /** Retrograde flag */
  readonly isRetrograde: boolean;
  /** House number (1–12) */
  readonly house: number;
}

export interface HouseData {
  /** House number (1–12) */
  readonly houseNumber: number;
  /** Zodiac sign index for the house cusp */
  readonly signIndex: number;
  /** Starting degree of the house within the zodiac (0–360) */
  readonly cuspLongitude: number;
  /** Ruling planet */
  readonly ruler: CelestialBody | null;
}

export interface NatalChartAspect {
  readonly bodyA: string;
  readonly bodyB: string;
  readonly aspect: AspectType;
  readonly orb: number;
  readonly applying: boolean;
}

// ─── Chart Output ────────────────────────────────────────────────

export interface NatalChart {
  readonly meta: {
    readonly engineVersion: string;
    readonly generatedAt: string;
    readonly zodiac: ZodiacType;
    readonly ayanamsa?: string;
    readonly houseSystem: HouseSystem;
    readonly ephemerisVersion?: string;
  };
  readonly bodies: Record<string, PlanetPosition>;
  readonly angles: {
    readonly asc: number;
    readonly mc: number;
    readonly dsc: number;
    readonly ic: number;
    readonly vertex?: number;
  };
  readonly houses: number[];
  readonly aspects: NatalChartAspect[];
}

// ─── Astrology Event (for transit tracking) ──────────────────────

export interface AstrologyEvent {
  readonly id: string;
  readonly type: EventType;
  readonly stream: EventStream;
  readonly significance: Significance;
  readonly exactAtUtc: string;
  readonly bodies: readonly CelestialBody[];
  readonly positions: readonly PlanetPosition[];
  readonly aspect?: NatalChartAspect;
  readonly ingressTo?: ZodiacSign;
  readonly ingressFrom?: ZodiacSign;
  readonly station?: StationType;
  readonly lunation?: LunationType;
  readonly eclipse?: EclipseType;
  readonly sign: ZodiacSign;
  readonly degree: number;
  readonly isRetrograde: boolean;
  readonly passNumber?: number;
  readonly totalPasses?: number;
  readonly createdAt: string;
  readonly version: string;
}

export interface TransitHit {
  readonly transitEvent: AstrologyEvent;
  readonly natalBody: CelestialBody;
  readonly aspect: NatalChartAspect;
  readonly significance: Significance;
}

export interface EventFilter {
  readonly bodies?: readonly CelestialBody[];
  readonly aspects?: readonly AspectType[];
  readonly eventTypes?: readonly EventType[];
  readonly streams?: readonly EventStream[];
  readonly significance?: readonly Significance[];
  readonly signs?: readonly ZodiacSign[];
  readonly maxOrb?: number;
  readonly dateRange?: {
    readonly start: string;
    readonly end: string;
  };
  readonly includeRetrogrades?: boolean;
}

export interface ExportedEvent {
  readonly format: ExportFormat;
  readonly content: string;
  readonly metadata: {
    readonly eventCount: number;
    readonly generatedAt: string;
  };
}

// ─── Error Handling ──────────────────────────────────────────────

export type AstroChartErrorCode =
  | "INVALID_INPUT"
  | "UNSUPPORTED_ZODIAC"
  | "UNSUPPORTED_HOUSE_SYSTEM"
  | "EPHEMERIS_UNAVAILABLE"
  | "CALCULATION_FAILED";

export type AstroChartWarningCode =
  | "TRANSITS_NOT_AVAILABLE"
  | "SYNASTRY_NOT_AVAILABLE"
  | "ASTROCARTOGRAPHY_NOT_AVAILABLE";

export interface AstroChartError {
  readonly code: AstroChartErrorCode;
  readonly message: string;
  readonly field?: string;
  readonly details?: AstroChartError[];
}

export interface AstroChartWarning {
  readonly code: AstroChartWarningCode;
  readonly message: string;
}
