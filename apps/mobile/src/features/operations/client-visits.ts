import type { Operation } from '@servicienta/types';
import { argentinaDay } from '../today/agenda';

type Visit = Pick<
  Operation,
  | 'id'
  | 'status'
  | 'scheduled_at'
  | 'created_at'
  | 'technician_completed_at'
  | 'technician_review'
>;
export const CLIENT_REJECTION_MESSAGE =
  'Rechazaste la finalización de esta visita porque el trabajo no está terminado. Podés hablar con el técnico por el chat del pedido para explicar qué quedó pendiente y coordinar cómo continuar.';

const visitTime = (visit: Visit) =>
  Date.parse(
    visit.scheduled_at ?? visit.technician_completed_at ?? visit.created_at,
  );
export function clientVisitGuidance(visit: Visit, now: Date) {
  if (visit.status === 'completed_tech')
    return {
      text: 'El técnico marcó la visita como terminada. Confirmá si el trabajo está completo y compartí tu opinión sobre la atención recibida.',
      action: 'Completar visita y opinar',
      ready: true,
    };
  if (visit.status === 'completed' && !visit.technician_review)
    return {
      text: 'Ya confirmaste la visita. Contanos cómo fue tu experiencia y ayudá a otras personas con tu opinión.',
      action: 'Dejar mi opinión',
      ready: true,
    };
  if (visit.status === 'scheduled') {
    const day = visit.scheduled_at ? argentinaDay(visit.scheduled_at) : null;
    const today = argentinaDay(now);
    return {
      text:
        day === today
          ? 'Tu visita está programada para hoy. Cuando el técnico la marque como terminada, podrás confirmar el trabajo y dejar tu opinión.'
          : day && day < today
            ? 'La fecha de tu visita ya pasó. Estamos esperando que el técnico la marque como terminada para que puedas confirmar el trabajo y dejar tu opinión. Podés contactarlo por el chat del pedido.'
            : 'Tu visita está programada. Cuando el técnico la marque como terminada, podrás confirmar el trabajo y dejar tu opinión.',
      action: null,
      ready: false,
    };
  }
  if (visit.status === 'pending')
    return {
      text: 'Tu visita todavía no tiene fecha confirmada. Coordiná con el técnico desde el chat del pedido.',
      action: null,
      ready: false,
    };
  if (visit.status === 'completion_rejected')
    return {
      text: CLIENT_REJECTION_MESSAGE,
      action: null,
      ready: false,
    };
  return null;
}

export function organizeClientVisits<T extends Visit>(visits: T[], now: Date) {
  const today = argentinaDay(now);
  const isTodayOrPast = (visit: Visit) =>
    argentinaDay(new Date(visitTime(visit))) <= today;
  const outstanding = (visit: Visit) =>
    visit.status === 'completed_tech' ||
    visit.status === 'completion_rejected' ||
    (visit.status === 'completed' && !visit.technician_review) ||
    visit.status === 'pending' ||
    (visit.status === 'scheduled' && isTodayOrPast(visit));
  const recentFirst = (a: Visit, b: Visit) =>
    visitTime(b) - visitTime(a) || a.id.localeCompare(b.id);
  const featured = visits
    .filter(
      (visit) =>
        outstanding(visit) &&
        visit.status !== 'pending' &&
        (isTodayOrPast(visit) || visit.status === 'completed_tech'),
    )
    .sort(recentFirst)[0];
  const upcoming = visits
    .filter((visit) => visit.status === 'scheduled' && !outstanding(visit))
    .sort((a, b) => visitTime(a) - visitTime(b) || a.id.localeCompare(b.id));
  const visibleIds = new Set([
    featured?.id,
    ...upcoming.map((visit) => visit.id),
  ]);
  const history = visits
    .filter((visit) => !visibleIds.has(visit.id))
    .sort(recentFirst);
  return {
    featured,
    history,
    sections: [
      { title: 'Visita pendiente', data: featured ? [featured] : [] },
      { title: 'Próximas visitas', data: upcoming },
    ].filter((section) => section.data.length),
  };
}
