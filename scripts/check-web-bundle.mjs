import { readFile, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import path from "node:path";

const nextRoot = path.resolve("apps/web/.next");
const buildManifest = JSON.parse(
  await readFile(path.join(nextRoot, "build-manifest.json"), "utf8"),
);
const reference = await readFile(
  path.join(nextRoot, "server/app/page_client-reference-manifest.js"),
  "utf8",
);
const marker = 'globalThis.__RSC_MANIFEST["/page"] = ';
const start = reference.indexOf(marker);
if (start < 0)
  throw new Error("Page client reference manifest has an unknown shape");
const routeManifest = JSON.parse(
  reference.slice(start + marker.length, reference.lastIndexOf(";")),
);
const routeAssets = Object.values(routeManifest.entryJSFiles).flat();
const assets = [...new Set([...buildManifest.rootMainFiles, ...routeAssets])];
const sizes = await Promise.all(
  assets.map(async (asset) => {
    const file = path.join(nextRoot, asset);
    await stat(file);
    return gzipSync(await readFile(file), { level: 9 }).byteLength;
  }),
);
const total = sizes.reduce((sum, size) => sum + size, 0);
const budget = 180 * 1024;
process.stdout.write(
  `Main-route JavaScript: ${total} bytes gzip across ${assets.length} assets (budget < ${budget})\n`,
);
if (total >= budget) process.exitCode = 1;
