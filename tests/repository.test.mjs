import test from 'node:test';
import assert from 'node:assert/strict';
import { buildContentFromRows } from '../server/repository.mjs';

test('buildContentFromRows converts database rows to frontend content shape', () => {
  const content = buildContentFromRows({
    stations: [{ id: 'station-2', payload: { id: 'station-2', order: 2, title: 'Zwei' } }],
    hints: [{ station_id: 'station-2', hints: ['h1'] }],
    audio: [{ filename: '02.mp3', payload: { speaker: 'Lina', text: 'Hallo' } }],
    facilitator: [{ station_id: 'station-2', code: '222', short_solution: 'kurz', explanation: 'lang' }],
    settings: [{ key: 'facilitator', value: { pin: '9999', disclaimer: 'Nur Spielleitung' } }]
  });

  assert.equal(content.stations[0].title, 'Zwei');
  assert.deepEqual(content.hints['station-2'], ['h1']);
  assert.equal(content.audio['02.mp3'].speaker, 'Lina');
  assert.equal(content.facilitator.pin, '9999');
  assert.equal(content.facilitator.solutions[0].shortSolution, 'kurz');
});
