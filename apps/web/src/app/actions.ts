"use server";

/**
 * Server actions for computing astrology data.
 *
 * These run on the server and can access the ephemeris directly.
 * The client components call these via React Server Actions.
 */

import { dateToJulianDay, planetPosition, ALL_PLANETS } from "../../../packages/ephemeris/src/meeus.js";

interface PlanetDisplay {
  symbol: string;
  name: string;
  sign: string;
  signSymbol: string;
  degree: number;
  minute: number;
  isRetrograde: boolean;
}

interface AspectDisplay {
  bodyA: string;
  bodyB: string;
  type: string;
  orb: number;
  applying: boolean;
  symbol: string;
}

interface CurrentSky {
  timestamp: string;
  julianDay: number;
  planets: PlanetDisplay[];
  aspects: AspectDisplay[];
}

const SYMBOLS: Record<string, string> = {
  sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂",
  jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇",
  chiron: "⚷", north_node: "☊", south_node: "☋",
};

const SIGN_SYMBOLS: Record<string, string> = {
  aries: "♈", taurus: "♉", gemini: "♊", cancer: "♋",
  leo: "♌", virgo: "♍", libra: "♎", scorpio: "♏",
  sagittarius: "♐", capricorn: "♑", aquarius: "♒", pisces: "♓",
};

const SIGN_NAMES: Record<string, string> = {
  aries: "Aries", taurus: "Taurus", gemini: "Gemini", cancer: "Cancer",
  leo: "Leo", virgo: "Virgo", libra: "Libra", scorpio: "Scorpio",
  sagittarius: "Sagittarius", capricorn: "Capricorn", aquarius: "Aquarius", pisces: "Pisces",
};

const ASPECT_SYMBOLS: Record<string, string> = {
  conjunction: "☌", opposition: "☍", trine: "△", square: "□", sextile: "⚹",
};

const ASPECT_ANGLES: Record<string, number> = {
  conjunction: 0, opposition: 180, trine: 120, square: 90, sextile: 60,
};

const DEFAULT_ORBS: Record<string, number> = {
  conjunction: 10, opposition: 10, trine: 8, square: 8, sextile: 6,
};

function shortestArc(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function detectAspects(positions: Array<{ planet: string; longitude: number; speed: number }>) {
  const aspects: AspectDisplay[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i];
      const b = positions[j];
      const angle = shortestArc(a.longitude, b.longitude);
      
      for (const [type, exact] of Object.entries(ASPECT_ANGLES)) {
        const orb = Math.abs(angle - exact);
        const maxOrb = DEFAULT_ORBS[type] ?? 6;
        if (orb <= maxOrb) {
          const relSpeed = a.speed - b.speed;
          const applying = (angle < exact && relSpeed > 0) || (angle > exact && relSpeed < 0);
          aspects.push({
            bodyA: a.planet,
            bodyB: b.planet,
            type,
            orb: Math.round(orb * 10) / 10,
            applying,
            symbol: ASPECT_SYMBOLS[type] ?? type,
          });
          break;
        }
      }
    }
  }
  return aspects.sort((a, b) => a.orb - b.orb);
}

export async function getCurrentSky(): Promise<CurrentSky> {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  const second = now.getUTCSeconds();

  const jd = dateToJulianDay(year, month, day, hour, minute, second);

  const positions = ALL_PLANETS.map((planet) => {
    const pos = planetPosition(planet as any, jd);
    return { planet, ...pos };
  });

  const planets: PlanetDisplay[] = positions.map((pos) => ({
    symbol: SYMBOLS[pos.planet] ?? pos.planet,
    name: pos.planet.charAt(0).toUpperCase() + pos.planet.slice(1).replace("_", " "),
    sign: SIGN_NAMES[pos.sign] ?? pos.sign,
    signSymbol: SIGN_SYMBOLS[pos.sign] ?? "",
    degree: Math.floor(pos.signDegree),
    minute: Math.floor((pos.signDegree % 1) * 60),
    isRetrograde: pos.isRetrograde,
  }));

  const aspects = detectAspects(positions);

  return {
    timestamp: now.toISOString(),
    julianDay: jd,
    planets,
    aspects,
  };
}
