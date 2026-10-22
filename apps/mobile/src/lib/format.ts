import type { OperationStatus, OrderStatus } from '@servicienta/types';

const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptado',
  cancelled: 'Cancelado',
  in_progress: 'En progreso',
  completed_tech: 'Trabajo terminado',
  completion_rejected: 'Finalización rechazada',
  completed: 'Completado',
};

const operationStatusLabels: Record<OperationStatus, string> = {
  pending: 'Pendiente de agenda',
  scheduled: 'Agendada',
  completed_tech: 'Trabajo terminado',
  completion_rejected: 'Finalización rechazada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export function formatOrderStatus(status: OrderStatus) {
  return orderStatusLabels[status];
}

export function formatOperationStatus(status: OperationStatus) {
  return operationStatusLabels[status];
}

export function formatDateTime(value: string | null, timeZone?: string) {
  if (!value) return 'Sin fecha programada';

  const date = new Intl.DateTimeFormat('es-AR', {
    timeZone,
    dateStyle: 'medium',
  }).format(new Date(value));
  return `${date} · ${formatTime(value, timeZone)}`;
}

export function formatTime(value: string | null, timeZone?: string) {
  if (!value) return 'Sin horario';
  const time = new Intl.DateTimeFormat('es-AR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value));
  return `${time}hs`;
}

export function formatPersonName(name: string | null, surname: string | null) {
  return [name, surname].filter(Boolean).join(' ') || 'Cliente sin nombre';
}

export function formatSlug(value: string | null) {
  if (!value) return 'Sin definir';

  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}
