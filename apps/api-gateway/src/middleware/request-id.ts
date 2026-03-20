import { randomUUID } from 'node:crypto'
import type {
  NextFunction,
  Response,
} from 'express'
import type { RequestWithId } from '../core/http.js'

export function requestId(
  request: RequestWithId,
  response: Response,
  next: NextFunction,
) {
  const incomingRequestId = request.header('x-request-id')?.trim()
  const resolvedRequestId = incomingRequestId || randomUUID()

  request.requestId = resolvedRequestId
  response.setHeader('x-request-id', resolvedRequestId)

  next()
}
