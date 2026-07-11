/**
 * Unicode symbols for planets, aspects, and zodiac signs.
 *
 * These are standard astronomical/astrological symbols
 * widely supported across modern fonts and terminals.
 */

import type { Planet, AspectType, ZodiacSign } from "./types.js";

// ─── Planet Symbols ──────────────────────────────────────────────

const PLANET_SYMBOLS: Record<Planet, string> = {
  sun: "☉",
  moon: "☽",
  mercury: "☿",
  venus: "♀",
  mars: "♂",
  jupiter: "♃",
  saturn: "♄",
  uranus: "♅",
  neptune: "♆",
  pluto: "♇",
  chiron: "⚷",
  north_node: "☊",
  south_node: "☋",
  lilith: "⚸",
  ceres: "⚳",
  pallas: "⚴",
  juno: "⚵",
  vesta: "⚶",
};

const PLANET_NAMES: Record<Planet, string> = {
  sun: "Sun",
  moon: "Moon",
  mercury: "Mercury",
  venus: "Venus",
  mars: "Mars",
  jupiter: "Jupiter",
  saturn: "Saturn",
  uranus: "Uranus",
  neptune: "Neptune",
  pluto: "Pluto",
  chiron: "Chiron",
  north_node: "North Node",
  south_node: "South Node",
  lilith: "Lilith",
  ceres: "Ceres",
  pallas: "Pallas",
  juno: "Juno",
  vesta: "Vesta",
};

// ─── Aspect Symbols ──────────────────────────────────────────────

const ASPECT_SYMBOLS: Record<AspectType, string> = {
  conjunction: "☌",
  opposition: "☍",
  trine: "△",
  square: "□",
  sextile: "⚹",
  quincunx: "⚻",
  semi_sextile: "⚺",
  semi_square: "∠",
  sesquiquadrate: "⚼",
  quintile: "Q",
  bi_quintile: "bQ",
};

// ─── Zodiac Sign Symbols & Names ─────────────────────────────────

const SIGN_SYMBOLS: Record<ZodiacSign, string> = {
  aries: "♈",
  taurus: "♉",
  gemini: "♊",
  cancer: "♋",
  leo: "♌",
  virgo: "♍",
  libra: "♎",
  scorpio: "♏",
  sagittarius: "♐",
  capricorn: "♑",
  aquarius: "♒",
  pisces: "♓",
};

const SIGN_NAMES: Record<ZodiacSign, string> = {
  aries: "Aries",
  taurus: "Taurus",
  gemini: "Gemini",
  cancer: "Cancer",
  leo: "Leo",
  virgo: "Virgo",
  libra: "Libra",
  scorpio: "Scorpio",
  sagittarius: "Sagittarius",
  capricorn: "Capricorn",
  aquarius: "Aquarius",
  pisces: "Pisces",
};

// ─── Stream Display Names ────────────────────────────────────────

const STREAM_NAMES: Record<string, string> = {
  slow_sky: "Slow Sky",
  lunation: "Lunations",
  planetary: "Planetary Events",
  daily_moon: "Daily Moon",
};

export {
  PLANET_SYMBOLS,
  PLANET_NAMES,
  ASPECT_SYMBOLS,
  SIGN_SYMBOLS,
  SIGN_NAMES,
  STREAM_NAMES,
};