// Central environment configuration loader
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const env = process.env.NODE_ENV || 'development';

try {
  dotenv.config({
    path: path.join(__dirname, 'environments', `.env.${env}`)
  });
} catch (error) {
  // Fallback to root .env.local if environment-specific file doesn't exist
  dotenv.config({
    path: path.join(__dirname, '..', '.env.local')
  });
}

export default process.env;