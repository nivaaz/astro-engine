/**
 * @astro-engine/ephemeris — Jean Meeus Astronomical Algorithms
 *
 * Low-precision planetary position calculations based on
 * "Astronomical Algorithms" by Jean Meeus (2nd Edition).
 *
 * Accuracy targets:
 * - Sun: ~0.01° (sufficient for sign placement)
 * - Moon: ~0.5°
 * - Inner planets: ~1°
 * - Outer planets: ~0.5° with perturbations
 * - Nodes: ~0.1°
 *
 * All internal calculations use degrees. Trig functions convert as needed.
 */

import type { Planet } from './types.js';

// ─── Constants ──────────────────────────────────────────────────────

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

/** Julian centuries from J2000.0 epoch */
function julianCenturies(jd: number): number {
  return (jd - 2451545.0) / 36525.0;
}

/** Normalize angle to 0–360° */
function normalize(angle: number): number {
  let a = angle % 360;
  if (a < 0) a += 360;
  return a;
}

/** sin of angle in degrees */
function sind(d: number): number {
  return Math.sin(d * DEG);
}

/** cos of angle in degrees */
function cosd(d: number): number {
  return Math.cos(d * DEG);
}

// ─── Julian Day (Meeus Chapter 7) ──────────────────────────────────

export function dateToJulianDay(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0,
): number {
  const dayFraction = (hour + minute / 60 + second / 3600) / 24;

  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const A = Math.floor(y / 100);
  // Gregorian calendar correction (always used for dates after 1582)
  const B = year > 1582 || (year === 1582 && (month > 10 || (month === 10 && day >= 15)))
    ? 2 - A + Math.floor(A / 4)
    : 0;

  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    dayFraction +
    B -
    1524.5
  );
}

export function julianDayToDate(jd: number): Date {
  const z = Math.floor(jd + 0.5);
  const f = jd + 0.5 - z;

  let A: number;
  if (z < 2299161) {
    A = z;
  } else {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    A = z + 1 + alpha - Math.floor(alpha / 4);
  }

  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);

  const day = B - D - Math.floor(30.6001 * E);
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;

  const totalHours = f * 24;
  const hour = Math.floor(totalHours);
  const totalMinutes = (totalHours - hour) * 60;
  const minute = Math.floor(totalMinutes);
  const second = Math.floor((totalMinutes - minute) * 60);

  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

// ─── Nutation (simplified, Meeus Chapter 22) ───────────────────────

interface Nutation {
  /** Nutation in longitude (Δψ) in arcseconds */
  longitude: number;
  /** Obliquity correction (Δε) in arcseconds */
  obliquity: number;
}

function nutation(T: number): Nutation {
  // Longitude of ascending node of Moon's mean orbit
  const omega = 125.04452 - 1934.136261 * T;
  // Sun's mean longitude
  const L = 280.4665 + 36000.7698 * T;
  // Moon's mean longitude
  const Lp = 218.3165 + 481267.8813 * T;

  // Nutation in longitude (arcseconds) — two largest terms
  const dpsi =
    -17.2 * sind(omega) -
    1.32 * sind(2 * L) -
    0.23 * sind(2 * Lp) +
    0.21 * sind(2 * omega);

  // Nutation in obliquity (arcseconds)
  const deps =
    9.2 * cosd(omega) +
    0.57 * cosd(2 * L) +
    0.1 * cosd(2 * Lp) -
    0.09 * cosd(2 * omega);

  return { longitude: dpsi, obliquity: deps };
}

/** Mean obliquity of the ecliptic (Meeus eq. 22.2) */
function meanObliquity(T: number): number {
  const seconds = 21.448 - T * (46.815 + T * (0.00059 - T * 0.001813));
  return 23.0 + 26.0 / 60 + seconds / 3600;
}

// ─── Sun Position (Meeus Chapter 25) ───────────────────────────────

export interface BodyPosition {
  longitude: number;
  latitude: number;
  distance: number;
}

