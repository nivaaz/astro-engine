/**
 * MCP Tool definitions for Astro Engine.
 * 
 * Each tool declares its name, description, input schema,
 * and handler. Tools are registered with the MCP server.
 */

export interface McpToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
}

export const MCP_TOOLS: readonly McpToolDefinition[] = [
  {
    name: "get_current_sky",
    description: "Get current planetary positions and active aspects for a given location",
    inputSchema: {
      type: "object",
      properties: {
        location: { type: "string", description: "City name or lat,lng" },
        timezone: { type: "string", description: "IANA timezone" },
        bodies: { type: "array", items: { type: "string" }, description: "Planets to include" },
      },
    },
  },
  {
    name: "list_upcoming_transits",
    description: "Get upcoming transit events for a date range",
    inputSchema: {
      type: "object",
      properties: {
        start: { type: "string", description: "YYYY-MM-DD" },
        end: { type: "string", description: "YYYY-MM-DD" },
        streams: {
          type: "array",
          items: { type: "string", enum: ["slow_sky", "lunation", "planetary", "daily_moon"] },
        },
        significance: {
          type: "array",
          items: { type: "string", enum: ["daily", "notable", "major"] },
        },
      },
    },
  },
  {
    name: "get_exact_aspect_time",
    description: "Get the exact UTC time when a specific aspect becomes exact",
    inputSchema: {
      type: "object",
      properties: {
        body1: { type: "string", description: "First planet" },
        body2: { type: "string", description: "Second planet" },
        aspect: { type: "string", description: "Aspect type" },
        after: { type: "string", description: "Search start date (YYYY-MM-DD)" },
        before: { type: "string", description: "Search end date (YYYY-MM-DD)" },
      },
      required: ["body1", "body2", "aspect"],
    },
  },
  {
    name: "get_natal_transits",
    description: "Get transit hits against a natal chart",
    inputSchema: {
      type: "object",
      properties: {
        birth_datetime: { type: "string", description: "ISO 8601 with timezone" },
        birth_location: { type: "string", description: "City name or lat,lng" },
        start: { type: "string", description: "YYYY-MM-DD" },
        end: { type: "string", description: "YYYY-MM-DD" },
        significance: {
          type: "array",
          items: { type: "string", enum: ["daily", "notable", "major"] },
        },
      },
      required: ["birth_datetime", "birth_location"],
    },
  },
  {
    name: "format_astrology_context",
    description: "Get prompt-ready astrology context for AI consumption",
    inputSchema: {
      type: "object",
      properties: {
        detail: { type: "string", enum: ["compact", "detailed", "json"] },
        location: { type: "string" },
        days: { type: "number" },
      },
    },
  },
] as const;
