import {
  formatJson,
  formatMarkdown,
  formatPromptText,
} from "@sukara/astro-formatters";
import { UtcInstantSchema } from "@sukara/astro-schema";
import { NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z
  .object({
    format: z.enum(["plain", "markdown", "json"]),
    value: z.unknown(),
    referenceInstant: UtcInstantSchema,
  })
  .strict();
const headers = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
} as const;

export async function POST(request: Request) {
  try {
    const input = RequestSchema.safeParse(await request.json());
    if (!input.success)
      return NextResponse.json(
        { ok: false, error: "invalid-input" },
        { status: 400, headers },
      );
    const options = { referenceInstant: input.data.referenceInstant };
    const output =
      input.data.format === "json"
        ? formatJson(input.data.value, options)
        : input.data.format === "markdown"
          ? formatMarkdown(input.data.value, options)
          : formatPromptText(input.data.value, options);
    return NextResponse.json({ ok: true, output }, { headers });
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid-canonical-object" },
      { status: 400, headers },
    );
  }
}
