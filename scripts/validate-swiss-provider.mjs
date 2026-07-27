import { createHash } from "node:crypto";
import { cp, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const ephemerisPath = path.resolve(
  process.env.ASTRO_ENGINE_EPHEMERIS_PATH ??
    path.join(root, "apps", "web", ".private", "ephemeris"),
);
const fixture = JSON.parse(
  await readFile(
    path.join(root, "tests", "fixtures", "swiss-golden.json"),
    "utf8",
  ),
);
const manifest = JSON.parse(
  await readFile(
    path.join(root, "config/private/ephemeris-manifest.json"),
    "utf8",
  ),
);
const tolerance = fixture.reference.tolerance;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const file of manifest.files) {
  const filePath = path.join(ephemerisPath, file.name);
  const contents = await readFile(filePath);
  const hash = createHash("sha256").update(contents).digest("hex");
  assert(
    contents.byteLength === file.bytes,
    `${file.name}: byte length mismatch`,
  );
  assert(hash === file.sha256, `${file.name}: SHA-256 mismatch`);
  assert((await stat(filePath)).isFile(), `${file.name}: not a regular file`);
}

const sweph = await import("sweph");
assert(sweph.version() === "2.10.03", "Unexpected native Swiss version");
sweph.set_ephe_path(ephemerisPath);
const flags = sweph.constants.SEFLG_SWIEPH | sweph.constants.SEFLG_SPEED;
const julianDay = 2440587.5 + Date.parse(fixture.instant) / 86_400_000;
const ids = {
  sun: sweph.constants.SE_SUN,
  moon: sweph.constants.SE_MOON,
  mercury: sweph.constants.SE_MERCURY,
  venus: sweph.constants.SE_VENUS,
  mars: sweph.constants.SE_MARS,
  jupiter: sweph.constants.SE_JUPITER,
  saturn: sweph.constants.SE_SATURN,
  uranus: sweph.constants.SE_URANUS,
  neptune: sweph.constants.SE_NEPTUNE,
  pluto: sweph.constants.SE_PLUTO,
  "true-north-node": sweph.constants.SE_TRUE_NODE,
};
for (const [body, id] of Object.entries(ids)) {
  const actual = sweph.calc_ut(julianDay, id, flags);
  assert(
    actual.flag === flags,
    `${body}: unexpected return flags ${actual.flag}`,
  );
  assert(actual.error.trim() === "", `${body}: ${actual.error}`);
  const expected = fixture.positions[body];
  assert(
    Math.abs(actual.data[0] - expected.longitude) <= tolerance.longitudeDegrees,
    `${body}: longitude differs from swetest`,
  );
  assert(
    Math.abs(actual.data[3] - expected.longitudeSpeed) <=
      tolerance.longitudeSpeedDegreesPerDay,
    `${body}: speed differs from swetest`,
  );
}

const angles = sweph.houses_ex2(
  julianDay,
  0,
  fixture.angles.latitude,
  fixture.angles.longitude,
  "W",
);
assert(
  angles.flag === sweph.constants.OK,
  "Whole Sign angles returned an error",
);
assert(
  Math.abs(angles.data.points[0] - fixture.angles.ascendant) <=
    tolerance.angleDegrees,
  "Ascendant differs from swetest",
);
assert(
  Math.abs(angles.data.points[1] - fixture.angles.midheaven) <=
    tolerance.angleDegrees,
  "Midheaven differs from swetest",
);

// Prove that an incomplete data directory is rejected instead of silently
// accepting Swiss Ephemeris' documented Moshier fallback.
const incompletePath = await mkdtemp(
  path.join(os.tmpdir(), "astro-engine-ephe-"),
);
try {
  await cp(
    path.join(ephemerisPath, "sepl_18.se1"),
    path.join(incompletePath, "sepl_18.se1"),
  );
  sweph.set_ephe_path(incompletePath);
  const fallback = sweph.calc_ut(julianDay, sweph.constants.SE_MOON, flags);
  assert(
    fallback.error.includes("using Moshier"),
    "Fallback proof did not expose Moshier",
  );
  assert(fallback.error.trim() !== "", "Moshier fallback was silent");
} finally {
  await rm(incompletePath, { recursive: true, force: true });
}

const swetest = process.env.SWETEST_BIN;
if (swetest) {
  const command = spawnSync(
    swetest,
    [
      `-edir${ephemerisPath}`,
      "-b1.1.2025",
      "-ut00:00",
      "-house0,51.5,W",
      "-p0123456789t",
      "-fPls",
    ],
    { encoding: "utf8" },
  );
  assert(command.status === 0, command.stderr || "swetest failed");
  assert(
    command.stdout.includes("version 2.10.03"),
    "swetest version mismatch",
  );
  assert(command.stdout.includes("Ascendant"), "swetest did not emit angles");
  console.log(`official swetest validated: ${swetest}`);
} else {
  console.log(
    "official swetest binary not supplied; native golden checks passed",
  );
}

console.log("Swiss provider validation passed");
