import type {
  OperationStatus,
  OrderFlowType,
  OrderStatus,
} from '@servicienta/types';

export function formatOperationStatus(status: OperationStatus) {
  const labels: Record<OperationStatus, string> = {
    pending: 'Pendiente',
    scheduled: 'Agendada',
    completed_tech: 'Completada por técnico',
    completed: 'Completada',
    cancelled: 'Cancelada',
  };

  return labels[status];
}

export function formatOrderStatus(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    pending: 'Pendiente',
    accepted: 'Aceptado',
    cancelled: 'Cancelado',
    in_progress: 'En progreso',
    completed_tech: 'Completado por técnico',
    completed: 'Completado',
  };

  return labels[status];
}

export function formatOrderFlowType(flowType: OrderFlowType) {
  const labels: Record<OrderFlowType, string> = {
    client_selects: 'El cliente elige',
    tech_applies: 'El técnico se postula',
  };

  return labels[flowType];
}
