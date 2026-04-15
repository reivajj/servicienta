import cors from 'cors'
import express from 'express'
import { createServiceSupabaseClient } from './core/supabase.js'
import type { ApiGatewayEnv } from './env.js'
import { errorHandler } from './middleware/error-handler.js'
import { notFound } from './middleware/not-found.js'
import { requestId } from './middleware/request-id.js'
import { requestLogger } from './middleware/request-logger.js'
import { healthRouter } from './system/health.js'
import { technicianProfilesRouter } from './technician-profiles/router.js'
import { usersRouter } from './users/router.js'

export function createApp(env: ApiGatewayEnv) {
  const app = express()
  const supabase = createServiceSupabaseClient(env)

  app.use(cors())
  app.use(express.json())
  app.use(requestId)
  app.use(requestLogger)

  app.use(healthRouter)
  app.use(technicianProfilesRouter({ supabase }))
  app.use(usersRouter({ supabase }))
  app.use(notFound)
  app.use(errorHandler)

  return app
}
