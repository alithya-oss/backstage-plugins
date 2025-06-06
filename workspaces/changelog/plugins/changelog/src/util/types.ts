/*
 * Copyright 2023 RSC-Labs, https://rsoftcon.com/
 *
 * Licensed under the Mozilla Public License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.mozilla.org/en-US/MPL/2.0/
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** @public */
export type ChangelogAction = {
  name: string;
  counter: number;
  content: string;
  icon?: any;
};

/** @public */
export type ChangelogProps = {
  versionNumber: string;
  actions: ChangelogAction[];
  versionContent: string | undefined;
};

/**
 * Props for {@link EntityChangelogCard}.
 * Props for {@link EntityChangelogContent}
 * @public
 */
export interface EntityChangelogProps {
  parser?(content: string): ChangelogProps[];
}
