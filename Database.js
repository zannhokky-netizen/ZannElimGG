
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL belum diatur");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : undefined,
  max: 5
});

async function query(sql, params = []) {
  return pool.query(sql, params);
}

async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      package_code TEXT NOT NULL,
      key_count INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'TRANSFER_MANUAL',
      status TEXT NOT NULL DEFAULT 'MENUNGGU_PEMBAYARAN',
      proof_note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      verified_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS access_keys (
      id BIGSERIAL PRIMARY KEY,
      key_hash TEXT UNIQUE NOT NULL,
      package_code TEXT NOT NULL,
      duration_days INTEGER,
      permanent BOOLEAN DEFAULT FALSE,
      status TEXT DEFAULT 'BELUM_DIGUNAKAN',
      order_id TEXT REFERENCES orders(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ,
      used_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS key_sessions (
      id BIGSERIAL PRIMARY KEY,
      key_id BIGINT REFERENCES access_keys(id),
      session_token_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      revoked_at TIMESTAMPTZ
    );
  `);
}

module.exports = {
  query,
  initDb,
  pool
};
