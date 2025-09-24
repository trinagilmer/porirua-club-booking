const pool = require("./db");

async function testConnection() {
  try {
    // 👇 Add this line here, before running the query
    console.log("DATABASE_URL is:", process.env.DATABASE_URL);

    const result = await pool.query("SELECT NOW()");
    console.log("✅ Connected to Supabase! Server time:", result.rows[0].now);
  } catch (err) {
    console.error("❌ Database connection failed:");
    console.error(err);
  } finally {
    pool.end();
  }
}

testConnection();
