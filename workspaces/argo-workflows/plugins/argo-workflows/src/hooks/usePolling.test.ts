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

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePolling } from './usePolling';

beforeEach(() => {
  jest.useFakeTimers();
  Object.defineProperty(document, 'hidden', {
    value: false,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('usePolling', () => {
  it('sets loading true on initial fetch then resolves with data', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ id: 1 });

    const { result } = renderHook(() => usePolling(fetchFn, 5000));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ id: 1 });
    expect(result.current.error).toBeNull();
    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });

  it('calls fetchFn at the specified interval', async () => {
    const fetchFn = jest.fn().mockResolvedValue('data');

    renderHook(() => usePolling(fetchFn, 3000));

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledTimes(3);
    });
  });

  it('updates data silently during polling (loading stays false)', async () => {
    let callCount = 0;
    const fetchFn = jest.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve(`data-${callCount}`);
    });

    const { result } = renderHook(() => usePolling(fetchFn, 5000));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe('data-1');

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(result.current.data).toBe('data-2');
    });

    expect(result.current.loading).toBe(false);
  });

  it('updates lastUpdated on each successful fetch', async () => {
    const fetchFn = jest.fn().mockResolvedValue('data');

    const { result } = renderHook(() => usePolling(fetchFn, 5000));

    await waitFor(() => {
      expect(result.current.lastUpdated).not.toBeNull();
    });

    const firstUpdate = result.current.lastUpdated!;

    jest.setSystemTime(new Date(Date.now() + 10000));

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(result.current.lastUpdated!.getTime()).toBeGreaterThanOrEqual(
        firstUpdate.getTime(),
      );
    });
  });

  it('preserves previous data on polling error', async () => {
    let callCount = 0;
    const fetchFn = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 2) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve('good-data');
    });

    const { result } = renderHook(() => usePolling(fetchFn, 5000));

    await waitFor(() => {
      expect(result.current.data).toBe('good-data');
    });

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.data).toBe('good-data');
    expect(result.current.error?.message).toBe('Network error');
  });

  it('stops polling when stopWhen returns true', async () => {
    let callCount = 0;
    const fetchFn = jest.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({ count: callCount, done: callCount >= 2 });
    });

    const stopWhen = (d: { done: boolean }) => d.done;

    const { result } = renderHook(() =>
      usePolling(fetchFn, 5000, { stopWhen }),
    );

    await waitFor(() => {
      expect(result.current.data).toEqual({ count: 1, done: false });
    });

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ count: 2, done: true });
    });

    // Further ticks should not trigger more fetches
    await act(async () => {
      jest.advanceTimersByTime(15000);
    });

    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('skips fetch when document.hidden is true', async () => {
    const fetchFn = jest.fn().mockResolvedValue('data');

    renderHook(() => usePolling(fetchFn, 5000));

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    Object.defineProperty(document, 'hidden', {
      value: true,
      writable: true,
      configurable: true,
    });

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    // Should still be 1 — poll was skipped
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('fetches immediately when tab becomes visible via visibilitychange', async () => {
    const fetchFn = jest.fn().mockResolvedValue('data');

    renderHook(() => usePolling(fetchFn, 5000));

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    // Tab goes hidden
    Object.defineProperty(document, 'hidden', {
      value: true,
      writable: true,
      configurable: true,
    });

    // Tab becomes visible again
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true,
      configurable: true,
    });

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });
  });

  it('does not start polling when enabled is false', async () => {
    const fetchFn = jest.fn().mockResolvedValue('data');

    const { result } = renderHook(() =>
      usePolling(fetchFn, 5000, { enabled: false }),
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(15000);
    });

    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('cleans up interval and event listener on unmount', async () => {
    const fetchFn = jest.fn().mockResolvedValue('data');
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => usePolling(fetchFn, 5000));

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    unmount();

    await act(async () => {
      jest.advanceTimersByTime(15000);
    });

    // No more calls after unmount
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
    );
  });

  it('sets error and loading false on initial fetch failure', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new Error('Initial failure'));

    const { result } = renderHook(() => usePolling(fetchFn, 5000));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error?.message).toBe('Initial failure');
    expect(result.current.data).toBeNull();
  });

  it('throws error for zero interval', () => {
    const fetchFn = jest.fn().mockResolvedValue('data');

    expect(() => renderHook(() => usePolling(fetchFn, 0))).toThrow(
      'intervalMs must be a positive finite number',
    );
  });

  it('throws error for negative interval', () => {
    const fetchFn = jest.fn().mockResolvedValue('data');

    expect(() => renderHook(() => usePolling(fetchFn, -1000))).toThrow(
      'intervalMs must be a positive finite number',
    );
  });

  it('throws error for NaN interval', () => {
    const fetchFn = jest.fn().mockResolvedValue('data');

    expect(() => renderHook(() => usePolling(fetchFn, NaN))).toThrow(
      'intervalMs must be a positive finite number',
    );
  });

  it('throws error for Infinity interval', () => {
    const fetchFn = jest.fn().mockResolvedValue('data');

    expect(() => renderHook(() => usePolling(fetchFn, Infinity))).toThrow(
      'intervalMs must be a positive finite number',
    );
  });
});
