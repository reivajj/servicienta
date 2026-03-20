export interface ApiGatewayEnv {
  port: number
  supabaseUrl: string
  supabaseServiceRoleKey: string
}

export function readApiGatewayEnv(env: NodeJS.ProcessEnv): ApiGatewayEnv {
  const port = Number(env.PORT ?? '4000')
  const supabaseUrl = env.SUPABASE_URL?.trim()
  const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing API gateway env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
    )
  }

  return {
    port: Number.isFinite(port) ? port : 4000,
    supabaseUrl,
    supabaseServiceRoleKey,
  }
}
