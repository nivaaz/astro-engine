import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function sourceFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory).flatMap((entry) => {
    const absolute = path.join(directory, entry);
    return statSync(absolute).isDirectory()
      ? sourceFiles(absolute)
      : /\.(?:ts|tsx|js|mjs|cjs)$/.test(entry)
        ? [absolute]
        : [];
  });
}

function allFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory).flatMap((entry) => {
    const absolute = path.join(directory, entry);
    return statSync(absolute).isDirectory() ? allFiles(absolute) : [absolute];
  });
}

describe("foundation boundaries", () => {
  it("keeps deferred surfaces outside the active workspace", () => {
    const rootPackage = JSON.parse(
      readFileSync(path.join(root, "package.json"), "utf8"),
    ) as {
      workspaces: string[];
    };

    expect(rootPackage.workspaces).toEqual(["apps/*", "packages/*"]);
    for (const deferred of [
      "packages/astro-calendar",
      "packages/astro-mcp",
      "packages/astro-sdk",
      "packages/astro-ui",
      "services",
    ]) {
      expect(
        existsSync(path.join(root, deferred, "package.json")),
        `${deferred} must remain inactive`,
      ).toBe(false);
    }
  });

  it("does not bypass package exports or import Swiss code in public sources", () => {
    const files = [
      ...sourceFiles(path.join(root, "apps")),
      ...sourceFiles(path.join(root, "packages")),
    ];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(
        /(?:from|import\s*\()\s*["'][^"']*\/src(?:\/|["'])/,
      );
      expect(source, file).not.toMatch(
        /(?:from|import\s*\()\s*["']sweph-wasm(?:\/|["'])/,
      );
    }
  });

  it("does not contain restricted Swiss distribution artifacts", () => {
    const restrictedExtensions = /\.(?:se1|se2|wasm)$/i;
    const trackedRoots = [path.join(root, "apps"), path.join(root, "packages")];
    const files = trackedRoots.flatMap(allFiles);

    expect(files.filter((file) => restrictedExtensions.test(file))).toEqual([]);
  });
});
