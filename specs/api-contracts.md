# API Contracts (Draft)

> This document defines the planned REST API surface. Implementation comes in v1.0.

---

## Base URL

```
Production:  https://api.astro-engine.dev/v1
Self-hosted: http://localhost:3001/v1
```

## Authentication

```
Authorization: Bearer <api_key>
```

API keys are issued per user. Rate limits apply by tier.

---

## Endpoints

### GET /sky/current

Returns current planetary positions and active aspects.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `location` | string | — | City name or `lat,lng` |
| `timezone` | string | UTC | IANA timezone |
| `house_system` | string | `placidus` | House system |
| `zodiac` | string | `tropical` | `tropical` or `sidereal` |
| `bodies` | string | all | Comma-separated planets |
| `format` | string | `json` | `json`, `markdown`, `plain` |

**Response:**

```json
{
  "timestamp": "2026-07-10T13:44:00Z",
  "julianDay": 2461752.072,
  "positions": [
    {
      "planet": "sun",
      "longitude": 108.45,
      "sign": "cancer",
      "signDegree": 18.45,
      "isRetrograde": false
    }
  ],
  "aspects": [
    {
      "body1": "sun",
      "body2": "mercury",
      "type": "conjunction",
      "orb": 2.3,
      "phase": "applying"
    }
  ],
  "location": {
    "city": "Sydney",
    "timezone": "Australia/Sydney"
  }
}
```

---

### GET /transits

Returns upcoming transit events for a date range.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `start` | string | today | YYYY-MM-DD |
| `end` | string | +30 days | YYYY-MM-DD |
| `streams` | string | all | `slow_sky`, `lunation`, `planetary`, `daily_moon` |
| `significance` | string | `notable,major` | Filter by significance |
| `planets` | string | all | Filter by planet |
| `aspects` | string | all | Filter by aspect type |
| `location` | string | — | For localisation |
| `format` | string | `json` | Output format |

---

### GET /transits/:id

Returns a single transit event by ID.

---

### GET /chart

Calculate a natal chart.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `datetime` | string | yes | ISO 8601 with timezone |
| `location` | string | yes | City name or `lat,lng` |
| `house_system` | string | no | Default: `placidus` |
| `zodiac` | string | no | Default: `tropical` |
| `format` | string | no | Default: `json` |

---

### GET /chart/:chartId/transits

Get transit hits against a saved natal chart.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `start` | string | today | YYYY-MM-DD |
| `end` | string | +30 days | YYYY-MM-DD |
| `significance` | string | `notable,major` | Filter |

---

### GET /calendar/:token.ics

Returns an ICS subscription feed for a user's chart.

The token is unguessable and user-specific. The feed auto-updates.

---

### GET /context

Returns prompt-ready astrology context for AI consumption.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `detail` | string | `compact` | `compact`, `detailed`, `json` |
| `location` | string | — | For localisation |
| `chart_id` | string | — | Include natal overlay |
| `days` | number | 7 | Forecast window |

**Response (compact):**

```
☀️ Sun 18° Cancer | 🌙 Moon 5° Sagittarius | ☿ Mercury 16° Cancer
♃ Jupiter 3° Leo | ♄ Saturn 7° Aries (Rx)

Current aspects:
• Sun conjunct Mercury (2.3° applying)
• Moon trine Jupiter (2.1° separating)
• Saturn square Uranus (0.8° applying)

Upcoming:
• Jul 12: Full Moon 21° Capricorn
• Jul 15: Mercury enters Leo
• Jul 18: Venus trine Saturn (exact)
```

---

## Error Responses

```json
{
  "error": {
    "code": "INVALID_LOCATION",
    "message": "Could not geocode 'Atlantis'. Try a city name or lat,lng.",
    "status": 400
  }
}
```

---

## Rate Limits

| Tier | Requests/min | Requests/day |
|------|-------------|-------------|
| Free | 10 | 100 |
| Plus | 60 | 1,000 |
| Pro | 300 | 10,000 |

Rate limit headers included in every response:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 58
X-RateLimit-Reset: 1625942400
```
