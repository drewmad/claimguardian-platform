/**
 * @fileMetadata
 * @purpose Implements the "Co-Strategist" agent for real-time, terminal-based developer feedback.
 * @owner platform-team
 * @status active
 */
/**
 * @fileMetadata
 * @purpose Implements the "Co-Strategist" agent, providing real-time feedback to developers in the terminal.
 * @owner platform-team
 * @status active
 */

import chokidar from 'chokidar';
import fs from 'fs/promises';
import path from 'path';
import http from 'http';

// --- Configuration ---
const WATCHED_DIRECTORIES = ['./apps', './packages', './services'];
const LOCAL_MODEL_API = {
  hostname: 'localhost',
  port: 11434, // Default for Ollama
  path: '/api/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};
const MODEL_NAME = 'local-llama3-8b'; // As defined in model-roster.json

// --- Utility Functions ---

/**
 * Debounces a function to prevent it from being called too frequently.
 * @param {Function} func The function to debounce.
 * @param {number} delay The debounce delay in milliseconds.
 * @returns {Function} The debounced function.
 */
function debounce(func, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Invokes the local AI model with the file content.
 * @param {string} filePath The path to the file that changed.
 * @param {string} fileContent The content of the file.
 */
async function invokeLocalModel(filePath, fileContent) {
  const prompt = `
    You are a "Co-Strategist" AI agent for the ClaimGuardian project.
    Your purpose is to provide real-time, non-intrusive feedback to developers.
    Analyze the following file and check for violations of the development protocol.
    Focus on:
    1.  Presence and correctness of '@fileMetadata'.
    2.  Adherence to code patterns and style.
    3.  Potential anti-patterns identified in project retrospectives.

    File: ${filePath}
    ---
    Content:
    ${fileContent}
    ---
    Provide brief, actionable feedback if issues are found. If the file is compliant, respond with "OK".
  `;

  const requestBody = JSON.stringify({
    model: MODEL_NAME,
    prompt: prompt,
    stream: false, // We want the full response at once
  });

  return new Promise((resolve, reject) => {
    const req = http.request(LOCAL_MODEL_API, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          if (parsedData.response) {
            resolve(parsedData.response.trim());
          } else {
            resolve('OK'); // Assume OK if no direct response
          }
        } catch (error) {
          reject(`Error parsing model response: ${error.message}`);
        }
      });
    });

    req.on('error', (error) => {
      reject(`Error calling local model API: ${error.message}. Is the local model running?`);
    });

    req.write(requestBody);
    req.end();
  });
}

/**
 * Handles a file change event.
 * @param {string} filePath The path to the file that changed.
 */
async function onFileChange(filePath) {
  try {
    console.log(`[Co-Strategist] Analyzing: ${filePath}`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const feedback = await invokeLocalModel(filePath, fileContent);

    if (feedback && feedback.toUpperCase() !== 'OK') {
      console.log(`[Co-Strategist] Feedback for ${filePath}:\n---\n${feedback}\n---`);
    } else {
       console.log(`[Co-Strategist] OK: ${filePath}`);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') { // Ignore file not found errors (e.g., temp files)
        console.error(`[Co-Strategist] Error: ${error.message}`);
    }
  }
}

// --- Main Execution ---

function main() {
  console.log('[Co-Strategist] Starting...');
  console.log('Watching for file changes. Press Ctrl+C to exit.');

  const watcher = chokidar.watch(WATCHED_DIRECTORIES, {
    ignored: /(^|[\/\\])\..|node_modules|dist|.turbo/, // Corrected escaping for backslash
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
    }
  });

  const debouncedFileChange = debounce(onFileChange, 1000);

  watcher
    .on('add', path => debouncedFileChange(path))
    .on('change', path => debouncedFileChange(path))
    .on('error', error => console.error(`[Co-Strategist] Watcher error: ${error}`));
}

main();
