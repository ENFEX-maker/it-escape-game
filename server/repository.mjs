import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const readJson = async (path) => JSON.parse(await readFile(join(ROOT, path), 'utf8'));

export function buildContentFromRows({ stations, hints, audio, facilitator, settings }) {
  const facilitatorSetting = settings.find((row) => row.key === 'facilitator')?.value || {};
  return {
    stations: stations.map((row) => row.payload).sort((a, b) => a.order - b.order),
    hints: Object.fromEntries(hints.map((row) => [row.station_id, row.hints])),
    audio: Object.fromEntries(audio.map((row) => [row.filename, row.payload])),
    facilitator: {
      pin: facilitatorSetting.pin || '1984',
      disclaimer: facilitatorSetting.disclaimer || '',
      solutions: facilitator.map((row) => ({
        stationId: row.station_id,
        code: row.code,
        shortSolution: row.short_solution,
        explanation: row.explanation
      }))
    }
  };
}

export async function ensureSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stations (
      id text PRIMARY KEY,
      sort_order integer NOT NULL,
      path text NOT NULL DEFAULT 'main',
      payload jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS station_hints (
      station_id text PRIMARY KEY REFERENCES stations(id) ON DELETE CASCADE,
      hints jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS facilitator_solutions (
      station_id text PRIMARY KEY REFERENCES stations(id) ON DELETE CASCADE,
      code text NOT NULL,
      short_solution text NOT NULL DEFAULT '',
      explanation text NOT NULL DEFAULT '',
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS audio_scripts (
      filename text PRIMARY KEY,
      payload jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

export async function seedIfEmpty(pool) {
  const { rows } = await pool.query('SELECT count(*)::int AS count FROM stations');
  if (rows[0].count > 0) return false;

  const [stations, hints, audio, facilitator] = await Promise.all([
    readJson('src/data/stations.json'),
    readJson('src/data/hints.json'),
    readJson('src/data/audio.json'),
    readJson('src/data/facilitator.json')
  ]);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const station of stations) {
      await client.query(
        'INSERT INTO stations (id, sort_order, path, payload) VALUES ($1, $2, $3, $4)',
        [station.id, station.order, station.path || 'main', JSON.stringify(station)]
      );
      await client.query(
        'INSERT INTO station_hints (station_id, hints) VALUES ($1, $2)',
        [station.id, JSON.stringify(hints[station.id] || [])]
      );
    }
    for (const [filename, payload] of Object.entries(audio)) {
      await client.query('INSERT INTO audio_scripts (filename, payload) VALUES ($1, $2)', [filename, JSON.stringify(payload)]);
    }
    for (const solution of facilitator.solutions || []) {
      await client.query(
        'INSERT INTO facilitator_solutions (station_id, code, short_solution, explanation) VALUES ($1, $2, $3, $4)',
        [solution.stationId, solution.code, solution.shortSolution || '', solution.explanation || '']
      );
    }
    await client.query('INSERT INTO app_settings (key, value) VALUES ($1, $2)', ['facilitator', JSON.stringify({
      pin: process.env.ADMIN_PIN || facilitator.pin || '1984',
      disclaimer: facilitator.disclaimer || ''
    })]);
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getContent(pool) {
  const [stations, hints, audio, facilitator, settings] = await Promise.all([
    pool.query('SELECT id, payload FROM stations ORDER BY sort_order ASC'),
    pool.query('SELECT station_id, hints FROM station_hints'),
    pool.query('SELECT filename, payload FROM audio_scripts ORDER BY filename ASC'),
    pool.query('SELECT station_id, code, short_solution, explanation FROM facilitator_solutions'),
    pool.query('SELECT key, value FROM app_settings')
  ]);
  return buildContentFromRows({
    stations: stations.rows,
    hints: hints.rows,
    audio: audio.rows,
    facilitator: facilitator.rows,
    settings: settings.rows
  });
}

export async function updateStationContent(pool, stationId, updatedContent) {
  const station = updatedContent.stations.find((item) => item.id === stationId);
  const hints = updatedContent.hints[stationId] || [];
  const solution = updatedContent.facilitator.solutions.find((item) => item.stationId === stationId);
  if (!station || !solution) throw new Error(`Station nicht gefunden: ${stationId}`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE stations SET sort_order = $2, path = $3, payload = $4, updated_at = now() WHERE id = $1',
      [stationId, station.order, station.path || 'main', JSON.stringify(station)]
    );
    await client.query(
      'INSERT INTO station_hints (station_id, hints) VALUES ($1, $2) ON CONFLICT (station_id) DO UPDATE SET hints = excluded.hints, updated_at = now()',
      [stationId, JSON.stringify(hints)]
    );
    await client.query(
      `INSERT INTO facilitator_solutions (station_id, code, short_solution, explanation)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (station_id) DO UPDATE SET code = excluded.code, short_solution = excluded.short_solution, explanation = excluded.explanation, updated_at = now()`,
      [stationId, solution.code, solution.shortSolution || '', solution.explanation || '']
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
