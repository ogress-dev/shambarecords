import { Pool, type QueryResultRow } from 'pg';

type SeedUser = readonly [email: string, password: string, role: string, name: string];

type GlobalWithDb = typeof globalThis & {
  __cropMonitoringPool?: Pool;
  __cropMonitoringInitPromise?: Promise<void>;
};

const globalForDb = globalThis as GlobalWithDb;

const pool =
  globalForDb.__cropMonitoringPool ??
  new Pool(
    process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL }
      : {
          host: process.env.PGHOST ?? 'localhost',
          port: Number(process.env.PGPORT ?? '5432'),
          user: process.env.PGUSER ?? 'postgres',
          password: process.env.PGPASSWORD ?? 'postgres',
          database: process.env.PGDATABASE ?? 'crop_monitoring',
        }
  );

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__cropMonitoringPool = pool;
}

const seedUsers: SeedUser[] = [
  ['admin@example.com', 'admin123', 'admin', 'Admin User'],
  ['agent@example.com', 'agent123', 'agent', 'Agent User'],
  ['agent1@example.com', 'agent123', 'agent', 'Agent One'],
  ['agent2@example.com', 'agent123', 'agent', 'Agent Two'],
  ['agent3@example.com', 'agent123', 'agent', 'Agent Three'],
];

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS fields (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      crop_type TEXT,
      planting_date DATE,
      current_stage TEXT,
      assigned_agent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS field_updates (
      id SERIAL PRIMARY KEY,
      field_id INTEGER REFERENCES fields(id) ON DELETE CASCADE,
      agent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      new_stage TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  for (const [email, password, role, name] of seedUsers) {
    await pool.query(
      `
        INSERT INTO users (email, password, role, name)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO NOTHING
      `,
      [email, password, role, name]
    );
  }
}

function ensureInitialized() {
  if (!globalForDb.__cropMonitoringInitPromise) {
    globalForDb.__cropMonitoringInitPromise = initializeDatabase();
  }

  return globalForDb.__cropMonitoringInitPromise;
}

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []) {
  await ensureInitialized();
  return pool.query<T>(text, params);
}

export async function queryOne<T extends QueryResultRow>(text: string, params: unknown[] = []) {
  const result = await query<T>(text, params);
  return result.rows[0];
}

export function getFieldStatus(field: { planting_date: string | Date | null; current_stage: string | null }) {
  if (field.current_stage === 'Harvested') {
    return 'Completed';
  }

  if (!field.planting_date) {
    return 'Active';
  }

  const plantedAt = new Date(field.planting_date);
  const daysSincePlanting = Math.floor((Date.now() - plantedAt.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSincePlanting > 60 && field.current_stage !== 'Ready') {
    return 'At Risk';
  }

  return 'Active';
}

export { pool };
