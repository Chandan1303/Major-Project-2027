import assert from 'node:assert/strict';
import test from 'node:test';
import { changePredictionState, filterVarietiesForState } from './predictionOptions.js';

const varieties = [
  { code: 'Co 86032', recommended_states: ['Maharashtra', 'Karnataka'] },
  { code: 'Co 0238', recommended_states: ['Punjab', 'Uttar Pradesh'] },
  { code: 'CoC 671', recommended_states: ['Southern Karnataka', 'Tamil Nadu'] }
];

test('filters prediction varieties by the selected state, including regional aliases', () => {
  assert.deepEqual(
    filterVarietiesForState(varieties, 'Karnataka').map(item => item.code),
    ['Co 86032', 'CoC 671']
  );
});

test('clears an existing variety and dependent selections when state changes', () => {
  const previous = {
    state: 'Karnataka', district: 'Mysuru', variety: 'Co 86032',
    season: 'Spring', soil_type: 'Black Soil', location: 'Mysuru, Karnataka', area: '2.5'
  };
  assert.deepEqual(changePredictionState(previous, 'Punjab'), {
    ...previous,
    state: 'Punjab',
    district: '',
    variety: '',
    season: '',
    soil_type: '',
    location: ''
  });
});