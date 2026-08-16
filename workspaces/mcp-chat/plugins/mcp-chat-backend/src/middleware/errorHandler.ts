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

import { LoggerService } from '@backstage/backend-plugin-api';
import { InputError, NotFoundError, NotAllowedError } from '@backstage/errors';
import { ErrorRequestHandler } from 'express';

/**
 * Creates an Express error-handling middleware that maps `@backstage/errors`
 * types to the appropriate HTTP status codes and returns a consistent
 * `{ error: string }` response body shape.
 *
 * Status code mapping:
 * - InputError → 400
 * - NotFoundError → 404
 * - NotAllowedError → 403
 * - Any other Error → 500
 *
 * @param logger - Logger instance for recording server errors
 * @returns Express error request handler
 */
export function createErrorHandler(logger: LoggerService): ErrorRequestHandler {
  return (err, _req, res, _next) => {
    // Handle JSON parse errors from express.json() middleware
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: 'Invalid JSON in request body' });
    }

    if (err instanceof InputError) {
      return res.status(400).json({ error: err.message });
    }

    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }

    if (err instanceof NotAllowedError) {
      return res.status(403).json({ error: err.message });
    }

    // Untyped errors are internal server errors
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    logger.error(`Unhandled error in route handler: ${message}`, err as Error);
    return res.status(500).json({ error: message });
  };
}
