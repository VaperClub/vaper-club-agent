#!/usr/bin/env node
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { VaperClubApiClient } from "./api-client.js";
import { loadConfig, readPackageInfo } from "./config.js";
import { createServer } from "./server.js";

// stdout carries the MCP protocol; diagnostics go to stderr only.
try {
  const pkg = readPackageInfo();
  const client = new VaperClubApiClient(loadConfig(), fetch, `${pkg.name}/${pkg.version}`);
  const handle = serveStdio(() => createServer(client, pkg), {
    onerror: (error) => console.error(`[vaper-club-mcp] ${error.message}`),
  });

  let closing = false;
  const shutdown = () => {
    if (closing) return;
    closing = true;
    handle.close().finally(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  console.error(`[vaper-club-mcp] ${pkg.version} running on stdio`);
} catch (error) {
  console.error(`[vaper-club-mcp] ${error instanceof Error ? error.message : "Startup failed."}`);
  process.exit(1);
}
