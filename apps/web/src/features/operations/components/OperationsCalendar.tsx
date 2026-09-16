import { useMemo, useState } from 'react';
import type { AdminOperation, Operation } from '@servicienta/types';
import { formatOperationStatus } from '../../shared/utils/operation-status';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

type CalendarOperation = Operation | AdminOperation;

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatPerson(
  name: string | null,
  surname: string | null,
  email: string | null = null,
  fallbackLabel = 'Cliente',
) {
  return `${name ?? ''} ${surname ?? ''}`.trim() || email || fallbackLabel;
}

function buildCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      date,
      key: getDateKey(date),
      isCurrentMonth: date.getMonth() === month.getMonth(),
    };
  });
}

export function OperationsCalendar({
  operations,
  role,
  onSelectOperation,
}: {
  operations: CalendarOperation[];
  role: 'technician' | 'admin';
  onSelectOperation: (operationId: string) => void;
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthStart(new Date()));
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const operationsByDay = useMemo(() => {
    const grouped = new Map<string, CalendarOperation[]>();

    operations.forEach((operation) => {
      if (!operation.scheduled_at) return;

      const dateKey = getDateKey(new Date(operation.scheduled_at));
      const dayOperations = grouped.get(dateKey) ?? [];
      dayOperations.push(operation);
      dayOperations.sort(
        (left, right) =>
          new Date(left.scheduled_at!).getTime() -
          new Date(right.scheduled_at!).getTime(),
      );
      grouped.set(dateKey, dayOperations);
    });

    return grouped;
  }, [operations]);
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const scheduledCount = operations.filter((operation) => operation.scheduled_at).length;
  const selectedDayOperations = selectedDayKey
    ? operationsByDay.get(selectedDayKey) ?? []
    : [];
  const selectedDay = selectedDayKey
    ? calendarDays.find((day) => day.key === selectedDayKey)?.date ?? null
    : null;

  return (
    <section className="operations-calendar" aria-label="Calendario de visitas">
      <header className="operations-calendar__header">
        <div>
          <p className="user-card__label">Agenda</p>
          <h2>{formatMonth(visibleMonth)}</h2>
          <p>{scheduledCount} visitas programadas en los resultados cargados.</p>
        </div>
        <div className="operations-calendar__month-actions">
          <button
            type="button"
            aria-label="Mes anterior"
            onClick={() =>
              setVisibleMonth(
                (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
              )
            }
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setVisibleMonth(getMonthStart(new Date()))}
          >
            Hoy
          </button>
          <button
            type="button"
            aria-label="Mes siguiente"
            onClick={() =>
              setVisibleMonth(
                (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
              )
            }
          >
            ›
          </button>
        </div>
      </header>

      <div className="operations-calendar__weekdays" aria-hidden="true">
        {WEEKDAYS.map((weekday) => <span key={weekday}>{weekday}</span>)}
      </div>
      <div className="operations-calendar__grid">
        {calendarDays.map((day) => {
          const dayOperations = operationsByDay.get(day.key) ?? [];

          return (
            <div
              key={day.key}
              className={`operations-calendar__day ${day.isCurrentMonth ? '' : 'operations-calendar__day--outside'}`.trim()}
            >
              {dayOperations.length ? (
                <button
                  type="button"
                  className="operations-calendar__day-number operations-calendar__day-button"
                  onClick={() => setSelectedDayKey(day.key)}
                  aria-label={`Ver ${dayOperations.length} visitas del ${day.date.getDate()}`}
                >
                  {day.date.getDate()}
                </button>
              ) : (
                <span className="operations-calendar__day-number">{day.date.getDate()}</span>
              )}
              <div className="operations-calendar__entries">
                {dayOperations.slice(0, 3).map((operation) => (
                  <button
                    key={operation.id}
                    type="button"
                    className={`operations-calendar__entry operations-calendar__entry--${operation.status}`}
                    onClick={() => onSelectOperation(operation.id)}
                    title={`${formatTime(operation.scheduled_at!)} · ${formatOperationStatus(operation.status)}`}
                  >
                    <time>{formatTime(operation.scheduled_at!)}</time>
                    <span>
                      {role === 'admin'
                        ? `${formatPerson(operation.client_name, operation.client_surname, operation.client_email)} · ${formatPerson(operation.technician_name, operation.technician_surname, operation.technician_email, 'Técnico')}`
                        : formatPerson(
                            operation.client_name,
                            operation.client_surname,
                            operation.client_email,
                          )}
                    </span>
                  </button>
                ))}
                {dayOperations.length > 3 ? (
                  <button
                    type="button"
                    className="operations-calendar__more"
                    onClick={() => setSelectedDayKey(day.key)}
                  >
                    +{dayOperations.length - 3} más
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDay ? (
        <div
          className="users-modal operations-calendar__modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="operations-calendar-day-title"
          onClick={() => setSelectedDayKey(null)}
        >
          <section
            className="users-modal__panel operations-calendar__modal-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="users-modal__header">
              <div>
                <p className="users-hero__eyebrow">Agenda del día</p>
                <h2 id="operations-calendar-day-title">
                  {new Intl.DateTimeFormat('es-AR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  }).format(selectedDay)}
                </h2>
              </div>
              <button
                type="button"
                className="users-modal__close"
                onClick={() => setSelectedDayKey(null)}
              >
                Cerrar
              </button>
            </header>
            <div className="operations-calendar__day-list">
              {selectedDayOperations.map((operation) => (
                <button
                  key={operation.id}
                  type="button"
                  className={`operations-calendar__day-list-item operations-calendar__entry--${operation.status}`}
                  onClick={() => {
                    setSelectedDayKey(null);
                    onSelectOperation(operation.id);
                  }}
                >
                  <strong>{formatTime(operation.scheduled_at!)}</strong>
                  <span>
                    {role === 'admin'
                      ? `${formatPerson(operation.client_name, operation.client_surname, operation.client_email)} · ${formatPerson(operation.technician_name, operation.technician_surname, operation.technician_email, 'Técnico')}`
                      : formatPerson(
                          operation.client_name,
                          operation.client_surname,
                          operation.client_email,
                        )}
                  </span>
                  <small>{formatOperationStatus(operation.status)}</small>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
