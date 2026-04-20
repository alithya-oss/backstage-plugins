/*
 * Copyright 2026 The Alithya Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { PHASE_STATUS_MAP, PHASE_ICON_MAP } from './statusMapping';
import { NodePhase } from './types';

const ALL_NODE_PHASES: NodePhase[] = [
  'Succeeded',
  'Failed',
  'Error',
  'Running',
  'Pending',
  'Skipped',
  'Omitted',
];

describe('PHASE_STATUS_MAP', () => {
  it('has exactly 7 entries', () => {
    expect(Object.keys(PHASE_STATUS_MAP)).toHaveLength(7);
  });

  it.each<[NodePhase, string]>([
    ['Succeeded', 'success'],
    ['Failed', 'danger'],
    ['Error', 'danger'],
    ['Running', 'info'],
    ['Pending', 'warning'],
    ['Skipped', 'secondary'],
    ['Omitted', 'secondary'],
  ])('maps %s to %s', (phase, expected) => {
    expect(PHASE_STATUS_MAP[phase]).toBe(expected);
  });

  it('covers all NodePhase values', () => {
    for (const phase of ALL_NODE_PHASES) {
      expect(PHASE_STATUS_MAP[phase]).toBeDefined();
    }
  });
});

describe('PHASE_ICON_MAP', () => {
  it('has exactly 7 entries', () => {
    expect(Object.keys(PHASE_ICON_MAP)).toHaveLength(7);
  });

  it.each<[NodePhase, string]>([
    ['Succeeded', '✓'],
    ['Failed', '✗'],
    ['Error', '⚠'],
    ['Running', '◌'],
    ['Pending', '○'],
    ['Skipped', '⊘'],
    ['Omitted', '—'],
  ])('maps %s to %s', (phase, expected) => {
    expect(PHASE_ICON_MAP[phase]).toBe(expected);
  });

  it('covers all NodePhase values', () => {
    for (const phase of ALL_NODE_PHASES) {
      expect(PHASE_ICON_MAP[phase]).toBeDefined();
    }
  });
});
