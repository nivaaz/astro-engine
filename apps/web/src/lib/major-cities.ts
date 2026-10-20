import rawMajorCities from "./major-cities.json";

/**
 * Offline major-city lookup data derived from city-timezones 1.3.4.
 * The package and its bundled data are MIT-licensed; the source is recorded
 * in docs/privacy/LOCATION_DATA.md. Coordinates are lookup context only.
 */
export type MajorCity = Readonly<{
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  population: number;
}>;

export const MAJOR_CITIES = rawMajorCities as readonly MajorCity[];

export function cityLabel(city: MajorCity): string {
  return `${city.name}, ${city.country}`;
}

export function findMajorCity(value: string): MajorCity | undefined {
  const normalized = value.trim().toLocaleLowerCase();
  if (normalized.length === 0) return undefined;
  return MAJOR_CITIES.find(
    (city) => cityLabel(city).toLocaleLowerCase() === normalized,
  );
}

export function searchMajorCities(
  value: string,
  limit = 8,
): readonly MajorCity[] {
  const normalized = value.trim().toLocaleLowerCase();
  if (normalized.length === 0) return MAJOR_CITIES.slice(0, limit);
  return MAJOR_CITIES.filter((city) =>
    cityLabel(city).toLocaleLowerCase().includes(normalized),
  ).slice(0, limit);
}
