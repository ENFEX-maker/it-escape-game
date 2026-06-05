import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));

const stations = readJson('src/data/stations.json');
const hints = readJson('src/data/hints.json');
const audio = readJson('src/data/audio.json');
const facilitator = readJson('src/data/facilitator.json');

const errors = [];
const fail = (message) => errors.push(message);

if (!Array.isArray(stations)) fail('stations.json muss ein Array sein');
if (stations.length < 6) fail('Mindestens 6 Stationen erforderlich');

const ids = new Set();
for (const station of stations) {
  for (const key of ['id', 'order', 'title', 'topic', 'code', 'audio', 'estimatedMinutes', 'careerLink', 'learningPoint', 'story', 'task', 'materials']) {
    if (station[key] === undefined || station[key] === null || station[key] === '') fail(`${station.id || 'Station'} fehlt Feld ${key}`);
  }
  if (ids.has(station.id)) fail(`Doppelte Station-ID: ${station.id}`);
  ids.add(station.id);
  if (!/^\d{3}$/.test(station.code)) fail(`${station.id}: Code muss dreistellig sein`);
  if (!Array.isArray(station.materials) || station.materials.length === 0) fail(`${station.id}: materials fehlt/leer`);
  if (!Array.isArray(hints[station.id]) || hints[station.id].length < 2) fail(`${station.id}: mindestens 2 Hinweise erforderlich`);
  if (!audio[station.audio]) fail(`${station.id}: Audio-Metadaten fehlen für ${station.audio}`);
}

for (const solution of facilitator.solutions || []) {
  if (!ids.has(solution.stationId)) fail(`facilitator: unbekannte stationId ${solution.stationId}`);
  const station = stations.find((item) => item.id === solution.stationId);
  if (station && station.code !== solution.code) fail(`${solution.stationId}: Code in facilitator.json stimmt nicht mit stations.json überein`);
}

const mainStations = stations.filter((station) => station.path === 'main');
if (mainStations.length < 6) fail('Mindestens 6 Hauptstationen erforderlich');

for (const path of [
  'src/index.html',
  'src/styles.css',
  'src/app.js',
  'README.md',
  'AGENTS.md',
  'public/print/stationen_spieler.md',
  'public/print/stationen_spielleitung.md',
  'public/print/audio_skripte.md'
]) {
  if (!existsSync(join(root, path))) fail(`Datei fehlt: ${path}`);
}

if (errors.length) {
  console.error('Smoke check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Smoke check passed: ${stations.length} Stationen, ${mainStations.length} Hauptstationen, ${Object.keys(audio).length} Audio-Skripte.`);
