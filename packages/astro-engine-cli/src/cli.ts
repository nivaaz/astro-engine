#!/usr/bin/env node

/**
 * Astro Engine CLI
 *
 * Demonstrates the full astrology computation pipeline:
 * 1. Get current UTC time
 * 2. Compute planetary positions (ephemeris)
 * 3. Detect aspects (domain)
 * 4. Format and display (formatters)
 */

import { dateToJulianDay, planetPosition, ALL_PLANETS } from "../../ephemeris/src/meeus.js";

// ─── Symbols ─────────────────────────────────────────────────────

const PLANET_SYMBOLS: Record<string, string> = {
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

// ─── Helpers ─────────────────────────────────────────────────────

function shortestArc(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function formatDegree(signDegree: number): string {
  const d = Math.floor(signDegree);
  const m = Math.floor((signDegree - d) * 60);
  return `${d}°${String(m).padStart(2, "0")}'`;
}

function formatPlanet(planet: string, pos: { sign: string; signDegree: number; isRetrograde: boolean }): string {
  const sym = PLANET_SYMBOLS[planet] ?? planet;
  const signSym = SIGN_SYMBOLS[pos.sign] ?? "";
  const signName = SIGN_NAMES[pos.sign] ?? pos.sign;
  const degree = formatDegree(pos.signDegree);
  const retro = pos.isRetrograde ? " (Rx)" : "";
  return `${sym} ${signSym} ${degree} ${signName}${retro}`;
}

// ─── Aspect Detection ────────────────────────────────────────────

interface AspectResult {
  bodyA: string;
  bodyB: string;
  type: string;
  orb: number;
  applying: boolean;
}

function detectAspects(positions: Array<{ planet: string; longitude: number; speed: number }>): AspectResult[] {
  const aspects: AspectResult[] = [];

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
          });
          break;
        }
      }
    }
  }

  return aspects.sort((a, b) => a.orb - b.orb);
}

// ─── Main ────────────────────────────────────────────────────────

function main(): void {
  console.log("\n🌟 Astro Engine — Current Sky\n");

  // Get current UTC time
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  const second = now.getUTCSeconds();

  const jd = dateToJulianDay(year, month, day, hour, minute, second);

  console.log(`UTC: ${now.toISOString()}`);
  console.log(`Julian Day: ${jd.toFixed(4)}\n`);

  // Compute positions
  const positions = ALL_PLANETS.map((planet) => {
    const pos = planetPosition(planet as any, jd);
    return { planet, ...pos };
  });

  // Display planets
  console.log("─── Planetary Positions ───\n");
  for (const pos of positions) {
    const line = formatPlanet(pos.planet, pos);
    console.log(`  ${line}`);
  }

  // Detect and display aspects
  const aspects = detectAspects(positions);

  if (aspects.length > 0) {
    console.log("\n─── Active Aspects ───\n");
    for (const asp of aspects) {
      const symA = PLANET_SYMBOLS[asp.bodyA] ?? asp.bodyA;
      const symB = PLANET_SYMBOLS[asp.bodyB] ?? asp.bodyB;
      const aspSym = ASPECT_SYMBOLS[asp.type] ?? asp.type;
      const phase = asp.applying ? "applying" : "separating";
      console.log(`  ${symA} ${aspSym} ${symB}  ${asp.type} (${asp.orb}° ${phase})`);
    }
  }

  console.log("\n─── Summary ───\n");
  console.log(`  Planets computed: ${positions.length}`);
  console.log(`  Aspects found: ${aspects.length}`);
  console.log(`  Engine: astro-engine@0.1.0 (Meeus algorithms)`);
  console.log();
}

main();
