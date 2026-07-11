/**
 * @astro-engine/domain — Type re-exports
 *
 * Re-exports canonical types from @astro-engine/schema.
 * This file exists for backward compatibility — prefer importing
 * directly from @astro-engine/schema in new code.
 */

export type {
  // Core types
  GeoLocation,
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
  // Chart types
  ChartInput,
  ChartBirthInput,
  ChartLocationInput,
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
} from "@astro-engine/schema";

// Re-export constants
export {
  ZODIAC_SIGNS,
  SIGN_LONGITUDE_MAP,
  SIGN_SYMBOLS,
  ALL_BODIES,
  BODY_SYMBOLS,
  BODY_NAMES,
  OUTER_BODIES,
  ASPECT_ANGLES,
  DEFAULT_ORBS,
  ASPECT_SYMBOLS,
  PTOLEMAIC_ASPECTS,
  SIGN_RULERS,
} from "@astro-engine/schema";
