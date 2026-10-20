import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import type * as SwephModule from "sweph";
import {
  AnglesRequestSchema,
  LocalAnglesSchema,
  PositionBatchSchema,
  ProviderCapabilitiesSchema,
  RawPlanetPositionSchema,
  UtcIntervalSchema,
  type AstroError,
  type AstroResult,
  type EphemerisBody,
  type EphemerisProvider,
  type PositionRequest,
} from "@sukara/astro-schema";

const SWISS_VERSION = "2.10.3-7";
const UPSTREAM_REVISION = "56e8eef0ed61c9ef4b832cb4b87af776665b30fd";
const EXPECTED_FLAGS = 2 | 256; // SEFLG_SWIEPH | SEFLG_SPEED
const DATA_RANGE = UtcIntervalSchema.parse({
  start: "1800-01-01T00:00:00.000Z",
  end: "2400-01-01T00:00:00.000Z",
});
const PROVENANCE = {
  providerId: "swiss-ephemeris-private",
  providerVersion: SWISS_VERSION,
  dataVersion: `aloistr/swisseph@${UPSTREAM_REVISION}:sepl_18,semo_18`,
  quality: "production" as const,
};

const BODY_IDS: Readonly<Record<EphemerisBody, string>> = {
  sun: "SE_SUN",
  moon: "SE_MOON",
  mercury: "SE_MERCURY",
  venus: "SE_VENUS",
  mars: "SE_MARS",
  jupiter: "SE_JUPITER",
  saturn: "SE_SATURN",
  uranus: "SE_URANUS",
  neptune: "SE_NEPTUNE",
  pluto: "SE_PLUTO",
  "true-north-node": "SE_TRUE_NODE",
};

const FILES = [
  {
    name: "sepl_18.se1",
    bytes: 484061,
    sha256: "ca1393ceab3a44fbc895887cf789c68819ae6a1cbc9b22225872dbe4ccd99a66",
  },
  {
    name: "semo_18.se1",
    bytes: 1304771,
    sha256: "1ca07bd67c24374d77226180c20a4f9996cba013697894810518e7eb582ca4f7",
  },
] as const;

type Sweph = typeof SwephModule;

function julianDayUtc(instant: string): number {
  return 2440587.5 + Date.parse(instant) / 86_400_000;
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

async function verifyDataDirectory(directory: string): Promise<void> {
  for (const file of FILES) {
    const filePath = path.join(directory, file.name);
    const contents = await readFile(filePath);
    const actualHash = createHash("sha256").update(contents).digest("hex");
    if (contents.byteLength !== file.bytes || actualHash !== file.sha256) {
      throw new Error(`Ephemeris integrity check failed for ${file.name}`);
    }
  }
}

async function loadRuntime(): Promise<Sweph> {
  const directory = path.resolve(
    process.env["ASTRO_ENGINE_EPHEMERIS_PATH"] ??
      path.join(process.cwd(), ".private", "ephemeris"),
  );
  for (const file of FILES) {
    const filePath = path.join(directory, file.name);
    const metadata = await stat(filePath);
    if (!metadata.isFile())
      throw new Error(`Missing ephemeris file ${file.name}`);
  }
  await verifyDataDirectory(directory);

  const sweph = await import("sweph");
  if (sweph.version() !== "2.10.03") {
    throw new Error("Unexpected Swiss Ephemeris native library version");
  }
  // Swiss Ephemeris settings are process-global. This is intentionally called
  // once during initialization; requests never mutate the global path.
  sweph.set_ephe_path(directory);
  return sweph;
}

let runtimePromise: Promise<Sweph> | undefined;
function runtime(): Promise<Sweph> {
  runtimePromise ??= loadRuntime();
  return runtimePromise;
}

function nativeError(error: unknown): AstroError {
  return {
    code: "provider-unavailable",
    message:
      error instanceof Error
        ? "Swiss Ephemeris could not calculate the requested result"
        : "Swiss Ephemeris could not calculate the requested result",
    retryable: true,
  };
}

function providerResult<T>(value: T): AstroResult<T> {
  return { ok: true, value };
}

function createProvider(sweph: Sweph): EphemerisProvider {
  const capabilities = ProviderCapabilitiesSchema.parse({
    positions: true,
    angles: true,
    supportedRange: DATA_RANGE,
    maxBodiesPerRequest: 11,
  });

  return {
    id: PROVENANCE.providerId,
    capabilities,
    async getPositions(request: PositionRequest) {
      try {
        const positions = request.bodies.map((body) => {
          const planetId = Number(
            sweph.constants[BODY_IDS[body] as keyof typeof sweph.constants],
          );
          const result = sweph.calc_ut(
            julianDayUtc(request.instant),
            planetId,
            EXPECTED_FLAGS,
          );
          if (
            result.flag !== EXPECTED_FLAGS ||
            result.error.trim() !== "" ||
            !Number.isFinite(result.data[0]) ||
            !Number.isFinite(result.data[3])
          ) {
            throw new Error(
              "Swiss Ephemeris did not honor the requested flags",
            );
          }
          return RawPlanetPositionSchema.parse({
            body,
            instant: request.instant,
            longitude: normalizeDegrees(result.data[0]),
            longitudeSpeed: result.data[3],
          });
        });
        return providerResult(
          PositionBatchSchema.parse({
            instant: request.instant,
            positions,
            provenance: PROVENANCE,
          }),
        );
      } catch (error) {
        return { ok: false, error: nativeError(error) };
      }
    },
    async getLocalAngles(input) {
      try {
        const request = AnglesRequestSchema.parse(input);
        const result = sweph.houses_ex2(
          julianDayUtc(request.instant),
          0,
          request.location.latitude,
          request.location.longitude,
          "W",
        );
        if (result.flag !== sweph.constants.OK || result.error.trim() !== "") {
          throw new Error(
            "Swiss Ephemeris could not calculate Whole Sign angles",
          );
        }
        return providerResult(
          LocalAnglesSchema.parse({
            ...request,
            ascendant: normalizeDegrees(result.data.points[0]),
            midheaven: normalizeDegrees(result.data.points[1]),
            provenance: PROVENANCE,
          }),
        );
      } catch (error) {
        return { ok: false, error: nativeError(error) };
      }
    },
  };
}

export async function resolveSwissEphemerisProvider(): Promise<EphemerisProvider> {
  return createProvider(await runtime());
}

export const swissProviderMetadata = {
  providerVersion: SWISS_VERSION,
  upstreamRevision: UPSTREAM_REVISION,
  supportedRange: DATA_RANGE,
} as const;
