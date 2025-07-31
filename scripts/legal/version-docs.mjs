

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Configuration ---
// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from the root .env.production file
const envPath = path.resolve(__dirname, '../../.env.production');
config({ path: envPath });

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    '❌ Error: Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.production'
  );
  process.exit(1);
}

// --- Helper Functions ---

/**
 * Calculates the SHA256 hash of the given content.
 * @param {string} content - The content to hash.
 * @returns {string} The SHA256 hash.
 */
function calculateHash(content) {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Creates a Supabase client with service role privileges.
 * @returns {object} The Supabase client.
 */
function getSupabaseAdminClient() {
  return createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// --- Main Versioning Logic ---

/**
 * Versions a legal document by calling the atomic PostgreSQL function.
 * @param {object} params - The parameters for versioning.
 * @param {string} params.docType - The type of the document (e.g., 'privacy_policy').
 * @param {string} params.filePath - The path to the markdown file.
 * @param {string} params.title - The title of the document.
 * @param {string} params.summary - A brief summary of the document's purpose.
 * @param {string} params.changeSummary - A summary of what changed in this version.
 * @param {string} [params.createdBy] - The UUID of the user creating the version (optional).
 */
async function versionDocument({ docType, filePath, title, summary, changeSummary, createdBy = null }) {
  console.log(`🚀 Starting versioning for: ${title}`);

  const supabase = getSupabaseAdminClient();
  const absoluteFilePath = path.resolve(process.cwd(), filePath);

  // 1. Read the markdown file content
  let content;
  try {
    content = readFileSync(absoluteFilePath, 'utf-8');
    console.log(`📄 Read content from: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error reading file at ${absoluteFilePath}:`, error.message);
    process.exit(1);
  }

  // 2. Calculate the SHA256 hash
  const sha256_hash = calculateHash(content);
  console.log(`🔒 Calculated SHA256 hash: ${sha256_hash}`);

  // 3. Prepare parameters for the RPC call
  const rpcParams = {
    p_doc_type: docType,
    p_title: title,
    p_slug: docType.replace(/_/g, '-'), // e.g., 'privacy_policy' -> 'privacy-policy'
    p_content: content,
    p_summary: summary,
    p_change_summary: changeSummary,
    p_sha256_hash: sha256_hash,
    p_created_by: createdBy,
  };

  // 4. Call the atomic database function
  console.log('📡 Calling database function to create new version...');
  const { data: newDocumentId, error } = await supabase.rpc('version_legal_document', rpcParams);

  if (error) {
    console.error('❌ Database error during versioning:', error.message);
    console.error('   Please check the database logs for more details.');
    process.exit(1);
  }

  console.log('✅ Successfully created new document version!');
  console.log(`   New Document ID: ${newDocumentId}`);
  console.log('✨ Versioning complete.');
}

// --- Command-Line Interface ---

function main() {
  const args = process.argv.slice(2);
  if (args.length < 4) {
    console.error('Usage: node scripts/legal/version-docs.mjs <docType> <filePath> <title> "<changeSummary>"');
    console.error('\nExample:');
    console.error(
      'node scripts/legal/version-docs.mjs privacy_policy legal/privacy-policy.md "Privacy Policy" "Updated section 3 for AI data usage."'
    );
    process.exit(1);
  }

  const [docType, filePath, title, changeSummary] = args;
  
  // A summary of the document's purpose could be added as another argument if needed.
  // For now, we'll pass a generic summary.
  const summary = `Legal document governing the use of ClaimGuardian services.`;

  versionDocument({ docType, filePath, title, summary, changeSummary });
}

main();
