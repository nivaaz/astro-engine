import { displayName, metadataLines, number } from "./common.js";
import {
  parseCanonicalDocument,
  validateOptions,
  type CanonicalDocument,
  type FormatOptions,
} from "./document.js";

function facts(document: CanonicalDocument): readonly string[] {
  switch (document.kind) {
    case "current-sky":
      return [
        `Moon phase: ${document.value.moonPhase.phase}; angle=${number(document.value.moonPhase.phaseAngle)} degrees`,
        "Positions:",
        ...document.value.positions.map(
          (p) =>
            `- ${p.body}: longitude=${number(p.longitude)} degrees; sign=${p.sign}; sign-degree=${number(p.signDegree)} degrees; speed=${number(p.longitudeSpeed)} degrees/day; motion=${p.retrograde ? "retrograde" : "direct"}`,
        ),
        "Tight major aspects:",
        ...(document.value.aspects.length === 0
          ? ["- none"]
          : document.value.aspects.map(
              (a) =>
                `- ${a.bodyA}/${a.bodyB}: ${a.type}; angle=${number(a.angle)} degrees; orb=${number(a.orb)} degrees; phase=${a.phase}`,
            )),
      ];
    case "upcoming-events":
      return [
        `Requested window: [${document.value.requestedWindow.start}, ${document.value.requestedWindow.end})`,
        `Search complete: ${String(document.value.complete)}`,
        `Truncated at limit: ${String(document.value.truncatedAtLimit)}`,
        `Exact-time tolerance: ${number(document.value.exactTimeToleranceSeconds)} seconds`,
        "Events:",
        ...(document.value.events.length === 0
          ? ["- none"]
          : document.value.events.map(
              (event) => `- ${event.exactAt}: ${JSON.stringify(event)}`,
            )),
      ];
    case "whole-sign-chart":
      return [
        `Location: latitude=${number(document.value.location.latitude)} degrees; east-longitude=${number(document.value.location.longitude)} degrees; timezone=${document.value.location.timezone}`,
        `Ascendant: ${number(document.value.ascendant)} degrees`,
        `Midheaven: ${number(document.value.midheaven)} degrees`,
        `First house sign: ${document.value.firstHouseSign}`,
        `Cusps: ${document.value.cusps.map(number).join(", ")} degrees`,
        "Placements:",
        ...document.value.placements.map(
          (p) => `- ${p.body}: house=${p.house}`,
        ),
      ];
    case "saturn-return":
      return [
        `Classification: ${document.value.classification}`,
        `As of: ${document.value.asOf}`,
        `Natal Saturn longitude: ${number(document.value.natalSaturnLongitude)} degrees`,
        `Orb: ${number(document.value.orb)} degrees`,
        `Status: ${document.value.status}`,
        `Status window: ${document.value.statusWindowId ?? "none"}`,
        "Return windows:",
        ...(document.value.windows.length === 0
          ? ["- none in range"]
          : document.value.windows.flatMap((window) => [
              `- ${window.id}: [${window.interval.start}, ${window.interval.end}); edge=${window.edge}`,
              ...window.passes.map(
                (pass) =>
                  `  pass ${pass.sequence}: ${pass.exactAt}; direction=${pass.direction}; id=${pass.id}`,
              ),
            ])),
      ];
    case "human-design-transits":
      return [
        "Human Design transit gates and lines:",
        ...(document.value.transits.length === 0
          ? ["- none"]
          : document.value.transits.map(
              (t) =>
                `- ${t.body}: source-longitude=${number(t.sourceLongitude)} degrees; gate=${t.gate}; line=${t.line}; mapping=${t.mappingVersion}`,
            )),
      ];
  }
}

export function formatPromptText(
  input: unknown,
  options: FormatOptions = {},
): string {
  validateOptions(options);
  const document = parseCanonicalDocument(input);
  return [
    `ASTRO ENGINE ${displayName(document.kind).toUpperCase()}`,
    ...metadataLines(document, options),
    ...facts(document),
  ]
    .join("\n")
    .concat("\n");
}
