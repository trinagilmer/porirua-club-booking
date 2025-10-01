// backend/db.js
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Only enable SSL when DATABASE_SSL=require (e.g. on Render)
const sslEnabled = process.env.DATABASE_SSL === 'require';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl: sslEnabled ? { rejectUnauthorized: false } : false,

  // Pool hygiene (good defaults for hosted Postgres)
  max: parseInt(process.env.PG_MAX || '5', 10),
  idleTimeoutMillis: parseInt(process.env.PG_IDLE || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.PG_CONN_TIMEOUT || '10000', 10),

  // Recycle clients periodically
  maxUses: parseInt(process.env.PG_MAX_USES || '7500', 10),

  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,

  allowExitOnIdle: true,

  application_name: process.env.APP_NAME || 'porirua-club',
});

// Swallow idle client errors so the app doesn’t crash
pool.on('error', (err) => {
  console.warn('[pg] idle client error (usually safe):', err.code || err.message);
});

// Graceful shutdown on platform signals
const shutdown = async (sig) => {
  try {
    await pool.end();
  } catch {
    // ignore
  } finally {
    process.exit(0);
  }
};
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

module.exports = pool;
