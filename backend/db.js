// backend/db.js
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Toggle SSL by env (true for Supabase in the cloud; false for local Postgres)
const sslEnabled = String(process.env.DATABASE_SSL || '').toLowerCase() === 'true';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // Supabase pooler/direct both require TLS in hosted envs
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,

  // Pool hygiene (good defaults for hosted Postgres)
  max: parseInt(process.env.PG_MAX || '5', 10),
  idleTimeoutMillis: parseInt(process.env.PG_IDLE || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.PG_CONN_TIMEOUT || '10000', 10),

  // Recycle clients periodically (pg supports maxUses)
  maxUses: parseInt(process.env.PG_MAX_USES || '7500', 10),

  // Keep TCP alive (helps on platforms that kill idle conns)
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,

  // Let Node exit even if pool has idles (useful for scripts)
  allowExitOnIdle: true,

  // Optional: tag connections in DB logs
  application_name: process.env.APP_NAME || 'porirua-club',
});

// VERY IMPORTANT: swallow idle client errors so the app doesn’t crash
pool.on('error', (err) => {
  console.warn('[pg] idle client error (usually safe):', err.code || err.message);
});

// Graceful shutdown on platform signals
const shutdown = async (sig) => {
  try {
    await pool.end();
  } catch (e) {
    // ignore
  } finally {
    process.exit(0);
  }
};
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

module.exports = pool;


