import { readFile, stat } from "node:fs/promises";
import { stdin, stdout } from "node:process";
import {
  formatJson,
  formatMarkdown,
  formatPromptText,
} from "@sukara/astro-formatters";
import { SMOKE_FIXTURE } from "./fixture.js";

type OutputFormat = "json" | "markdown" | "text";
const MAX_INPUT_BYTES = 1_048_576;

interface Arguments {
  readonly format: OutputFormat;
  readonly source?: string;
}

function usage(): string {
  return "Usage: dev-cli [--format json|markdown|text] [JSON_FILE|-]\n";
}

function parseArguments(args: readonly string[]): Arguments {
  let format: OutputFormat = "markdown";
  let source: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]!;
    if (argument === "--format") {
      const candidate = args[index + 1];
      if (
        candidate !== "json" &&
        candidate !== "markdown" &&
        candidate !== "text"
      ) {
        throw new TypeError("--format must be json, markdown, or text");
      }
      format = candidate;
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      stdout.write(usage());
      process.exit(0);
    } else if (source === undefined) {
      source = argument;
    } else {
      throw new TypeError("Only one input source is supported");
    }
  }
  return source === undefined ? { format } : { format, source };
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of stdin) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.byteLength;
    if (bytes > MAX_INPUT_BYTES) throw new RangeError("Input exceeds 1 MiB");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function loadInput(source: string | undefined): Promise<unknown> {
  if (source === undefined) return SMOKE_FIXTURE;
  if (source === "-") return JSON.parse(await readStdin()) as unknown;
  const file = await stat(source);
  if (!file.isFile()) throw new TypeError("Input path must be a regular file");
  if (file.size > MAX_INPUT_BYTES) throw new RangeError("Input exceeds 1 MiB");
  const json = await readFile(source, "utf8");
  return JSON.parse(json) as unknown;
}

async function main(): Promise<void> {
  const args = parseArguments(process.argv.slice(2));
  const input = await loadInput(args.source);
  const output =
    args.format === "json"
      ? formatJson(input)
      : args.format === "text"
        ? formatPromptText(input)
        : formatMarkdown(input);
  stdout.write(output);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown failure";
  process.stderr.write(`dev-cli: ${message}\n${usage()}`);
  process.exitCode = 1;
});
