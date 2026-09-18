// config/db.js
// Backend and integration: IamAtomic

const mysql = require('mysql2/promise');
const config = require('./env');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  waitForConnections: true,
  connectionLimit: 10,

  // Hosted MySQL providers generally require TLS. Set DB_SSL=true when
  // deploying; it stays off locally where the database is on the same machine.
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
});

module.exports = pool;
