const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT || '5432'),
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'crop_monitoring',
      }
);

const seedUsers = [
  ['admin@example.com', 'admin123', 'admin', 'Admin User'],
  ['agent@example.com', 'agent123', 'agent', 'Agent User'],
  ['agent1@example.com', 'agent123', 'agent', 'Agent One'],
  ['agent2@example.com', 'agent123', 'agent', 'Agent Two'],
  ['agent3@example.com', 'agent123', 'agent', 'Agent Three'],
];

async function initDb() {
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

function getFieldStatus(field) {
  if (field.current_stage === 'Harvested') {
    return 'Completed';
  }

  if (!field.planting_date) {
    return 'Active';
  }

  const daysSincePlanting = Math.floor(
    (Date.now() - new Date(field.planting_date).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSincePlanting > 60 && field.current_stage !== 'Ready') {
    return 'At Risk';
  }

  return 'Active';
}

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query(
    'SELECT id, email, role, name FROM users WHERE email = $1 AND password = $2',
    [email, password]
  );
  const user = result.rows[0];

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  res.json(user);
});

app.get('/api/fields', async (req, res) => {
  const userRole = req.headers['x-role'];

  if (userRole !== 'admin') {
    res.status(403).json({ error: 'Admin only' });
    return;
  }

  const result = await pool.query(`
    SELECT f.*, u.name AS agent_name
    FROM fields f
    LEFT JOIN users u ON f.assigned_agent_id = u.id
    ORDER BY f.id DESC
  `);

  res.json(result.rows.map((field) => ({ ...field, status: getFieldStatus(field) })));
});

app.post('/api/fields', async (req, res) => {
  const userRole = req.headers['x-role'];
  const userId = req.headers['x-user-id'];

  if (userRole !== 'admin') {
    res.status(403).json({ error: 'Admin only' });
    return;
  }

  const { name, crop_type, planting_date, current_stage } = req.body;
  const result = await pool.query(
    `
      INSERT INTO fields (name, crop_type, planting_date, current_stage, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
    [name, crop_type, planting_date, current_stage, userId]
  );

  res.json({ id: result.rows[0].id });
});

app.put('/api/fields/:id/assign', async (req, res) => {
  const userRole = req.headers['x-role'];

  if (userRole !== 'admin') {
    res.status(403).json({ error: 'Admin only' });
    return;
  }

  const { agentId } = req.body;
  await pool.query('UPDATE fields SET assigned_agent_id = $1 WHERE id = $2', [agentId, req.params.id]);
  res.json({ success: true });
});

app.get('/api/fields/assigned', async (req, res) => {
  const userRole = req.headers['x-role'];
  const userId = req.headers['x-user-id'];

  if (userRole !== 'agent') {
    res.status(403).json({ error: 'Agent only' });
    return;
  }

  const result = await pool.query('SELECT * FROM fields WHERE assigned_agent_id = $1 ORDER BY id DESC', [userId]);
  res.json(result.rows.map((field) => ({ ...field, status: getFieldStatus(field) })));
});

app.post('/api/fields/:id/update', async (req, res) => {
  const userRole = req.headers['x-role'];
  const userId = req.headers['x-user-id'];

  if (userRole !== 'agent' || !userId) {
    res.status(403).json({ error: 'Agent only' });
    return;
  }

  const fieldResult = await pool.query('SELECT assigned_agent_id FROM fields WHERE id = $1', [req.params.id]);
  const field = fieldResult.rows[0];

  if (!field) {
    res.status(404).json({ error: 'Field not found' });
    return;
  }

  if (String(field.assigned_agent_id) !== String(userId)) {
    res.status(403).json({ error: 'Field not assigned to this agent' });
    return;
  }

  const { new_stage, notes } = req.body;
  await pool.query(
    'INSERT INTO field_updates (field_id, agent_id, new_stage, notes) VALUES ($1, $2, $3, $4)',
    [req.params.id, userId, new_stage, notes]
  );
  await pool.query('UPDATE fields SET current_stage = $1 WHERE id = $2', [new_stage, req.params.id]);
  res.json({ success: true });
});

app.get('/api/fields/:id/updates', async (req, res) => {
  const userRole = req.headers['x-role'];
  const userId = req.headers['x-user-id'];
  const fieldResult = await pool.query('SELECT assigned_agent_id FROM fields WHERE id = $1', [req.params.id]);
  const field = fieldResult.rows[0];

  if (!field) {
    res.status(404).json({ error: 'Field not found' });
    return;
  }

  const isAdmin = userRole === 'admin';
  const isAssignedAgent = userRole === 'agent' && String(field.assigned_agent_id) === String(userId);

  if (!isAdmin && !isAssignedAgent) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const result = await pool.query(
    `
      SELECT fu.*, u.name AS agent_name
      FROM field_updates fu
      LEFT JOIN users u ON fu.agent_id = u.id
      WHERE fu.field_id = $1
      ORDER BY fu.created_at DESC
    `,
    [req.params.id]
  );

  res.json(result.rows);
});

app.get('/api/agents', async (req, res) => {
  const userRole = req.headers['x-role'];

  if (userRole !== 'admin') {
    res.status(403).json({ error: 'Admin only' });
    return;
  }

  const result = await pool.query(`SELECT id, name, email FROM users WHERE role = 'agent' ORDER BY name ASC`);
  res.json(result.rows);
});

app.get('/api/updates', async (req, res) => {
  const userRole = req.headers['x-role'];

  if (userRole !== 'admin') {
    res.status(403).json({ error: 'Admin only' });
    return;
  }

  const result = await pool.query(`
    SELECT
      fu.id,
      fu.field_id,
      fu.new_stage,
      fu.notes,
      fu.created_at,
      f.name AS field_name,
      u.name AS agent_name
    FROM field_updates fu
    LEFT JOIN fields f ON fu.field_id = f.id
    LEFT JOIN users u ON fu.agent_id = u.id
    ORDER BY fu.created_at DESC
    LIMIT 12
  `);

  res.json(result.rows);
});

const PORT = 3001;

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize PostgreSQL:', error);
    process.exit(1);
  });
