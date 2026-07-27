import { createHash } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const manifestPath = path.join(
  repositoryRoot,
  "config",
  "private",
  "ephemeris-manifest.json",
);
const targetDirectory = path.join(
  repositoryRoot,
  "apps",
  "web",
  ".private",
  "ephemeris",
);

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
if (
  typeof manifest.revision !== "string" ||
  !/^[0-9a-f]{40}$/.test(manifest.revision) ||
  !Array.isArray(manifest.files) ||
  manifest.files.length === 0
) {
  throw new Error("Invalid private ephemeris manifest");
}

await mkdir(targetDirectory, { recursive: true });

async function digest(filePath) {
  const contents = await readFile(filePath);
  return {
    bytes: contents.byteLength,
    sha256: createHash("sha256").update(contents).digest("hex"),
  };
}

for (const file of manifest.files) {
  if (
    typeof file?.name !== "string" ||
    typeof file?.path !== "string" ||
    !Number.isSafeInteger(file?.bytes) ||
    typeof file?.sha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(file.sha256)
  ) {
    throw new Error("Invalid file entry in private ephemeris manifest");
  }

  const destination = path.join(targetDirectory, file.name);
  let current;
  try {
    current = await digest(destination);
  } catch {
    current = undefined;
  }

  if (current?.bytes !== file.bytes || current.sha256 !== file.sha256) {
    const url = `https://raw.githubusercontent.com/aloistr/swisseph/${manifest.revision}/${file.path}`;
    const response = await fetch(url, {
      headers: { accept: "application/octet-stream" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${file.name}: HTTP ${response.status}`);
    }
    const downloaded = Buffer.from(await response.arrayBuffer());
    const actual = {
      bytes: downloaded.byteLength,
      sha256: createHash("sha256").update(downloaded).digest("hex"),
    };
    if (actual.bytes !== file.bytes || actual.sha256 !== file.sha256) {
      throw new Error(
        `Integrity check failed for ${file.name}: expected ${file.bytes}/${file.sha256}, got ${actual.bytes}/${actual.sha256}`,
      );
    }
    const temporary = `${destination}.${process.pid}.tmp`;
    await writeFile(temporary, downloaded, { flag: "wx" });
    await rename(temporary, destination);
    current = actual;
  }

  const verified = await stat(destination);
  if (verified.size !== file.bytes) {
    throw new Error(`Verified file size changed for ${file.name}`);
  }
  console.log(`verified ${file.name} (${file.bytes} bytes, ${file.sha256})`);
}

console.log(
  `Swiss Ephemeris ${manifest.revision} ready at ${path.relative(repositoryRoot, targetDirectory)}`,
);
