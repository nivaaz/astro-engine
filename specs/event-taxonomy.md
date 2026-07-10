# Event Taxonomy

How the sky is structured into events for computation, display, and export.

---

## Design Principles

1. **Separate global from local.** A conjunction is global. Its house placement is local.
2. **Significance over volume.** Not every Moon aspect deserves the same attention as Saturn stationing.
3. **Streams prevent noise.** Don't put Moon trine Mercury next to Pluto entering Aquarius.
4. **Deterministic classification.** Every event gets exactly one stream and one significance level based on rules, not opinions.

---

## Event Streams

### Stream 1: Slow Sky

Events that unfold over weeks to months. These shape the background energy.

| Event Type | Trigger | Example |
|------------|---------|---------|
| Outer-planet aspect | Saturn, Uranus, Neptune, Pluto aspect (any Ptolemaic) | Saturn square Uranus |
| Sign ingress | Any outer planet changes sign | Neptune enters Aries |
| Retrograde station | Outer planet stations retrograde or direct | Saturn stations retrograde at 7° Pisces |
| Eclipse | Solar or lunar eclipse | Solar eclipse at 29° Leo |
| Multi-pass sequence | Same aspect repeating across retrograde passes | Jupiter trine Saturn (3 passes) |

**Default significance:** `major`

### Stream 2: Lunations

The lunar cycle. High-frequency but culturally significant.

| Event Type | Trigger | Example |
|------------|---------|---------|
| New Moon | Sun-Moon conjunction | New Moon at 15° Cancer |
| First Quarter | Sun-Moon square (waxing) | First Quarter at 24° Libra |
| Full Moon | Sun-Moon opposition | Full Moon at 9° Capricorn |
| Last Quarter | Sun-Moon square (waning) | Last Quarter at 3° Aries |
| Eclipse (lunation) | Lunation within eclipse window | Full Moon Lunar Eclipse at 5° Scorpio |

**Default significance:** `notable` (eclipses: `major`)

### Stream 3: Planetary Events

Inner and middle planet activity. The daily weather.

| Event Type | Trigger | Example |
|------------|---------|---------|
| Aspect (Ptolemaic) | Conjunction, opposition, trine, square, sextile | Venus conjunct Mars |
| Aspect (minor) | Quincunx, semi-sextile, semi-square, quintile | Mercury quincunx Pluto |
| Planetary ingress | Planet changes sign | Mercury enters Virgo |
| Cazimi | Planet within 0°17' of Sun | Mercury cazimi at 8° Leo |
| Combust | Planet within 8°30' of Sun (not cazimi) | Venus combust |

**Default significance:** `daily` (major aspects between slower planets: `notable`)

### Stream 4: Daily Moon

High-frequency lunar activity. Requires aggressive filtering.

| Event Type | Trigger | Example |
|------------|---------|---------|
| Moon ingress | Moon changes sign | Moon enters Taurus |
| Void-of-course | Moon's last aspect before changing sign | VOC starts 3:42 PM |
| Moon aspect | Moon aspects any planet | Moon trine Jupiter |

**Default significance:** `daily`

---

## Significance Classification Rules

Significance is determined by a scoring system:

### Base Score (by event type)

| Event Type | Base Score |
|------------|-----------|
| Eclipse | 100 |
| Outer-planet station | 90 |
| Outer-planet ingress | 85 |
| Outer-planet aspect | 80 |
| Lunation (new/full) | 60 |
| Lunation (quarter) | 40 |
| Inner-planet major aspect | 30 |
| Inner-planet ingress | 25 |
| Cazimi | 20 |
| Moon aspect | 10 |
| Void-of-course | 5 |
| Moon ingress | 5 |

### Modifiers

| Condition | Modifier |
|-----------|----------|
| Partile (orb < 1°) | +20 |
| Applying (not yet exact) | +5 |
| Involves natal planet (if chart provided) | +30 |
| Retrograde planet | +10 |

### Thresholds

| Score Range | Significance |
|-------------|-------------|
| 70+ | `major` |
| 25–69 | `notable` |
| 0–24 | `daily` |

These thresholds are configurable. Users can adjust to personal preference.

---

## Event ID Generation

Event IDs are deterministic hashes derived from:

```
sha256(eventType + body1 + body2 + exactAtJulianDay + aspectType + passNumber)
```

Same astronomical event always produces the same ID, regardless of when or where it's computed.

---

## Orb Defaults

| Aspect | Default Max Orb |
|--------|----------------|
| Conjunction | 10° |
| Opposition | 10° |
| Trine | 8° |
| Square | 8° |
| Sextile | 6° |
| Quincunx | 3° |
| Semi-sextile | 2° |
| Semi-square | 2° |
| Sesquiquadrate | 2° |
| Quintile | 2° |
| Bi-quintile | 2° |

All orb defaults are overridable via configuration.
