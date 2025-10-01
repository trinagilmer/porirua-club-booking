// backend/db.js
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Supabase/Postgres SSL setup
// Default: require SSL (Supabase always needs it). 
// DATABASE_SSL=disable only if you're connecting to a local Postgres.
let sslConfig = { rejectUnauthorized: false };
if (String(process.env.DATABASE_SSL || '').toLowerCase() === 'disable') {
  sslConfig = false;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,

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

// Graceful shutdown
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
