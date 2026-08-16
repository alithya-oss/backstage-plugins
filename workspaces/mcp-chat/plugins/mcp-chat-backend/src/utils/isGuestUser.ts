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

/**
 * Check if a user is a guest user based on their userEntityRef.
 * Guest users have userEntityRef like 'user:development/guest'.
 *
 * Guest users are excluded from conversation storage to provide
 * a stateless, high-performance experience for demo/development.
 *
 * @param userEntityRef - The user's entity reference string
 * @returns true if the user is a guest user
 *
 * @example
 * ```typescript
 * isGuestUser('user:development/guest'); // true
 * isGuestUser('user:default/john.doe'); // false
 * ```
 *
 * @public
 */
export function isGuestUser(userEntityRef: string): boolean {
  const guestPattern = /^user:development\/guest$/i;
  return guestPattern.test(userEntityRef);
}
