import type { Response } from 'express'
import type { RequestWithId } from './http.js'

export function ok<T>(response: Response, data: T, statusCode = 200) {
  response.status(statusCode).json({ data })
}

export function errorResponse(
  response: Response,
  request: RequestWithId,
  message: string,
  statusCode: number,
) {
  response.status(statusCode).json({
    error: message,
    requestId: request.requestId ?? null,
  })
}
