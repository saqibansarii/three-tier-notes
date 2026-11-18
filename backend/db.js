const { Pool } = require('pg');

const useUrl = Boolean(process.env.DATABASE_URL);
const target = process.env.DATABASE_URL || process.env.DB_HOST || 'localhost';
const isLocal = /localhost|127\.0\.0\.1/.test(target);

// RDS accepts TLS connections; skip TLS only for a local database.
const ssl = process.env.DB_SSL === 'false' || isLocal ? false : { rejectUnauthorized: false };

const pool = new Pool(
  useUrl
    ? { connectionString: process.env.DATABASE_URL, ssl }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'notes',
        ssl,
      }
);

let ready = false;

// Retries instead of exiting, so the web server stays up while the database starts.
async function init() {
  for (let attempt = 1; ; attempt++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS notes (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          body TEXT NOT NULL DEFAULT '',
          done BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);
      ready = true;
      console.log('Database ready');
      return;
    } catch (err) {
      console.error(`Database not reachable (attempt ${attempt}): ${err.message}`);
      await new Promise((r) => setTimeout(r, Math.min(attempt * 2000, 15000)));
    }
  }
}

module.exports = { pool, init, isReady: () => ready };
