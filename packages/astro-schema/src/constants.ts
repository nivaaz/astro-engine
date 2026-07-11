/**
 * @astro-engine/schema — Constants
 *
 * Zodiac signs, planets, aspects, and their properties.
 * Derived from Mirror Mindset's proven implementations.
 */

import type {
  ZodiacSign,
  CelestialBody,
  AspectType,
  EventStream,
} from "./types.js";

// ─── Zodiac Signs ────────────────────────────────────────────────

export const ZODIAC_SIGNS: readonly ZodiacSign[] = [
  "ARIES", "TAURUS", "GEMINI", "CANCER",
  "LEO", "VIRGO", "LIBRA", "SCORPIO",
  "SAGITTARIUS", "CAPRICORN", "AQUARIUS", "PISCES",
] as const;

export const SIGN_LONGITUDE_MAP: Readonly<Record<ZodiacSign, number>> = {
  ARIES: 0,
  TAURUS: 30,
  GEMINI: 60,
  CANCER: 90,
  LEO: 120,
  VIRGO: 150,
  LIBRA: 180,
  SCORPIO: 210,
  SAGITTARIUS: 240,
  CAPRICORN: 270,
  AQUARIUS: 300,
  PISCES: 330,
};

export const SIGN_SYMBOLS: Readonly<Record<ZodiacSign, string>> = {
  ARIES: "♈",
  TAURUS: "♉",
  GEMINI: "♊",
  CANCER: "♋",
  LEO: "♌",
  VIRGO: "♍",
  LIBRA: "♎",
  SCORPIO: "♏",
  SAGITTARIUS: "♐",
  CAPRICORN: "♑",
  AQUARIUS: "♒",
  PISCES: "♓",
};

export const SIGN_NAMES: Readonly<Record<ZodiacSign, string>> = {
  ARIES: "Aries",
  TAURUS: "Taurus",
  GEMINI: "Gemini",
  CANCER: "Cancer",
  LEO: "Leo",
  VIRGO: "Virgo",
  LIBRA: "Libra",
  SCORPIO: "Scorpio",
  SAGITTARIUS: "Sagittarius",
  CAPRICORN: "Capricorn",
  AQUARIUS: "Aquarius",
  PISCES: "Pisces",
};

// ─── Celestial Bodies ────────────────────────────────────────────

export const ALL_BODIES: readonly CelestialBody[] = [
  "SUN", "MOON", "MERCURY", "VENUS", "MARS",
  "JUPITER", "SATURN", "URANUS", "NEPTUNE", "PLUTO",
  "NORTH_NODE", "SOUTH_NODE", "CHIRON",
] as const;

export const BODY_SYMBOLS: Readonly<Record<CelestialBody, string>> = {
  SUN: "☉",
  MOON: "☽",
  MERCURY: "☿",
  VENUS: "♀",
  MARS: "♂",
  JUPITER: "♃",
  SATURN: "♄",
  URANUS: "♅",
  NEPTUNE: "♆",
  PLUTO: "♇",
  EARTH: "⊕",
  NORTH_NODE: "☊",
  SOUTH_NODE: "☋",
  CHIRON: "⚷",
};

export const BODY_NAMES: Readonly<Record<CelestialBody, string>> = {
  SUN: "Sun",
  MOON: "Moon",
  MERCURY: "Mercury",
  VENUS: "Venus",
  MARS: "Mars",
  JUPITER: "Jupiter",
  SATURN: "Saturn",
  URANUS: "Uranus",
  NEPTUNE: "Neptune",
  PLUTO: "Pluto",
  EARTH: "Earth",
  NORTH_NODE: "North Node",
  SOUTH_NODE: "South Node",
  CHIRON: "Chiron",
};

export const OUTER_BODIES: ReadonlySet<CelestialBody> = new Set([
  "SATURN", "URANUS", "NEPTUNE", "PLUTO",
]);

// ─── Aspects ─────────────────────────────────────────────────────

export const ASPECT_ANGLES: Readonly<Record<AspectType, number>> = {
  CONJUNCTION: 0,
  OPPOSITION: 180,
  TRINE: 120,
  SQUARE: 90,
  SEXTILE: 60,
  QUINCUNX: 150,
  SEMI_SEXTILE: 30,
  SEMI_SQUARE: 45,
  SESQUIQUADRATE: 135,
  QUINTILE: 72,
  BI_QUINTILE: 144,
};

export const DEFAULT_ORBS: Readonly<Record<AspectType, number>> = {
  CONJUNCTION: 10,
  OPPOSITION: 10,
  TRINE: 8,
  SQUARE: 8,
  SEXTILE: 6,
  QUINCUNX: 3,
  SEMI_SEXTILE: 2,
  SEMI_SQUARE: 2,
  SESQUIQUADRATE: 2,
  QUINTILE: 2,
  BI_QUINTILE: 2,
};

export const ASPECT_SYMBOLS: Readonly<Record<AspectType, string>> = {
  CONJUNCTION: "☌",
  OPPOSITION: "☍",
  TRINE: "△",
  SQUARE: "□",
  SEXTILE: "⚹",
  QUINCUNX: "⚻",
  SEMI_SEXTILE: "⚺",
  SEMI_SQUARE: "∠",
  SESQUIQUADRATE: "⚼",
  QUINTILE: "Q",
  BI_QUINTILE: "bQ",
};

export const PTOLEMAIC_ASPECTS: ReadonlySet<AspectType> = new Set([
  "CONJUNCTION", "OPPOSITION", "TRINE", "SQUARE", "SEXTILE",
]);

// ─── Event Streams ───────────────────────────────────────────────

export const EVENT_STREAMS: readonly EventStream[] = [
  "SLOW_SKY", "LUNATION", "PLANETARY", "DAILY_MOON",
] as const;

export const STREAM_NAMES: Readonly<Record<EventStream, string>> = {
  SLOW_SKY: "Slow Sky",
  LUNATION: "Lunations",
  PLANETARY: "Planetary Events",
  DAILY_MOON: "Daily Moon",
};

// ─── Sign Rulers ─────────────────────────────────────────────────

export const SIGN_RULERS: Readonly<Record<ZodiacSign, CelestialBody>> = {
  ARIES: "MARS",
  TAURUS: "VENUS",
  GEMINI: "MERCURY",
  CANCER: "MOON",
  LEO: "SUN",
  VIRGO: "MERCURY",
  LIBRA: "VENUS",
  SCORPIO: "PLUTO",
  SAGITTARIUS: "JUPITER",
  CAPRICORN: "SATURN",
  AQUARIUS: "URANUS",
  PISCES: "NEPTUNE",
};

// ─── Elements & Modalities ───────────────────────────────────────

export const SIGN_ELEMENTS: Readonly<Record<ZodiacSign, string>> = {
  ARIES: "fire",
  TAURUS: "earth",
  GEMINI: "air",
  CANCER: "water",
  LEO: "fire",
  VIRGO: "earth",
  LIBRA: "air",
  SCORPIO: "water",
  SAGITTARIUS: "fire",
  CAPRICORN: "earth",
  AQUARIUS: "air",
  PISCES: "water",
};

export const SIGN_MODALITIES: Readonly<Record<ZodiacSign, string>> = {
  ARIES: "cardinal",
  TAURUS: "fixed",
  GEMINI: "mutable",
  CANCER: "cardinal",
  LEO: "fixed",
  VIRGO: "mutable",
  LIBRA: "cardinal",
  SCORPIO: "fixed",
  SAGITTARIUS: "mutable",
  CAPRICORN: "cardinal",
  AQUARIUS: "fixed",
  PISCES: "mutable",
};
