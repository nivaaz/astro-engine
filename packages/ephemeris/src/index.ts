/**
 * @astro-engine/ephemeris
 * 
 * Swiss Ephemeris WASM bindings for planetary position calculations.
 * This is the ONLY package that performs raw astronomical computation.
 * 
 * License: AGPL (Swiss Ephemeris requirement)
 */

// export interface Ephemeris {
//   getPosition(planet: Planet, julianDay: JulianDay): PlanetPosition;
//   getPositions(planets: Planet[], julianDay: JulianDay): PlanetPosition[];
//   getJulianDay(date: Date, timezone: IANATimezone): JulianDay;
// }

export const EPHEMERIS_VERSION = "0.1.0";
