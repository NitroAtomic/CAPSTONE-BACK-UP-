// config/env.js
// Backend and integration: IamAtomic
//
// Reads configuration and refuses to start in production if anything
// security critical is missing.
//
// The reason this file exists: the previous version fell back to hardcoded
// values like 'dev-secret-change-in-production' when an environment variable
// was absent. That is fine on a laptop, but this repository is public, so
// anyone reading the source would know the fallback and could forge their own
// admin token against a deployed copy. Failing loudly on boot is far better
// than running with a known secret.

require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

function required(name, { minLength = 0 } = {}) {
  const value = process.env[name];

  if (!value) {
    if (isProduction) {
      throw new Error(
        `${name} is not set. Refusing to start in production without it.`
      );
    }
    return null;
  }

  if (minLength && value.length < minLength) {
    const message = `${name} is shorter than ${minLength} characters, which is too weak.`;
    if (isProduction) throw new Error(message);
    console.warn(`[config] ${message} Fine for local work, not for deployment.`);
  }

  return value;
}

const jwtSecret = required('JWT_SECRET', { minLength: 32 });
const dbPassword = required('DB_PASSWORD');

// Which origins the browser is allowed to call this API from. In production
// this must be set, otherwise the API would accept requests from any site.
const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (isProduction && corsOrigins.length === 0) {
  throw new Error('CORS_ORIGINS is not set. Refusing to start in production without it.');
}

module.exports = {
  isProduction,

  port: Number(process.env.PORT) || 3000,

  // Local development keeps working without a .env file; production does not.
  jwtSecret: jwtSecret || 'local-development-only-not-for-deployment',

  corsOrigins,

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'seaware',
    password: dbPassword || '',
    name: process.env.DB_NAME || 'awareness_platform',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || '',
  },
};
