/**
 * @astro-engine/domain — Local type definitions
 *
 * Canonical types derived from specs/astrology-event.schema.ts.
 * These will eventually move to @astro-engine/schema; defined here
 * so the package is self-contained while schema is a stub.
 */

// ─── Branded Types ───────────────────────────────────────────────

/** Degrees of arc (0–360) */
export type Degree = number & { readonly __brand: "Degree" };

/** Orb in degrees */
export type OrbDegrees = number & { readonly __brand: "OrbDegrees" };

/** Julian Day Number — astronomical time standard */
export type JulianDay = number & { readonly __brand: "JulianDay" };

/** ISO 8601 timestamp in UTC */
export type UTCTimestamp = string & { readonly __brand: "UTCTimestamp" };

/** IANA timezone identifier */
export type IANATimezone = string & { readonly __brand: "IANATimezone" };

// ─── Enums ───────────────────────────────────────────────────────

export type Planet =
  | "sun" | "moon" | "mercury" | "venus" | "mars"
  | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto"
  | "chiron" | "north_node" | "south_node"
  | "lilith" | "ceres" | "pallas" | "juno" | "vesta";

export type ZodiacSign =
  | "aries" | "taurus" | "gemini" | "cancer"
  | "leo" | "virgo" | "libra" | "scorpio"
  | "sagittarius" | "capricorn" | "aquarius" | "pisces";

export type AspectType =
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

export type EventType =
  | "aspect"
  | "ingress"
  | "station"
  | "lunation"
  | "eclipse"
  | "void_of_course"
  | "cazimi"
  | "combust";

export type EventStream =
  | "slow_sky"
  | "lunation"
  | "planetary"
  | "daily_moon";

export type Significance =
  | "daily"
  | "notable"
  | "major";

export type AspectPhase =
  | "applying"
  | "exact"
  | "separating";

export type EclipseType =
  | "solar_new" | "solar_annular" | "solar_total" | "solar_hybrid"
  | "lunar_penumbral" | "lunar_partial" | "lunar_total";

export type LunationType =
  | "new_moon" | "waxing_crescent" | "first_quarter" | "waxing_gibbous"
  | "full_moon" | "waning_gibbous" | "last_quarter" | "waning_crescent";

export type StationType = "retrograde" | "direct";

export type HouseSystem =
  | "placidus" | "whole_sign" | "equal" | "koch"
  | "regiomontanus" | "campanus" | "topocentric" | "porphyry";

export type ZodiacType = "tropical" | "sidereal";

// ─── Core Data Structures ────────────────────────────────────────

export interface PlanetPosition {
  readonly planet: Planet;
  readonly longitude: Degree;
  readonly latitude: Degree;
  readonly distance: number;
  readonly speed: number;             // degrees per day (negative = retrograde)
  readonly sign: ZodiacSign;
  readonly signDegree: Degree;
  readonly minute: number;
  readonly second: number;
  readonly house?: number;
  readonly isRetrograde: boolean;
}

export interface Aspect {
  readonly planetA: Planet;
  readonly planetB: Planet;
  readonly type: AspectType;
  readonly exactAngle: Degree;
  readonly orb: OrbDegrees;
  readonly maxOrb: OrbDegrees;
  readonly phase: AspectPhase;
  readonly isPartile: boolean;
  readonly isApplying: boolean;
  readonly pass?: number;
}

export interface AspectConfig {
  readonly aspects?: readonly AspectType[];
  readonly orbOverrides?: Partial<Record<AspectType, number>>;
  readonly planetPairs?: readonly [Planet, Planet][];
  readonly excludePlanets?: readonly Planet[];
  readonly maxOrb?: number;
}

export interface HouseData {
  readonly system: HouseSystem;
  readonly cusps: readonly Degree[];
  readonly ascendant: Degree;
  readonly midheaven: Degree;
  readonly vertex?: Degree;
  readonly armc?: Degree;
}

export interface LocationData {
  readonly latitude: number;
  readonly longitude: number;
  readonly altitude?: number;
  readonly timezone: IANATimezone;
  readonly city?: string;
  readonly country?: string;
}

export interface AstrologyEvent {
  readonly id: string;
  readonly type: EventType;
  readonly stream: EventStream;
  readonly significance: Significance;
  readonly exactAtUtc: UTCTimestamp;
  readonly exactAtJulianDay: JulianDay;
  readonly bodies: readonly Planet[];
  readonly positions: readonly PlanetPosition[];
  readonly aspect?: Aspect;
  readonly ingressTo?: ZodiacSign;
  readonly ingressFrom?: ZodiacSign;
  readonly station?: StationType;
  readonly lunation?: LunationType;
  readonly eclipse?: EclipseType;
  readonly sign: ZodiacSign;
  readonly degree: Degree;
  readonly isRetrograde: boolean;
  readonly passNumber?: number;
  readonly totalPasses?: number;
  readonly createdAt: UTCTimestamp;
  readonly version: string;
}

export interface NatalChart {
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
    readonly ayanamsa?: string;
    readonly calculatedAt: UTCTimestamp;
    readonly engine: string;
  };
}

export interface TransitHit {
  readonly transitEvent: AstrologyEvent;
  readonly natalPlanet: Planet;
  readonly aspect: Aspect;
  readonly significance: Significance;
  readonly interpretation?: string;
}

export interface EventFilter {
  readonly planets?: readonly Planet[];
  readonly aspects?: readonly AspectType[];
  readonly eventTypes?: readonly EventType[];
  readonly streams?: readonly EventStream[];
  readonly significance?: readonly Significance[];
  readonly signs?: readonly ZodiacSign[];
  readonly maxOrb?: OrbDegrees;
  readonly dateRange?: {
    readonly start: string;
    readonly end: string;
  };
  readonly location?: LocationData;
  readonly includeRetrogrades?: boolean;
}