export function sunPosition(jd: number): BodyPosition {
  const T = julianCenturies(jd);

  // Geometric mean longitude of the Sun (degrees)
  const L0 = normalize(280.46646 + 36000.76983 * T + 0.0003032 * T * T);

  // Mean anomaly of the Sun (degrees)
  const M = normalize(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const Mrad = M * DEG;

  // Eccentricity of Earth's orbit
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;

  // Sun's equation of center
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
    0.000289 * Math.sin(3 * Mrad);

  // Sun's true longitude
  const sunLon = normalize(L0 + C);

  // Sun's true anomaly
  const v = M + C;

  // Sun's radius vector (AU)
  const R = (1.000001018 * (1 - e * e)) / (1 + e * Math.cos(v * DEG));

  // Apparent longitude (corrected for nutation and aberration)
  const nut = nutation(T);
  const omega = 125.04452 - 1934.136261 * T;
  const apparentLon = sunLon - 0.00569 - 0.00478 * sind(omega) + nut.longitude / 3600;

  return {
    longitude: normalize(apparentLon),
    latitude: 0, // Sun's ecliptic latitude is always ~0
    distance: R,
  };
}

// ─── Moon Position (Meeus Chapter 47, simplified) ──────────────────

export function moonPosition(jd: number): BodyPosition {
  const T = julianCenturies(jd);

  // Moon's mean longitude referred to mean equinox of date
  const Lp = normalize(218.3165 + 481267.8813 * T);

  // Mean anomaly of the Moon
  const Mp = normalize(134.9634 + 477198.8676 * T);

  // Sun's mean anomaly
  const M = normalize(357.5291 + 35999.0503 * T);

  // Moon's mean elongation
  const D = normalize(297.8502 + 445267.1115 * T);

  // Argument of latitude (Moon's ascending node)
  const F = normalize(93.2720 + 483202.0175 * T);

  // Longitude corrections (degrees) — main periodic terms
  const dLon =
    6.2888 * sind(Mp) +
    1.2740 * sind(2 * D - Mp) +
    0.6583 * sind(2 * D) +
    0.2136 * sind(2 * Mp) -
    0.1856 * sind(M) -
    0.1143 * sind(2 * F) +
    0.0588 * sind(2 * D - 2 * Mp) +
    0.0572 * sind(2 * D - M - Mp) +
    0.0533 * sind(2 * D + Mp) +
    0.0459 * sind(2 * D - M) +
    0.0410 * sind(Mp - M) -
    0.0305 * sind(M + Mp) -
    0.0153 * sind(2 * D - 2 * F) -
    0.0125 * sind(Mp + 2 * F) +
    0.0110 * sind(2 * D - Mp - 2 * F);

  // Latitude corrections (degrees)
  const dLat =
    5.1282 * sind(F) +
    0.2806 * sind(Mp + F) +
    0.2777 * sind(Mp - F) +
    0.1732 * sind(2 * D - F) +
    0.0554 * sind(2 * D + F - Mp) +
    0.0463 * sind(2 * D - F - Mp) +
    0.0329 * sind(2 * D + F) -
    0.0173 * sind(F + 2 * Mp) -
    0.0093 * sind(2 * D + F - 2 * Mp) +
    0.0088 * sind(F - 2 * Mp) +
    0.0085 * sind(F - Mp);

  // Distance correction
  const dDist =
    -20905 * cosd(Mp) -
    3699 * cosd(2 * D - Mp) -
    2956 * cosd(2 * D) -
    570 * cosd(2 * Mp) +
    246 * cosd(2 * D - 2 * Mp) -
    206 * cosd(2 * D - M - Mp);

  // Nutation correction
  const nut = nutation(T);

  const longitude = normalize(Lp + dLon + nut.longitude / 3600);
  const latitude = dLat; // Already in degrees
  const distance = 385000.56 + dDist; // km

  return { longitude, latitude, distance };
}

// ─── Planetary Positions (Meeus Chapter 31, low precision) ─────────

interface PlanetElements {
  /** Mean longitude (L0 + L1*T) */
  L0: number;
  L1: number;
  /** Semimajor axis (AU) */
  a: number;
  /** Eccentricity (e0 + e1*T) */
  e0: number;
  e1: number;
  /** Inclination (I0 + I1*T) degrees */
  I0: number;
  I1: number;
  /** Longitude of ascending node (Ω0 + Ω1*T) degrees */
  N0: number;
  N1: number;
  /** Argument of perihelion (ω0 + ω1*T) degrees */
  w0: number;
  w1: number;
}

// Mean orbital elements at J2000.0 (Meeus Table 31.A)
const PLANET_ELEMENTS: Record<string, PlanetElements> = {
  mercury: {
    L0: 252.2509, L1: 149474.07224,
    a: 0.387098,
    e0: 0.205635, e1: 0.000020,
    I0: 7.0047, I1: -0.005,
    N0: 48.3313, N1: -0.1254,
    w0: 29.1241, w1: 1.0179,
  },
  venus: {
    L0: 181.9804, L1: 58519.21303,
    a: 0.723332,
    e0: 0.006773, e1: -0.000048,
    I0: 3.3946, I1: -0.0008,
    N0: 76.6807, N1: -0.2780,
    w0: 54.8910, w1: 0.5082,
  },
  mars: {
    L0: 355.4330, L1: 19141.69647,
    a: 1.523679,
    e0: 0.093405, e1: 0.000091,
    I0: 1.8497, I1: -0.0008,
    N0: 49.5574, N1: -0.2950,
    w0: 286.5016, w1: 1.0699,
  },
  jupiter: {
    L0: 34.3515, L1: 3036.30277,
    a: 5.202561,
    e0: 0.048498, e1: 0.000163,
    I0: 1.3033, I1: -0.0019,
    N0: 100.4644, N1: 0.1767,
    w0: 273.8669, w1: 0.1615,
  },
  saturn: {
    L0: 50.0774, L1: 1223.50989,
    a: 9.554747,
    e0: 0.055546, e1: -0.000346,
    I0: 2.4886, I1: 0.0019,
    N0: 113.6634, N1: -0.2567,
    w0: 339.3940, w1: 0.3206,
  },
  uranus: {
    L0: 314.0550, L1: 429.86405,
    a: 19.18171,
    e0: 0.047318, e1: 0.000025,
    I0: 0.7726, I1: 0.0004,
    N0: 74.0060, N1: 0.0743,
    w0: 96.9989, w1: 0.1461,
  },
  neptune: {
    L0: 304.3487, L1: 219.8833,
    a: 30.06109,
    e0: 0.00899, e1: 0.000006,
    I0: 1.7700, I1: -0.0005,
    N0: 131.7840, N1: -0.0065,
    w0: 273.1806, w1: -0.0100,
  },
  pluto: {
    L0: 238.9290, L1: 145.1888,
    a: 39.48212,
    e0: 0.2490, e1: 0.00004,
    I0: 17.1400, I1: 0.0003,
    N0: 110.3040, N1: -0.0119,
    w0: 113.7634, w1: -0.0089,
  },
};

// ─── Perturbation terms (Meeus Table 31.B) ──────────────────────
// Jupiter perturbations (amplitude: 5.20°, longitude)</think>perturbation terms (Meeus Table 31.B)
// Jupiter perturbations (amplitude: 5.20°, longitude)
const JUPITER_PERTURB: [
  { arg: 2 * Lp - 2 * Ls - Lp + Lp, amp: -1.10 },
  { arg: 2 * Lp - Ls + Lp + 5 * Lp, amp: -0.72 },
  { arg: 5 * Ls - Lp, amp: -1.87 },
  { arg: Ls - 2 * Lj, amp: -1.46 },
  { arg: 3 * Lp - 2 * Ls - Lj, amp: -0.83 },
  { arg: 3 * Lp - 2 * Ls, amp: -0.62 },
  { arg: Lj + Ls - 3 * Lp, amp: -0.53 },
  { arg: 2 * Lj - 2 * Ls, amp: 0.44 },
  { arg: 2 * Lp - 2 * Ls, amp: -0.33 },
];

/** Saturn perturbation terms (Table 31.B) */
function saturnPerturbations(T: number, Lj: number, Ls: number, Lu: number): number {
  return (
    -0.0205 * sind(2 * Lj - 5 * Ls) +
    -0.0097 * sind(Lj - 2 * Ls) +
    0.0087 * sind(2 * Lj) +
    0.0020 * sind(2 * Lj - 4 * Ls) +
    -0.0040 * sind(3 * Lj - 5 * Ls) +
    0.0036 * sind(Lj - 3 * Ls) +
    -0.0020 * sind(2 * Lj - 6 * Ls + Lu) +
    0.0015 * sind(2 * Lj - 2 * Ls) +
    -0.0012 * sind(Lj - 2 * Ls) +
    0.0008 * sind(3 * Lj - 6 * Ls) +
    -0.0006 * sind(2 * Lj - 4 * Ls)
  );
}

/** Uranus perturbation terms (Table 31.B) */
function uranusPerturbations(T: number, Lj: number, Ls: number, Lu: number): number {
  return (
    0.0844 * sind(2 * Ls - Lu - 3 * Lj) +
    0.0352 * sind(2 * Ls - Lu - 2 * Lj) +
    -0.0306 * sind(Ls - Lu) +
    -0.0161 * sind(Ls - 2 * Lu) +
    0.0059 * sind(2 * Ls - Lu - 4 * Lj) +
    -0.0048 * sind(Ls - Lu - Lj) +
    0.0025 * sind(2 * Ls - 2 * Lu) +
    -0.0023 * sind(Ls - 2 * Lu + Lj) +
    0.0018 * sind(2 * Ls - 2 * Lu - Lj) +
    -0.0014 * sind(Ls - 2 * Lu - Lj) +
    0.0010 * sind(Ls - Lu + Lj) +
    -0.0008 * sind(3 * Ls - 2 * Lu - 2 * Lj)
  );
}

/** Compute heliocentric ecliptic coordinates for a planet */
function heliocentric(
  elements: PlanetElements,
  T: number,
): { longitude: number; latitude: number; radius: number } {
  const L = normalize(elements.L0 + elements.L1 * T);
  const e = elements.e0 + elements.e1 * T;
  const I = (elements.I0 + elements.I1 * T) * DEG;
  const N = (elements.N0 + elements.N1 * T) * DEG;
  const w = (elements.w0 + elements.w1 * T) * DEG;

  // Argument of perihelion = longitude of perihelion - longitude of ascending node
  // But w0/w1 in Meeus Table 31.A is already the argument of perihelion
  // Actually, for Meeus Chapter 31, the formula is:
  // M = L - longitude_of_perihelion
  // where longitude_of_perihelion = N + w

  const lonPerihelion = (elements.N0 + elements.N1 * T) + (elements.w0 + elements.w1 * T);
  const M = (L - lonPerihelion) * DEG; // Mean anomaly in radians

  // Solve Kepler's equation (Newton's method, 3 iterations sufficient for low precision)
  let E = M; // Initial guess
  for (let i = 0; i < 5; i++) {
    E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  }

  // True anomaly
  const v = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2),
  );

  // Heliocentric distance
  const r = elements.a * (1 - e * Math.cos(E));

  // Heliocentric ecliptic coordinates
  const cosN = Math.cos(N);
  const sinN = Math.sin(N);
  const cosVIw = Math.cos(v + w);
  const sinVIw = Math.sin(v + w);
  const cosI = Math.cos(I);
  const sinI = Math.sin(I);

  const xh = r * (cosN * cosVIw - sinN * sinVIw * cosI);
  const yh = r * (sinN * cosVIw + cosN * sinVIw * cosI);
  const zh = r * sinVIw * sinI;

  // Heliocentric ecliptic longitude and latitude
  const helioLon = Math.atan2(yh, xh) * RAD;
  const helioLat = Math.atan2(zh, Math.sqrt(xh * xh + yh * yh)) * RAD;

  return {
    longitude: helioLon,
    latitude: helioLat,
    radius: r,
  };
}

