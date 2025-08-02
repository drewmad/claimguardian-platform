/**
 * @fileMetadata
 * @purpose Implements the "World Model" service for caching repository metadata to accelerate AI tasks.
 * @owner platform-team
 * @status active
 */
/**
 * @fileMetadata
 * @purpose Implements the "World Model" for caching repository metadata.
 * @owner platform-team
 * @status active
 */

const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const chokidar = require('chokidar');
const fg = require('fast-glob');

// --- Configuration ---
const PORT = 3001; // Port for the World Model API
const REPO_ROOT = path.resolve(__dirname, '../../');
const WATCH_PATTERNS = ['apps/**/*', 'packages/**/*', 'services/**/*', 'standards/**/*'];
const IGNORE_PATTERNS = ['**/node_modules/**', '**/dist/**', '**/.turbo/**', '**/.git/**'];
const METADATA_REGEX = /@fileMetadata\s*\n([\s\S]*?)\n\s*(\*\/|\@)/;

// --- In-Memory Cache ---
const metadataCache = new Map();

// --- Core Functions ---

/**
 * Parses the @fileMetadata block from file content.
 * @param {string} content The content of the file.
 * @returns {object|null} The parsed metadata or null if not found.
 */
function parseMetadata(content) {
  const match = content.match(METADATA_REGEX);
  if (!match || !match[1]) return null;

  const metadata = {};
  const lines = match[1].split('\n');
  lines.forEach(line => {
    const parts = line.replace(/[*]/g, '').trim();
    const match = parts.match(/@(\w+)\s+(.*)/);
    if (match) {
        const [, key, value] = match;
        metadata[key] = value.trim();
    }
  });
  return Object.keys(metadata).length > 0 ? metadata : null;
}

/**
 * Scans a file, parses its metadata, and updates the cache.
 * @param {string} relativePath The path to the file relative to the repo root.
 */
async function updateFileInCache(relativePath) {
  try {
    const absolutePath = path.join(REPO_ROOT, relativePath);
    const content = await fs.readFile(absolutePath, 'utf-8');
    const metadata = parseMetadata(content);
    if (metadata) {
      metadataCache.set(relativePath, metadata);
      console.log(`[World Model] Cached: ${relativePath}`);
    } else {
      if (metadataCache.has(relativePath)) {
        metadataCache.delete(relativePath);
        console.log(`[World Model] Removed: ${relativePath} (no metadata)`);
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'EISDIR') {
      console.error(`[World Model] Error processing ${relativePath}:`, error);
    }
  }
}

/**
 * Removes a file from the cache.
 * @param {string} relativePath The path to the file relative to the repo root.
 */
function removeFileFromCache(relativePath) {
  if (metadataCache.has(relativePath)) {
    metadataCache.delete(relativePath);
    console.log(`[World Model] Removed: ${relativePath}`);
  }
}

/**
 * Performs the initial scan of the repository to build the cache.
 */
async function initialScan() {
  console.log('[World Model] Starting initial repository scan...');
  const stream = fg.stream(WATCH_PATTERNS, {
    cwd: REPO_ROOT,
    ignore: IGNORE_PATTERNS,
    dot: true,
    onlyFiles: true,
  });

  for await (const entry of stream) {
    await updateFileInCache(entry);
  }
  console.log(`[World Model] Initial scan complete. ${metadataCache.size} files cached.`);
}

/**
 * Starts the file watcher to keep the cache updated.
 */
function startWatcher() {
  const watcher = chokidar.watch(WATCH_PATTERNS, {
    cwd: REPO_ROOT,
    ignored: IGNORE_PATTERNS,
    persistent: true,
    ignoreInitial: true,
  });

  console.log('[World Model] File watcher started.');

  watcher
    .on('add', path => updateFileInCache(path))
    .on('change', path => updateFileInCache(path))
    .on('unlink', path => removeFileFromCache(path))
    .on('error', error => console.error(`[World Model] Watcher error: ${error}`));
}

// --- API Server ---

/**
 * Starts the HTTP server to provide access to the cache.
 */
function startApiServer() {
  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/metadata') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(Object.fromEntries(metadataCache)));
    } else if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
    }
    else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  server.listen(PORT, () => {
    console.log(`[World Model] API server listening on http://localhost:${PORT}`);
  });
}

// --- Main Execution ---

async function main() {
  await initialScan();
  startWatcher();
  startApiServer();
}

main().catch(error => {
    console.error("[World Model] Failed to start:", error);
    process.exit(1);
});
