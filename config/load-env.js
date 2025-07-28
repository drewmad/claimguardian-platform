// Central environment configuration loader
const path = require('path');
const env = process.env.NODE_ENV || 'development';

try {
  require('dotenv').config({
    path: path.join(__dirname, 'environments', `.env.${env}`)
  });
} catch (error) {
  // Fallback to root .env.local if environment-specific file doesn't exist
  require('dotenv').config({
    path: path.join(__dirname, '..', '.env.local')
  });
}

module.exports = process.env;