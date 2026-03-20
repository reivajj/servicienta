export interface ApiGatewayEnv {
  port: number
}

export function readApiGatewayEnv(env: NodeJS.ProcessEnv): ApiGatewayEnv {
  const port = Number(env.PORT ?? '4000')

  return {
    port: Number.isFinite(port) ? port : 4000,
  }
}
