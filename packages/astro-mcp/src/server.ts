import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

/**
 * Astro Engine MCP Server
 * 
 * Exposes astrology computation as callable tools for
 * ChatGPT, Claude, and other MCP-compatible AI clients.
 * 
 * Planned tools:
 *   - get_current_sky        Current planetary positions and aspects
 *   - list_upcoming_transits  Next N days of events
 *   - get_exact_aspect_time   When a specific aspect becomes exact
 *   - get_event_chart         Chart for a specific moment at a location
 *   - get_natal_transits      Transit hits against a natal chart
 *   - compare_transits_to_chart  Personalised transit overlay
 *   - generate_calendar_feed  ICS feed URL for a chart
 *   - format_astrology_context   Prompt-ready sky data
 */

const server = new McpServer({
  name: "astro-engine",
  version: "0.1.0",
});

// ── Tool: Get Current Sky ────────────────────────────────────────
server.tool(
  "get_current_sky",
  "Get current planetary positions and active aspects for a given location",
  {
    location: z
      .string()
      .optional()
      .describe("City name or lat,lng coordinates. Defaults to UTC."),
    timezone: z
      .string()
      .optional()
      .describe("IANA timezone (e.g. Australia/Sydney). Defaults to UTC."),
    bodies: z
      .array(z.string())
      .optional()
      .describe("Planets to include. Defaults to all."),
  },
  async ({ location, timezone, bodies }) => {
    // TODO: Wire up to ephemeris + domain packages
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              status: "not_implemented",
              message: "Connect the ephemeris package to enable live sky data.",
              params: { location, timezone, bodies },
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ── Tool: List Upcoming Transits ─────────────────────────────────
server.tool(
  "list_upcoming_transits",
  "Get upcoming transit events for a date range",
  {
    start: z.string().optional().describe("Start date (YYYY-MM-DD). Defaults to today."),
    end: z.string().optional().describe("End date (YYYY-MM-DD). Defaults to +30 days."),
    streams: z
      .array(z.enum(["slow_sky", "lunation", "planetary", "daily_moon"]))
      .optional()
      .describe("Event streams to include."),
    significance: z
      .array(z.enum(["daily", "notable", "major"]))
      .optional()
      .describe("Filter by significance level."),
  },
  async ({ start, end, streams, significance }) => {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              status: "not_implemented",
              message: "Connect the events package to enable transit data.",
              params: { start, end, streams, significance },
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ── Tool: Format Astrology Context ───────────────────────────────
server.tool(
  "format_astrology_context",
  "Get prompt-ready astrology context for AI consumption",
  {
    detail: z
      .enum(["compact", "detailed", "json"])
      .optional()
      .describe("Output detail level. Defaults to compact."),
    location: z.string().optional().describe("Location for localisation."),
    days: z.number().optional().describe("Forecast window in days. Defaults to 7."),
  },
  async ({ detail, location, days }) => {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              status: "not_implemented",
              message: "Connect the formatters package to enable context output.",
              params: { detail, location, days },
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ── Start Server ─────────────────────────────────────────────────
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Astro Engine MCP server running on stdio");
}

main().catch((err: unknown) => {
  console.error("Fatal:", err);
  process.exit(1);
});
