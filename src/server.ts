#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerPlanCard } from "./tools/plan-card.js";
import { registerGenerateCard } from "./tools/generate-card.js";
import { registerComposeCard } from "./tools/compose-card.js";

const server = new McpServer({
  name: "social-card",
  version: "0.1.0",
});

registerPlanCard(server);
registerGenerateCard(server);
registerComposeCard(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});
