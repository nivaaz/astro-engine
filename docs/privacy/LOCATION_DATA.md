# Location lookup data

The PWA offers an offline major-city lookup so users can supply a stable city context without sending a query, IP address, or location input to a third-party service. The lookup resolves a selected city to latitude, longitude, and an IANA timezone in the browser; the calculation route still receives only the canonical coordinates and timezone when the user explicitly calculates.

The bundled top-500 dataset is generated from `city-timezones` 1.3.4 (MIT; copyright Kevin Roberts) and stores city name, country, rounded coordinates, IANA timezone, and population ranking. It is a convenience lookup, not a geocoder or an authoritative boundary database. Users may still use browser geolocation or manual coordinates for places that are not listed.

Google Places is intentionally not a V1 dependency. It would add a Google API key, a live network request, usage billing, third-party availability, and Google Maps Platform storage/display terms for a need the offline dataset already covers. A future exact-address or venue search can be added behind a separate provider boundary without changing the canonical `GeoLocation` contract.
