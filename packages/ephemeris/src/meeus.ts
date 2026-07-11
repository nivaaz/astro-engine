/**
 * @astro-engine/ephemeris — Jean Meeus Astronomical Algorithms
 *
 * Low-precision planetary position calculations based on
 * "Astronomical Algorithms" by Jean Meeus (2nd Edition).
 *
 * Accuracy: Sun ~0.01°, Moon ~0.5°, inner planets ~1°, outer ~0.5°
 */

import type { Planet, PlanetPosition, ZodiacSign } from './types.js';
import { ZODIAC_SIGNS } from './types.js';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function julianCenturies(jd: number): number {
  return (jd - 2451545.0) / 36525.0;
}

function normalize(angle: number): number {
  let a = angle % 360;
  if (a < 0) a += 360;
  return a;
}

function sind(d: number): number { return Math.sin(d * DEG); }
function cosd(d: number): number { return Math.cos(d * DEG); }

// ─── Julian Day (Meeus Ch. 7) ──────────────────────────────────

export function dateToJulianDay(
  year: number, month: number, day: number,
  hour = 0, minute = 0, second = 0,
): number {
  const dayFrac = (hour + minute / 60 + second / 3600) / 24;
  let y = year, m = month;
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = year > 1582 || (year === 1582 && (month > 10 || (month === 10 && day >= 15)))
    ? 2 - A + Math.floor(A / 4) : 0;
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + dayFrac + B - 1524.5;
}

