import { config as loadEnv } from 'dotenv'
import cors from 'cors'
import express from 'express'
import { readApiGatewayEnv } from './env.js'

loadEnv({ path: new URL('../.env.local', import.meta.url).pathname })

const env = readApiGatewayEnv(process.env)
const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_request, response) => {
  response.json({ ok: true })
})

app.listen(env.port, () => {
  console.log(`api-gateway listening on http://localhost:${env.port}`)
})
