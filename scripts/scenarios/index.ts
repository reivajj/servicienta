import { ADMIN_BASIC_SCENARIO } from './admin-basic.js';
import { ORDERS_OPERATIONS_REALISTIC_SCENARIO } from './orders-operations-realistic.js';
import { TECHNICIAN_SEARCH_BASIC_SCENARIO } from './technician-search-basic.js';

export const SCENARIOS = {
  'admin-basic': ADMIN_BASIC_SCENARIO,
  'orders-operations-realistic': ORDERS_OPERATIONS_REALISTIC_SCENARIO,
  'technician-search-basic': TECHNICIAN_SEARCH_BASIC_SCENARIO,
};

export type ScenarioName = keyof typeof SCENARIOS;

export function getScenario(name: string) {
  const scenario = SCENARIOS[name as ScenarioName];

  if (!scenario) {
    throw new Error(`Unknown scenario "${name}"`);
  }

  return scenario;
}
