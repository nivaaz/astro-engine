/**
 * @astro-engine/mcp
 * 
 * Model Context Protocol server for astrology data.
 * Exposes computation as callable tools for ChatGPT, Claude,
 * and other MCP-compatible AI clients.
 */

export { MCP_TOOLS } from "./tools.js";
export type { McpToolDefinition } from "./tools.js";
export const MCP_VERSION = "0.1.0";
