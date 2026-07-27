import { readdir, readFile, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import path from "node:path";

const nextRoot = path.resolve("apps/web/.next");
const browserRoot = path.join(nextRoot, "static");
const restrictedBrowserMarkers =
  /sweph|swisseph|SEFLG_|\.se[12](?:$|[^a-z0-9])/i;
const browserFiles = [];
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(absolute);
    else browserFiles.push(absolute);
  }
}
await collect(browserRoot);
const restrictedBrowserFiles = [];
for (const file of browserFiles) {
  const source = await readFile(file, "utf8");
  if (restrictedBrowserMarkers.test(source)) restrictedBrowserFiles.push(file);
}
if (restrictedBrowserFiles.length > 0) {
  throw new Error(
    `Restricted Swiss implementation markers found in browser assets: ${restrictedBrowserFiles.join(", ")}`,
  );
}
const buildManifest = JSON.parse(
  await readFile(path.join(nextRoot, "build-manifest.json"), "utf8"),
);
const reference = await readFile(
  path.join(nextRoot, "server/app/page_client-reference-manifest.js"),
  "utf8",
);
const marker = 'globalThis.__RSC_MANIFEST["/page"] = ';
const webpackMarker =
  'globalThis.__RSC_MANIFEST=(globalThis.__RSC_MANIFEST||{});globalThis.__RSC_MANIFEST["/page"]=';
const start = reference.indexOf(marker);
const webpackStart = reference.indexOf(webpackMarker);
if (start < 0 && webpackStart < 0)
  throw new Error("Page client reference manifest has an unknown shape");
const manifestStart =
  start >= 0 ? start + marker.length : webpackStart + webpackMarker.length;
const routeManifest = JSON.parse(
  reference.slice(manifestStart, reference.lastIndexOf(";")),
);
const routeAssets = routeManifest.entryJSFiles
  ? Object.values(routeManifest.entryJSFiles).flat()
  : Object.values(routeManifest.clientModules ?? {})
      .flatMap((module) => module.chunks ?? [])
      .filter((asset) => typeof asset === "string" && asset.includes("/"));
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
