#!/bin/bash

# Start the ClaimGuardian MCP server

echo "Building MCP server..."
cd packages/mcp-server
pnpm build

echo "Starting MCP server..."
node dist/index.js