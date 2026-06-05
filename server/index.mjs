import express from 'express';
import pg from 'pg';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { applyStationPatch } from './content-service.mjs';
import { ensureSchema, getContent, seedIfEmpty, updateStationContent } from './repository.mjs';

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const PORT = Number(process.env.PORT || 8080);
const pool = new Pool(process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL
} : {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'escape_game',
  user: process.env.DB_USER || 'escape',
  password: process.env.DB_PASSWORD || 'escape_dev_password'
});
const app = express();

app.use(express.json({ limit: '1mb' }));

function requireAdmin(req, content) {
  const configured = process.env.ADMIN_PIN || content.facilitator?.pin || '1984';
  const provided = req.header('x-admin-pin') || req.body?.adminPin || '';
  if (provided !== configured) {
    const error = new Error('Admin-PIN nicht korrekt.');
    error.statusCode = 401;
    throw error;
  }
}

app.get('/api/health', async (_req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get('/api/content', async (_req, res, next) => {
  try {
    res.json(await getContent(pool));
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/stations/:id', async (req, res, next) => {
  try {
    const content = await getContent(pool);
    requireAdmin(req, content);
    const updatedContent = applyStationPatch(content, req.params.id, req.body);
    await updateStationContent(pool, req.params.id, updatedContent);
    res.json(await getContent(pool));
  } catch (error) {
    next(error);
  }
});

app.use('/public', express.static(join(root, 'public'), { fallthrough: false }));
app.use(express.static(join(root, 'src'), { extensions: ['html'] }));
app.get('*', (_req, res) => res.sendFile(join(root, 'src', 'index.html')));

app.use((error, _req, res, _next) => {
  const status = error.statusCode || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ error: error.message || 'Interner Serverfehler' });
});

async function start() {
  await ensureSchema(pool);
  const seeded = await seedIfEmpty(pool);
  if (seeded) console.log('Database seeded from JSON content.');
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IT Escape Game listening on http://0.0.0.0:${PORT}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
