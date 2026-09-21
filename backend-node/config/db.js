// config/db.js
// IamAtomic — Group 4 Capstone 2, SE-AWARE backend

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('./env');

// TLS setup para sa hosted DB.
//
// Yung mga provider gaya ng Aiven, sarili nilang CA yung pang-sign ng cert,
// hindi yung kilala na ng machine mo, kaya nag-e-error na "self-signed
// certificate in certificate chain" pag plain TLS lang.
//
// Yung madaling ayos, rejectUnauthorized: false — pero bad idea to. Naka-
// encrypt pa rin pero wala nang nag-che-check kung sino kausap, kaya kung may
// makaharang sa connection, pwede magpanggap tapos makuha lahat, kasama
// password. Yung provider's CA mismo ilagay, para naka-verify pa rin.
//
// Dalawang paraan, kasi iba-iba yung deployment platform:
//   DB_SSL_CA       path papunta sa .pem file    (madali sa local)
//   DB_SSL_CA_CERT  yung cert text mismo         (kung walang file system access)
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