export function julianDayToDate(jd: number): Date {
  const z = Math.floor(jd + 0.5);
  const f = jd + 0.5 - z;
  let A: number;
  if (z < 2299161) { A = z; }
  else { const alpha = Math.floor((z - 1867216.25) / 36524.25); A = z + 1 + alpha - Math.floor(alpha / 4); }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const day = B - D - Math.floor(30.6001 * E);
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;
  const totalH = f * 24;
  const hour = Math.floor(totalH);
  const totalM = (totalH - hour) * 60;
  const minute = Math.floor(totalM);
  const second = Math.floor((totalM - minute) * 60);
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

// ─── Nutation (simplified, Meeus Ch. 22) ────────────────────────

function nutation(T: number): { longitude: number; obliquity: number } {
  const omega = 125.04452 - 1934.136261 * T;
  const L = 280.4665 + 36000.7698 * T;
  const Lp = 218.3165 + 481267.8813 * T;
  return {
    longitude: -17.2 * sind(omega) - 1.32 * sind(2 * L) - 0.23 * sind(2 * Lp) + 0.21 * sind(2 * omega),
    obliquity: 9.2 * cosd(omega) + 0.57 * cosd(2 * L) + 0.1 * cosd(2 * Lp) - 0.09 * cosd(2 * omega),
  };
}

// ─── Sun Position (Meeus Ch. 25) ───────────────────────────────

export interface BodyPosition { longitude: number; latitude: number; distance: number; }

export function sunPosition(jd: number): BodyPosition {
  const T = julianCenturies(jd);
  const L0 = normalize(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M = normalize(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
  const C = (1.914602 - 0.004817 * T) * sind(M) + (0.019993 - 0.000101 * T) * sind(2 * M) + 0.000289 * sind(3 * M);
  const sunLon = normalize(L0 + C);
  const v = M + C;
  const R = (1.000001018 * (1 - e * e)) / (1 + e * cosd(v));
  const nut = nutation(T);
  const omega = 125.04452 - 1934.136261 * T;
  const apparentLon = sunLon - 0.00569 - 0.00478 * sind(omega) + nut.longitude / 3600;
  return { longitude: normalize(apparentLon), latitude: 0, distance: R };
}

// ─── Moon Position (Meeus Ch. 47, simplified) ──────────────────

export function moonPosition(jd: number): BodyPosition {
  const T = julianCenturies(jd);
  const Lp = normalize(218.3165 + 481267.8813 * T);
  const Mp = normalize(134.9634 + 477198.8676 * T);
  const M = normalize(357.5291 + 35999.0503 * T);
  const D = normalize(297.8502 + 445267.1115 * T);
  const F = normalize(93.2720 + 483202.0175 * T);
  const dLon = 6.2888 * sind(Mp) + 1.2740 * sind(2 * D - Mp) + 0.6583 * sind(2 * D) + 0.2136 * sind(2 * Mp) - 0.1856 * sind(M) - 0.1143 * sind(2 * F) + 0.0588 * sind(2 * D - 2 * Mp) + 0.0572 * sind(2 * D - M - Mp) + 0.0533 * sind(2 * D + Mp) + 0.0459 * sind(2 * D - M) + 0.0410 * sind(Mp - M) - 0.0305 * sind(M + Mp) - 0.0153 * sind(2 * D - 2 * F) - 0.0125 * sind(Mp + 2 * F) + 0.0110 * sind(2 * D - Mp - 2 * F);
  const dLat = 5.1282 * sind(F) + 0.2806 * sind(Mp + F) + 0.2777 * sind(Mp - F) + 0.1732 * sind(2 * D - F) + 0.0554 * sind(2 * D + F - Mp) + 0.0463 * sind(2 * D - F - Mp) + 0.0329 * sind(2 * D + F) - 0.0173 * sind(F + 2 * Mp) - 0.0093 * sind(2 * D + F - 2 * Mp) + 0.0088 * sind(F - 2 * Mp) + 0.0085 * sind(F - Mp);
  const dDist = -20905 * cosd(Mp) - 3699 * cosd(2 * D - Mp) - 2956 * cosd(2 * D) - 570 * cosd(2 * Mp) + 246 * cosd(2 * D - 2 * Mp) - 206 * cosd(2 * D - M - Mp);
  const nut = nutation(T);
  return { longitude: normalize(Lp + dLon + nut.longitude / 3600), latitude: dLat, distance: 385000.56 + dDist };
}

// ─── Planetary Positions (Meeus Ch. 31) ────────────────────────

interface PlanetElements {
  L0: number; L1: number; a: number;
  e0: number; e1: number;
  I0: number; I1: number;
  N0: number; N1: number;
  w0: number; w1: number;
}

const ELEMENTS: Record<string, PlanetElements> = {
  mercury: { L0: 252.2509, L1: 149474.07224, a: 0.387098, e0: 0.205635, e1: 0.000020, I0: 7.0047, I1: -0.005, N0: 48.3313, N1: -0.1254, w0: 29.1241, w1: 1.0179 },
  venus:   { L0: 181.9804, L1: 58519.21303, a: 0.723332, e0: 0.006773, e1: -0.000048, I0: 3.3946, I1: -0.0008, N0: 76.6807, N1: -0.2780, w0: 54.8910, w1: 0.5082 },
  mars:    { L0: 355.4330, L1: 19141.69647, a: 1.523679, e0: 0.093405, e1: 0.000091, I0: 1.8497, I1: -0.0008, N0: 49.5574, N1: -0.2950, w0: 286.5016, w1: 1.0699 },
  jupiter: { L0: 34.3515, L1: 3036.30277, a: 5.202561, e0: 0.048498, e1: 0.000163, I0: 1.3033, I1: -0.0019, N0: 100.4644, N1: 0.1767, w0: 273.8669, w1: 0.1615 },
  saturn:  { L0: 50.0774, L1: 1223.50989, a: 9.554747, e0: 0.055546, e1: -0.000346, I0: 2.4886, I1: 0.0019, N0: 113.6634, N1: -0.2567, w0: 339.3940, w1: 0.3206 },
  uranus:  { L0: 314.0550, L1: 429.86405, a: 19.18171, e0: 0.047318, e1: 0.000025, I0: 0.7726, I1: 0.0004, N0: 74.0060, N1: 0.0743, w0: 96.9989, w1: 0.1461 },
  neptune: { L0: 304.3487, L1: 219.8833, a: 30.06109, e0: 0.00899, e1: 0.000006, I0: 1.7700, I1: -0.0005, N0: 131.7840, N1: -0.0065, w0: 273.1806, w1: -0.0100 },
  pluto:   { L0: 238.9290, L1: 145.1888, a: 39.48212, e0: 0.2490, e1: 0.00004, I0: 17.1400, I1: 0.0003, N0: 110.3040, N1: -0.0119, w0: 113.7634, w1: -0.0089 },
};

function heliocentric(el: PlanetElements, T: number): { lon: number; lat: number; r: number } {
  const L = normalize(el.L0 + el.L1 * T);
  const e = el.e0 + el.e1 * T;
  const I = (el.I0 + el.I1 * T) * DEG;
  const N = (el.N0 + el.N1 * T) * DEG;
  const w = (el.w0 + el.w1 * T) * DEG;
  const M = normalize(L - (el.w0 + el.w1 * T)) * DEG;
  const C = (2 * e - e * e * e / 4) * Math.sin(M) + 5 * e * e / 4 * Math.sin(2 * M);
  const v = M + C;
  const r = el.a * (1 - e * e) / (1 + e * Math.cos(v));
  const lon = normalize((v + w) * RAD);
  const x = r * (Math.cos(N) * cosd(lon) - Math.sin(N) * sind(lon) * Math.cos(I));
  const y = r * (Math.sin(N) * cosd(lon) + Math.cos(N) * sind(lon) * Math.cos(I));
  const z = r * sind(lon) * Math.sin(I);
  return { lon, lat: Math.atan2(z, Math.sqrt(x * x + y * y)) * RAD, r };
}

export function getZodiacSign(longitude: number): { sign: ZodiacSign; signDegree: number; minute: number; second: number } {
  const lon = normalize(longitude);
  const signIndex = Math.floor(lon / 30) % 12;
  const sign = ZODIAC_SIGNS[signIndex]!;
  const signDegree = lon - signIndex * 30;
  const minute = Math.floor((signDegree % 1) * 60);
  const second = Math.floor(((signDegree % 1) * 60 - minute) * 60);
  return { sign, signDegree, minute, second };
}

export function planetPosition(planet: Planet, jd: number): PlanetPosition {
  const T = julianCenturies(jd);

  if (planet === 'sun') {
    const s = sunPosition(jd);
    const s2 = sunPosition(jd + 1);
    let speed = normalize(s2.longitude - s.longitude);
    if (speed > 180) speed -= 360;
    const si = getZodiacSign(s.longitude);
    return { planet, longitude: s.longitude, latitude: s.latitude, distance: s.distance, speed, sign: si.sign, signDegree: si.signDegree, minute: si.minute, second: si.second, isRetrograde: false };
  }

  if (planet === 'moon') {
    const m = moonPosition(jd);
    const m2 = moonPosition(jd + 1);
    let speed = normalize(m2.longitude - m.longitude);
    if (speed > 180) speed -= 360;
    const si = getZodiacSign(m.longitude);
    return { planet, longitude: m.longitude, latitude: m.latitude, distance: m.distance, speed, sign: si.sign, signDegree: si.signDegree, minute: si.minute, second: si.second, isRetrograde: speed < 0 };
  }

  if (planet === 'north_node' || planet === 'south_node') {
    const nodeLon = normalize(125.0445 - 1934.1363 * T);
    const lon = planet === 'south_node' ? normalize(nodeLon + 180) : nodeLon;
    const speed = -0.05295;
    const si = getZodiacSign(lon);
    return { planet, longitude: lon, latitude: 0, distance: 0, speed, sign: si.sign, signDegree: si.signDegree, minute: si.minute, second: si.second, isRetrograde: true };
  }

  if (planet === 'chiron') {
    const lon = normalize(207.55 + 1368.3 * T);
    const lon2 = normalize(207.55 + 1368.3 * (T + 1 / 36525));
    let speed = normalize(lon2 - lon);
    if (speed > 180) speed -= 360;
    const si = getZodiacSign(lon);
    return { planet, longitude: lon, latitude: 0, distance: 10, speed, sign: si.sign, signDegree: si.signDegree, minute: si.minute, second: si.second, isRetrograde: speed < 0 };
  }

  const el = ELEMENTS[planet];
  if (!el) throw new Error(`Unknown planet: ${planet}`);

  const helio = heliocentric(el, T);
  const sun = sunPosition(jd);
  const xGeo = helio.r * cosd(helio.lon) + sun.distance * cosd(sun.longitude);
  const yGeo = helio.r * sind(helio.lon) + sun.distance * sind(sun.longitude);
  const longitude = normalize(Math.atan2(yGeo, xGeo) * RAD);

  const helio2 = heliocentric(el, T + 1 / 36525);
  const sun2 = sunPosition(jd + 1);
  const xGeo2 = helio2.r * cosd(helio2.lon) + sun2.distance * cosd(sun2.longitude);
  const yGeo2 = helio2.r * sind(helio2.lon) + sun2.distance * sind(sun2.longitude);
  const lon2 = normalize(Math.atan2(yGeo2, xGeo2) * RAD);
  let speed = normalize(lon2 - longitude);
  if (speed > 180) speed -= 360;

  const si = getZodiacSign(longitude);
  return { planet, longitude, latitude: helio.lat * helio.r / (helio.r + sun.distance), distance: helio.r + sun.distance, speed, sign: si.sign, signDegree: si.signDegree, minute: si.minute, second: si.second, isRetrograde: speed < 0 };
}

export const ALL_PLANETS: readonly Planet[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron', 'north_node', 'south_node',
] as const;
