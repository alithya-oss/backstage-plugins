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

import { BranchPickerPrimitive } from '@assistant-ui/react';
import { RiArrowLeftSLine, RiArrowRightSLine } from '@remixicon/react';
import styles from './PromptBranchPicker.module.css';

/**
 * Moves between the versions of an answer, showing which one is on screen.
 *
 * Only the last user turn ever has more than one answer — regenerating adds a
 * version to the tail, and anything else truncates — so `hideWhenSingleBranch`
 * is what keeps the control off every other turn without the page tracking
 * where the branch point is.
 *
 * The position is spelled out rather than left to the chevrons alone: a picker
 * that only offers arrows leaves the user unsure which version they are reading.
 */
export const PromptBranchPicker = () => (
  <BranchPickerPrimitive.Root
    hideWhenSingleBranch
    className={styles.root}
    aria-label="Answer versions"
  >
    <BranchPickerPrimitive.Previous
      className={styles.button}
      aria-label="Previous answer"
    >
      <RiArrowLeftSLine aria-hidden className={styles.icon} />
    </BranchPickerPrimitive.Previous>
    <span className={styles.position}>
      Answer <BranchPickerPrimitive.Number /> of <BranchPickerPrimitive.Count />
    </span>
    <BranchPickerPrimitive.Next
      className={styles.button}
      aria-label="Next answer"
    >
      <RiArrowRightSLine aria-hidden className={styles.icon} />
    </BranchPickerPrimitive.Next>
  </BranchPickerPrimitive.Root>
);
