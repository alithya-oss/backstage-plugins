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


import { formatDuration } from './duration';

describe('formatDuration', () => {
  it('formats seconds only', () => {
    expect(formatDuration(12)).toBe('12s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(227)).toBe('3m 47s');
  });

  it('formats hours and minutes (drops seconds)', () => {
    expect(formatDuration(3900)).toBe('1h 5m');
  });

  it('formats hours and minutes when seconds are present (drops seconds)', () => {
    expect(formatDuration(3947)).toBe('1h 5m');
  });

  it('formats zero as 0s', () => {
    expect(formatDuration(0)).toBe('0s');
  });

  it('returns em dash for undefined', () => {
    expect(formatDuration(undefined)).toBe('—');
  });

  it('returns em dash for negative values', () => {
    expect(formatDuration(-5)).toBe('—');
  });

  it('formats exactly 60 seconds as 1m 0s', () => {
    expect(formatDuration(60)).toBe('1m 0s');
  });

  it('formats exactly 3600 seconds as 1h 0m', () => {
    expect(formatDuration(3600)).toBe('1h 0m');
  });
});
