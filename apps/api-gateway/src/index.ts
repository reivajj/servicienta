import { config as loadEnv } from 'dotenv'
import { createApp } from './app.js'
import { readApiGatewayEnv } from './env.js'

loadEnv({ path: new URL('../.env.local', import.meta.url).pathname })

const env = readApiGatewayEnv(process.env)
const app = createApp(env)

app.listen(env.port, () => {
  console.log(`api-gateway listening on http://localhost:${env.port}`)
})
