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
 * Determines whether a database error represents a missing table condition.
 *
 * Detects missing tables for both SQLite and PostgreSQL:
 * - SQLite: error code `SQLITE_ERROR` with "no such table" message
 * - PostgreSQL: error code `42P01` (undefined_table)
 * - Fallback: message-based detection for compatibility
 *
 * @param error - The error to inspect
 * @returns true if the error indicates a missing database table
 *
 * @example
 * ```typescript
 * try {
 *   await store.getConversations(userId);
 * } catch (error) {
 *   if (isMissingTableError(error)) {
 *     return { conversations: [], count: 0 };
 *   }
 *   throw error;
 * }
 * ```
 */
export function isMissingTableError(error: unknown): boolean {
  if (error instanceof Error && 'code' in error) {
    const code = (error as any).code;
    // SQLite: SQLITE_ERROR with 'no such table'
    // PostgreSQL: relation "..." does not exist (code 42P01)
    if (code === 'SQLITE_ERROR' || code === '42P01') {
      return true;
    }
  }
  // Fallback to message checking for compatibility
  if (error instanceof Error) {
    return (
      error.message.includes('no such table') ||
      (error.message.includes('relation') &&
        error.message.includes('does not exist'))
    );
  }
  return false;
}
