import { displayName, markdown, metadataLines, number } from "./common.js";
import {
  parseCanonicalDocument,
  validateOptions,
  type CanonicalDocument,
  type FormatOptions,
} from "./document.js";

function currentSky(
  document: Extract<CanonicalDocument, { kind: "current-sky" }>,
): string[] {
  const { positions, moonPhase, aspects } = document.value;
  return [
    `Moon phase: ${displayName(moonPhase.phase)} (${number(moonPhase.phaseAngle)}°)`,
    "",
    "## Positions",
    "",
    "| Body | Longitude | Sign | Sign degree | Speed | Motion |",
    "| --- | ---: | --- | ---: | ---: | --- |",
    ...positions.map(
      (position) =>
        `| ${displayName(position.body)} | ${number(position.longitude)}° | ${displayName(position.sign)} | ${number(position.signDegree)}° | ${number(position.longitudeSpeed)}°/day | ${position.retrograde ? "retrograde" : "direct"} |`,
    ),
    "",
    "## Tight major aspects",
    "",
    ...(aspects.length === 0
      ? ["None."]
      : [
          "| Bodies | Aspect | Angle | Orb | Phase |",
          "| --- | --- | ---: | ---: | --- |",
          ...aspects.map(
            (aspect) =>
              `| ${displayName(aspect.bodyA)}–${displayName(aspect.bodyB)} | ${displayName(aspect.type)} | ${number(aspect.angle)}° | ${number(aspect.orb)}° | ${aspect.phase} |`,
          ),
        ]),
  ];
}

function events(
  document: Extract<CanonicalDocument, { kind: "upcoming-events" }>,
): string[] {
  const value = document.value;
  return [
    `Requested window: [${value.requestedWindow.start}, ${value.requestedWindow.end})`,
    `Search: ${value.complete ? "complete" : "truncated"}; exact-time tolerance=${number(value.exactTimeToleranceSeconds)} seconds`,
    "",
    "## Events",
    "",
    ...(value.events.length === 0
      ? ["None."]
      : value.events.map((event) => {
          switch (event.kind) {
            case "aspect":
              return `- ${event.exactAt} — ${displayName(event.bodyA)} ${event.aspect} ${displayName(event.bodyB)} at ${number(event.exactLongitude)}° (${event.significance}; id: ${event.id})`;
            case "ingress":
              return `- ${event.exactAt} — ${displayName(event.body)} ingress into ${displayName(event.sign)} (${event.significance}; id: ${event.id})`;
            case "station":
              return `- ${event.exactAt} — ${displayName(event.body)} stations ${event.direction} at ${number(event.longitude)}° (${event.significance}; id: ${event.id})`;
            case "lunation":
              return `- ${event.exactAt} — ${displayName(event.phase)} lunation at ${number(event.longitude)}° (${event.significance}; id: ${event.id})`;
          }
        })),
  ];
}

function wholeSign(
  document: Extract<CanonicalDocument, { kind: "whole-sign-chart" }>,
): string[] {
  const value = document.value;
  return [
    `Location: latitude=${number(value.location.latitude)}°, east-longitude=${number(value.location.longitude)}°, timezone=${markdown(value.location.timezone)}`,
    `Ascendant: ${number(value.ascendant)}°`,
    `Midheaven: ${number(value.midheaven)}°`,
    `First house sign: ${displayName(value.firstHouseSign)}`,
    `Cusps: ${value.cusps.map((cusp) => `${number(cusp)}°`).join(", ")}`,
    "",
    "## Placements",
    "",
    ...value.placements.map(
      ({ body, house }) => `- ${displayName(body)}: house ${house}`,
    ),
  ];
}

function saturnReturn(
  document: Extract<CanonicalDocument, { kind: "saturn-return" }>,
): string[] {
  const value = document.value;
  return [
    `Classification: ${value.classification}`,
    `As of: ${value.asOf}`,
    `Natal Saturn longitude: ${number(value.natalSaturnLongitude)}°`,
    `Orb: ${number(value.orb)}°`,
    `Status: ${value.status}`,
    `Status window: ${value.statusWindowId ?? "none"}`,
    "",
    "## Return windows",
    "",
    ...(value.windows.length === 0
      ? ["None in range."]
      : value.windows.flatMap((window) => [
          `### ${window.id}`,
          "",
          `Interval: [${window.interval.start}, ${window.interval.end})`,
          `Edge: ${window.edge}`,
          ...(window.passes.length === 0
            ? ["Passes: none."]
            : window.passes.map(
                (pass) =>
                  `- Pass ${pass.sequence}: ${pass.exactAt}; ${pass.direction}; id: ${pass.id}`,
              )),
          "",
        ])),
  ];
}

function humanDesign(
  document: Extract<CanonicalDocument, { kind: "human-design-transits" }>,
): string[] {
  return [
    "## Transit gates and lines",
    "",
    ...(document.value.transits.length === 0
      ? ["None."]
      : [
          "| Body | Source longitude | Gate | Line | Mapping |",
          "| --- | ---: | ---: | ---: | --- |",
          ...document.value.transits.map(
            (transit) =>
              `| ${displayName(transit.body)} | ${number(transit.sourceLongitude)}° | ${transit.gate} | ${transit.line} | ${markdown(transit.mappingVersion)} |`,
          ),
        ]),
  ];
}

function body(document: CanonicalDocument): string[] {
  switch (document.kind) {
    case "current-sky":
      return currentSky(document);
    case "upcoming-events":
      return events(document);
    case "whole-sign-chart":
      return wholeSign(document);
    case "saturn-return":
      return saturnReturn(document);
    case "human-design-transits":
      return humanDesign(document);
  }
}

export function formatMarkdown(
  input: unknown,
  options: FormatOptions = {},
): string {
  validateOptions(options);
  const document = parseCanonicalDocument(input);
  const title = displayName(document.kind);
  return [
    `# ${title}`,
    "",
    ...metadataLines(document, options).map(markdown),
    "",
    ...body(document),
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd()
    .concat("\n");
}
