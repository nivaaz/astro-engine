# Human Design gate-wheel source gate

Status: **owner-authorized for private Public V1 implementation**

Reviewed: 11 July 2026

Scope: tropical transit gate and line projection only

## Decision

The repository owner explicitly confirmed on 11 July 2026 that the existing
Mirror Mindset Human Design mapping is correct, verified, and authorized for
reuse in Astro Engine. That authorization clears the project provenance gate
for extracting its factual wheel geometry into the private
`@sukara/human-design` package.

This approval does not authorize interpretive content, BodyGraph material,
proprietary artwork/software, or public package publication. The extracted
contract is limited to gate order, tropical anchor, increasing-longitude
orientation, equal gate/line spans, and half-open boundary semantics.

## Authorized implementation evidence

Mirror Mindset source:

- Repository: `/Users/nivaazkaur/Desktop/work/astroai`
- Gate sequence and degree ranges:
  `src/app/charts/human-design/constants.ts`
- Projection and wrap behavior:
  `src/app/charts/human-design/gateMapping.ts`
- Source commit for both files:
  `31cbeee138a9d94e7d01dd3901ef8ddef00bfc61`

The verified numeric contract is:

- tropical wheel anchor: Gate 25 begins at 28°15′ Pisces (`358.25°`);
- orientation: gates advance with increasing tropical ecliptic longitude;
- gate span: `360° / 64 = 5.625°` (`5°37′30″`);
- line span: `5.625° / 6 = 0.9375°` (`56′15″`);
- intervals: half-open `[start, end)`, so an exact transition belongs to the
  gate or line that begins at that longitude; and
- normalization: longitudes wrap modulo `360°` before projection.

The source's redundant Gate 45 `endDegree` says `22°27′30″`, while Gate 12
starts at `22°37′30″`. This is a ten-minute transcription defect in the end
label, not a second wheel rule: all other entries, the verified 64-gate
sequence, and the fixed `5°37′30″` partition establish Gate 45's end as
`22°37′30″`. Astro Engine stores the sequence plus exact partition geometry
instead of reproducing redundant range labels, preventing gaps and overlaps.

## Public context and limits

- Human Design America states that the Mandala has 64 fixed gate partitions,
  each gate has six line subdivisions, and the inner wheel contains the 12
  astrological signs.
  [Human Design America: Mandala](https://hdtasks.humandesignamerica.com/mandala)
- Jovian Archive states that planetary positions on the astrological wheel map
  into 64 gate partitions. Its page gives `10° Aries -> Gate 25` as an example,
  which conflicts with the owner-verified Mirror wheel (Gate 21 at `10°`
  Aries), so that page is not used as numeric implementation evidence.
  [Jovian Archive: Gates and Hexagrams](https://jovianarchive.com/pages/gates-and-hexagrams-in-human-design)
- Jovian Archive identifies itself as the international rights holder. Its
  public terms do not independently grant reconstruction from its artwork or
  software; this implementation relies on the owner's explicit authorization
  of the independently maintained Mirror mapping, not extraction from those
  assets.
  [Jovian Archive terms](https://jovianarchive.com/pages/terms-and-conditions)

This is an engineering provenance record, not legal advice. Public publication
remains subject to the repository's explicit owner and release approvals.

## Verification contract

The package must prove:

1. every gate number `1..64` occurs exactly once;
2. all 64 exact gate starts and their immediately preceding values;
3. all 384 exact line starts, preceding values, and interval midpoints;
4. negative and multi-revolution normalization;
5. non-finite input rejection; and
6. complete gap-free, non-overlapping wheel coverage.
