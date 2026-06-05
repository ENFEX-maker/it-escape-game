import test from 'node:test';
import assert from 'node:assert/strict';
import { applyStationPatch, validateStationPatch } from '../server/content-service.mjs';

test('validateStationPatch rejects non-three-digit codes', () => {
  assert.throws(() => validateStationPatch({ code: '12A', materials: [{}] }), /dreistellig/);
});

test('applyStationPatch updates station, hints and facilitator solution immutably', () => {
  const content = {
    stations: [{ id: 'station-1', order: 1, title: 'Alt', code: '111', materials: [{ type: 'list', items: ['a'] }] }],
    hints: { 'station-1': ['alt'] },
    audio: {},
    facilitator: { pin: '1984', solutions: [{ stationId: 'station-1', code: '111', shortSolution: 'alt', explanation: 'alt' }] }
  };

  const result = applyStationPatch(content, 'station-1', {
    title: 'Neu',
    topic: 'Security',
    code: '222',
    estimatedMinutes: 9,
    story: 'Story',
    task: 'Task',
    materials: [{ type: 'list', title: 'Liste', items: ['x'] }],
    learningPoint: 'Lernen',
    careerLink: 'Beruf',
    hints: ['eins', 'zwei'],
    shortSolution: 'kurz',
    explanation: 'lang'
  });

  assert.equal(result.stations[0].title, 'Neu');
  assert.equal(result.stations[0].code, '222');
  assert.deepEqual(result.hints['station-1'], ['eins', 'zwei']);
  assert.equal(result.facilitator.solutions[0].code, '222');
  assert.equal(result.facilitator.solutions[0].shortSolution, 'kurz');
  assert.equal(content.stations[0].title, 'Alt');
});
