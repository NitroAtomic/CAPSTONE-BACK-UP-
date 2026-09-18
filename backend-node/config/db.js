// config/db.js
// Backend and integration: IamAtomic

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('./env');

// TLS options for a hosted database.
//
// Providers like Aiven sign their certificates with their own certificate
// authority rather than one your machine already trusts, so a plain TLS
// connection fails with "self-signed certificate in certificate chain".
//
// The tempting fix is rejectUnauthorized: false, which is worth naming as a
// bad idea: it keeps the traffic encrypted but stops checking who is on the
// other end, so anyone able to intercept the connection could present their
// own certificate and read everything, including the password. Supplying the
// provider's CA keeps verification switched on.
//
// Two ways to provide it, because deployment platforms differ:
//   DB_SSL_CA       a path to the .pem file      (convenient locally)
//   DB_SSL_CA_CERT  the certificate text itself  (for hosts with no file system access)
function sslOptions() {
  if (process.env.DB_SSL !== 'true') return undefined;

  const inlineCert = process.env.DB_SSL_CA_CERT;
  if (inlineCert && inlineCert.trim()) {
    return { ca: inlineCert.replace(/\\n/g, '\n'), rejectUnauthorized: true };
  }

  const caPath = process.env.DB_SSL_CA
    ? path.resolve(__dirname, '..', process.env.DB_SSL_CA)
    : path.join(__dirname, '..', 'certs', 'ca.pem');

  if (fs.existsSync(caPath)) {
    return { ca: fs.readFileSync(caPath, 'utf8'), rejectUnauthorized: true };
  }

  console.warn(
    '[db] DB_SSL is on but no CA certificate was found.\n' +
    `      Looked for: ${caPath}\n` +
    '      Download it from your provider (Aiven: Overview, CA certificate, Show)\n' +
    '      and save it there, or set DB_SSL_CA_CERT to its contents.\n' +
    '      Connecting with verification enabled, which will fail if the\n' +
    '      provider uses its own certificate authority.'
  );
  return { rejectUnauthorized: true };
}

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  ssl: sslOptions(),
});

module.exports = pool;
