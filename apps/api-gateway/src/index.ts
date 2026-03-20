import { config as loadEnv } from 'dotenv'
import cors from 'cors'
import express from 'express'
import type { Technician } from '@servicienta/types'
import { extractBearerToken } from './auth.js'
import { readApiGatewayEnv } from './env.js'
import { createServiceSupabaseClient } from './supabase.js'

loadEnv({ path: new URL('../.env.local', import.meta.url).pathname })

const env = readApiGatewayEnv(process.env)
const supabase = createServiceSupabaseClient(env)
const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_request, response) => {
  response.json({ ok: true })
})

app.get('/api/technicians', async (request, response) => {
  const accessToken = extractBearerToken(request)
  void accessToken

  const { data, error } = await supabase
    .from('technicians')
    .select('id, full_name, specialty, city, bio, is_available, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    response.status(500).json({ error: error.message })
    return
  }

  response.json({
    data: (data ?? []) as Technician[],
  })
})

app.listen(env.port, () => {
  console.log(`api-gateway listening on http://localhost:${env.port}`)
})