// ─── Earth's heliocentric position (for geocentric conversion) ──────

/** Compute Earth's heliocentric ecliptic longitude (from Sun position) */
function earthHeliocentricLongitude(jd: number): number {
  const sun = sunPosition(jd);
  // Earth's heliocentric longitude = Sun's geocentric longitude + 180°
  return normalize(sun.longitude + 180);
}

// ─── Planet Position (geocentric) ──────────────────────────────────

export function planetPosition(planet: Planet, jd: number): BodyPosition & { speed: number } {
  const T = julianCenturies(jd);

  // Special cases
  if (planet === 'sun') {
    const pos = sunPosition(jd);
    // Compute speed by differencing
    const pos2 = sunPosition(jd + 1);
    let speed = pos2.longitude - pos.longitude;
    if (speed > 180) speed -= 360;
    if (speed < -180) speed += 360;
    return { ...pos, speed };
  }

  if (planet === 'moon') {
    const pos = moonPosition(jd);
    const pos2 = moonPosition(jd + 1);
    let speed = pos2.longitude - pos.longitude;
    if (speed > 180) speed -= 360;
    if (speed < -180) speed += 360;
    return { ...pos, speed };
  }

  if (planet === 'north_node' || planet === 'south_node') {
    const lon = lunarNodeLongitude(T);
    const adjusted = planet === 'south_node' ? normalize(lon + 180) : lon;
    // Nodes move retrograde ~0.053°/day
    const lon2 = planet === 'south_node'
      ? normalize(lunarNodeLongitude(julianCenturies(jd + 1)) + 180)
      : lunarNodeLongitude(julianCenturies(jd + 1));
    let speed = lon2 - adjusted;
    if (speed > 180) speed -= 360;
    if (speed < -180) speed += 360;
    return { longitude: adjusted, latitude: 0, distance: 0, speed };
  }

  if (planet === 'chiron') {
    // Simplified Chiron position (mean elements)
    const lon = normalize(207.279 + 1361.252 * T + 0.31 * sind(207.279 + 1361.252 * T));
    const lon2 = normalize(207.279 + 1361.252 * (T + 1 / 36525) + 0.31 * sind(207.279 + 1361.252 * (T + 1 / 36525)));
    let speed = lon2 - lon;
    if (speed > 180) speed -= 360;
    if (speed < -180) speed += 360;
    return { longitude: lon, latitude: 0, distance: 10, speed };
  }

  // Standard planets
  const elements = PLANET_ELEMENTS[planet];
  if (!elements) {
    throw new Error(`Unknown planet: ${planet}`);
  }

  // Compute heliocentric position of the planet
  const helio = heliocentric(elements, T);

  // Compute Earth's heliocentric position
  // We need Earth's heliocentric longitude and latitude
  // Sun's geocentric ecliptic longitude gives us Earth's heliocentric longitude (+ 180°)
  const sunPos = sunPosition(jd);
  const earthHelioLon = normalize(sunPos.longitude + 180);
  // Earth's ecliptic latitude is ~0° (negligible)
  // Earth's heliocentric distance (from Sun's radius vector)
  const earthDist = sunPos.distance;

  // Convert to geocentric ecliptic coordinates
  // Using the formulas from Meeus Chapter 33
  const lonRad = helio.longitude * DEG;
  const latRad = helio.latitude * DEG;
  const earthLonRad = earthHelioLon * DEG;

  const cosLat = Math.cos(latRad);
  const xg = helio.radius * cosLat * Math.cos(lonRad) - earthDist * Math.cos(earthLonRad);
  const yg = helio.radius * cosLat * Math.sin(lonRad) - earthDist * Math.sin(earthLonRad);
  const zg = helio.radius * Math.sin(latRad);

  // Geocentric ecliptic longitude and latitude
  const geoLon = normalize(Math.atan2(yg, xg) * RAD);
  const geoLat = Math.atan2(zg, Math.sqrt(xg * xg + yg * yg)) * RAD;
  const geoDist = Math.sqrt(xg * xg + yg * yg + zg * zg);

  // Add perturbations for Jupiter, Saturn, Uranus
  let perturbedLon = geoLon;
  if (planet === 'jupiter' || planet === 'saturn' || planet === 'uranus') {
    // Need mean longitudes of Jupiter, Saturn, Uranus
    const Lj = normalize(PLANET_ELEMENTS.jupiter!.L0 + PLANET_ELEMENTS.jupiter!.L1 * T);
    const Ls = normalize(PLANET_ELEMENTS.saturn!.L0 + PLANET_ELEMENTS.saturn!.L1 * T);
    const Lu = normalize(PLANET_ELEMENTS.uranus!.L0 + PLANET_ELEMENTS.uranus!.L1 * T);

    if (planet === 'jupiter') {
      perturbedLon = normalize(perturbedLon + jupiterPerturbations(T, Lj, Ls, Lu));
    } else if (planet === 'saturn') {
      perturbedLon = normalize(perturbedLon + saturnPerturbations(T, Lj, Ls, Lu));
    } else {
      perturbedLon = normalize(perturbedLon + uranusPerturbations(T, Lj, Ls, Lu));
    }
  }

  // Apply nutation
  const nut = nutation(T);
  perturbedLon = normalize(perturbedLon + nut.longitude / 3600);

  // Compute speed by differencing (degrees/day)
  const pos2 = planetPosition(planet, jd + 1);
  let speed = pos2.longitude - perturbedLon;
  if (speed > 180) speed -= 360;
  if (speed < -180) speed += 360;

  return {
    longitude: perturbedLon,
    latitude: geoLat,
    distance: geoDist,
    speed,
  };
}

// ─── Lunar Node (mean ascending node, Meeus Chapter 11) ────────────

function lunarNodeLongitude(T: number): number {
  // Mean longitude of the ascending node of the Moon
  return normalize(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T * T * T / 467441 - T * T * T * T / 60616000);
}