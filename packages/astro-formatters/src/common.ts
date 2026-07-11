import type { CanonicalMetadata } from "@sukara/astro-schema";
import type { CanonicalDocument, FormatOptions } from "./document.js";
import { freshness } from "./document.js";

export function displayName(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function number(value: number): string {
  const canonical = Object.is(value, -0) ? 0 : value;
  if (Number.isInteger(canonical)) return String(canonical);
  return canonical.toFixed(9).replace(/0+$/, "").replace(/\.$/, "");
}

export function markdown(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, "<br>");
}

function singleLine(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
}

export function metadataLines(
  document: CanonicalDocument,
  options: FormatOptions,
): readonly string[] {
  const metadata: CanonicalMetadata = document.value.metadata;
  return [
    `Instant: ${metadata.calculatedAt}`,
    `Zodiac: ${metadata.zodiac}`,
    `Frame: ${metadata.frame}`,
    `Units: longitude/orb=degrees; speed=degrees/day`,
    `Valid for: [${metadata.validFor.start}, ${metadata.validFor.end})`,
    `Freshness: ${freshness(document, options)}`,
    `Schema: ${metadata.schemaVersion}`,
    `Algorithm: ${singleLine(metadata.algorithmVersion)}`,
    `Provenance: ${singleLine(metadata.provenance.providerId)} ${singleLine(metadata.provenance.providerVersion)}; data=${singleLine(metadata.provenance.dataVersion)}; quality=${metadata.provenance.quality}`,
  ];
}
