import type { NextFunction, Response } from 'express';
import { AppError } from '../core/errors.js';
import { errorResponse } from '../core/http-response.js';
import type { RequestWithId } from '../core/http.js';

export function errorHandler(
  error: unknown,
  request: RequestWithId,
  response: Response,
  next: NextFunction,
) {
  void next;

  if (error instanceof AppError) {
    errorResponse(response, request, error.message, error.statusCode);
    return;
  }

  errorResponse(
    response,
    request,
    error instanceof Error ? error.message : 'Internal server error',
    500,
  );
}
