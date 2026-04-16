import type { NextFunction, Response } from 'express';
import type { RequestWithId } from '../core/http.js';

export function requestLogger(
  request: RequestWithId,
  response: Response,
  next: NextFunction,
) {
  const startedAt = Date.now();

  response.on('finish', () => {
    const durationMs = Date.now() - startedAt;

    console.log(
      `[api-gateway][${request.requestId ?? 'no-request-id'}] ${request.method} ${request.originalUrl} ${response.statusCode} ${durationMs}ms`,
    );
  });

  next();
}
