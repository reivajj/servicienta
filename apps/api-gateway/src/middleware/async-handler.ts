import type {
  NextFunction,
  Response,
} from 'express'
import type { RequestWithId } from '../core/http.js'

type AsyncRequestHandler = (
  request: RequestWithId,
  response: Response,
  next: NextFunction,
) => Promise<unknown>

export function asyncHandler(handler: AsyncRequestHandler) {
  return function wrappedAsyncHandler(
    request: RequestWithId,
    response: Response,
    next: NextFunction,
  ) {
    void Promise.resolve(handler(request, response, next)).catch(next)
  }
}
