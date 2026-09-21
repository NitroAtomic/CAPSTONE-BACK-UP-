// config/env.js
// IamAtomic — Group 4 Capstone 2, SE-AWARE backend
//
// Binabasa yung config, tapos ayaw mag-start sa production kung may kulang
// na security-critical.
//
// Bakit ganito: dati may fallback na 'dev-secret-change-in-production' kapag
// walang env var. Okay lang yun sa laptop, pero public yung repo natin, kaya
// kahit sino makabasa ng source, alam na yung fallback tapos pwede na
// mag-forge ng sariling admin token. Mas okay na sumigaw agad pag nag-boot
// kesa tumakbo gamit known secret.

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

// Sino pwede mag-call ng API na to mula sa browser. Sa production, required
// to — kundi kahit sinong site pwede na mag-request.
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

  // Gumagana pa rin sa local kahit walang .env; sa production hindi.
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
