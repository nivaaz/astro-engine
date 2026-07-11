/**
 * @astro-engine/schema
 *
 * Shared TypeScript types, validators, and constants.
 * ZERO runtime dependencies — pure types and enums.
 *
 * Derived from Mirror Mindset's proven astro-core types.
 * Source: nivaaz/astroai/src/app/lib/astro-core/types.ts
 */

export const SCHEMA_VERSION = "0.1.0";

// Re-export all types
export type {
  // Geographic
  GeoLocation,
  // Enums
  HouseSystem,
  ZodiacType,
  ZodiacSign,
  CelestialBody,
  AspectType,
  EventType,
  EventStream,
  Significance,
  AspectPhase,
  StationType,
  LunationType,
  EclipseType,
  ExportFormat,
  // Chart input
  ChartInputSource,
  ChartBirthInput,
  ChartLocationInput,
  ChartInput,
  AstroChartOptions,
  // Data structures
  PlanetPosition,
  HouseData,
  NatalChartAspect,
  NatalChart,
  // Events
  AstrologyEvent,
  TransitHit,
  EventFilter,
  ExportedEvent,
  // Errors
  AstroChartErrorCode,
  AstroChartWarningCode,
  AstroChartError,
  AstroChartWarning,
} from "./types.js";

// Re-export all constants
export {
  ZODIAC_SIGNS,
  SIGN_LONGITUDE_MAP,
  SIGN_SYMBOLS,
  SIGN_NAMES,
  ALL_BODIES,
  BODY_SYMBOLS,
  BODY_NAMES,
  OUTER_BODIES,
  ASPECT_ANGLES,
  DEFAULT_ORBS,
  ASPECT_SYMBOLS,
  PTOLEMAIC_ASPECTS,
  EVENT_STREAMS,
  STREAM_NAMES,
  SIGN_RULERS,
  SIGN_ELEMENTS,
  SIGN_MODALITIES,
} from "./constants.js";
