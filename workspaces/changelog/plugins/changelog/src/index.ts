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

export { EntityChangelogContent, EntityChangelogCard } from './plugin';
export { semverParser } from './util/semverParser';
export {
  isChangelogAvailable,
  getInfoAboutChangelogAnnotationConfiguration,
  CHANGELOG_ANNOTATION_REF,
  CHANGELOG_ANNOTATION_NAME,
} from './util/constants';
export type {
  EntityChangelogProps,
  ChangelogAction,
  ChangelogProps,
} from './util/types';
