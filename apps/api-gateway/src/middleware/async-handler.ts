import type {
  NextFunction,
  Request,
  Response,
} from 'express'

type AsyncRequestHandler = (
  request: Request,
  response: Response,
  next: NextFunction,
) => Promise<unknown>

export function asyncHandler(handler: AsyncRequestHandler) {
  return function wrappedAsyncHandler(
    request: Request,
    response: Response,
    next: NextFunction,
  ) {
    void Promise.resolve(handler(request, response, next)).catch(next)
  }
}
