// backend/db.js
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// ----------------------
// SSL handling
// ----------------------
// - Supabase & Render require SSL
// - Local Postgres often doesn’t
// - Use DATABASE_SSL=true in .env when remote
const sslEnabled = String(process.env.DATABASE_SSL || "").toLowerCase() === "true";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslEnabled
    ? {
        rejectUnauthorized: false, // Supabase works with this
      }
    : false,

  // Pool hygiene
  max: parseInt(process.env.PG_MAX || "10", 10),
  idleTimeoutMillis: parseInt(process.env.PG_IDLE || "30000", 10),
  connectionTimeoutMillis: parseInt(process.env.PG_CONN_TIMEOUT || "10000", 10),
  maxUses: parseInt(process.env.PG_MAX_USES || "7500", 10),

  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  allowExitOnIdle: true,

  application_name: process.env.APP_NAME || "porirua-club",
});

// ----------------------
// Safety: don’t crash on idle errors
// ----------------------
pool.on("error", (err) => {
  console.warn("[pg] idle client error (usually safe):", err.code || err.message);
});

// ----------------------
// Graceful shutdown
// ----------------------
const shutdown = async (sig) => {
  console.log(`[pg] shutting down on ${sig}`);
  try {
    await pool.end();
  } catch (e) {
    console.error("[pg] error during shutdown", e);
  } finally {
    process.exit(0);
  }
};

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));

module.exports = pool;



