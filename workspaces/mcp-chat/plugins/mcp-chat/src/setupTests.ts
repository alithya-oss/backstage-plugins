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

import '@testing-library/jest-dom';

/**
 * jsdom ships no `ResizeObserver`, and the Assistant UI thread viewport observes
 * its content size to decide when to follow the bottom of the conversation. A
 * no-op observer is enough: the tests assert what is rendered, never how far the
 * viewport scrolled.
 */
if (!('ResizeObserver' in globalThis)) {
  class ResizeObserverStub implements ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  (globalThis as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver =
    ResizeObserverStub;
}

/**
 * jsdom implements no scrolling either, and the same viewport calls `scrollTo`
 * from an animation frame — where a throwing call surfaces as an unhandled
 * exception rather than a failed assertion. A no-op keeps that noise out of runs
 * that are not about scroll position.
 */
if (typeof Element !== 'undefined' && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = () => {};
}
