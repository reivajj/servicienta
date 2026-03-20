import type {
  NextFunction,
  Request,
  Response,
} from 'express'
import { AppError } from '../core/errors.js'

export function notFound(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  next(new AppError(`Route not found: ${request.method} ${request.originalUrl}`, 404))
}
