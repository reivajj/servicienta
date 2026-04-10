import type { Request } from 'express'
import type { User } from '@servicienta/types'

export type RequestAuth = User

export interface RequestWithId extends Request {
  requestId?: string
  auth?: RequestAuth
}
