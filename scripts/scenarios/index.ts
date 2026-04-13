import { ADMIN_BASIC_SCENARIO } from './admin-basic.js'

export const SCENARIOS = {
  'admin-basic': ADMIN_BASIC_SCENARIO,
}

export type ScenarioName = keyof typeof SCENARIOS

export function getScenario(name: string) {
  const scenario = SCENARIOS[name as ScenarioName]

  if (!scenario) {
    throw new Error(`Unknown scenario "${name}"`)
  }

  return scenario
}
