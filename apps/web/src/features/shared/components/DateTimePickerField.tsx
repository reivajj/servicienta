import { useEffect, useId, useMemo, useRef, useState } from 'react';

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function toLocalDateTimeInputValue(value: string | null) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function getInitialDate(localValue: string) {
  return localValue ? localValue.slice(0, 10) : '';
}

function getInitialTime(localValue: string) {
  return localValue ? localValue.slice(11, 16) : '';
}

function getMonthBase(selectedDate: string) {
  if (selectedDate) {
    const [year, month] = selectedDate.split('-').map(Number);
    return new Date(year, (month ?? 1) - 1, 1);
  }

  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

function formatMonthLabel(monthDate: Date) {
  return new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
  }).format(monthDate);
}

function formatPreview(date: string, time: string) {
  if (!date || !time) return '';

  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const value = new Date(
    year ?? 0,
    (month ?? 1) - 1,
    day ?? 1,
    hours ?? 0,
    minutes ?? 0,
  );

  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

function getTodayDateString() {
  const today = new Date();

  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}

function isDateBeforeToday(date: string) {
  return Boolean(date) && date < getTodayDateString();
}

function roundUpToStep(date: Date, stepMinutes: number) {
  const rounded = new Date(date);

  rounded.setSeconds(0, 0);

  const minutes = rounded.getMinutes();
  const remainder = minutes % stepMinutes;

  if (remainder !== 0) {
    rounded.setMinutes(minutes + stepMinutes - remainder);
  } else if (date.getSeconds() > 0 || date.getMilliseconds() > 0) {
    rounded.setMinutes(minutes + stepMinutes);
  }

  return rounded;
}

function getMinTimeForDate(
  date: string,
  preventPastTimeSelection: boolean,
  minuteStep: number,
) {
  if (!preventPastTimeSelection || date !== getTodayDateString()) return null;

  const rounded = roundUpToStep(new Date(), minuteStep);

  return `${pad(rounded.getHours())}:${pad(rounded.getMinutes())}`;
}

function isTimeAlignedToStep(time: string, minuteStep: number) {
  if (!time) return false;

  const [hours, minutes] = time.split(':').map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return false;

  return minutes % minuteStep === 0;
}

function isTimeBeforeMin(time: string, minTime: string | null) {
  if (!time || !minTime) return false;

  return time < minTime;
}

function isTimeSelectable({
  date,
  time,
  minuteStep,
  preventPastTimeSelection,
}: {
  date: string;
  time: string;
  minuteStep: number;
  preventPastTimeSelection: boolean;
}) {
  if (!time) return false;
  if (!isTimeAlignedToStep(time, minuteStep)) return false;

  const minTime = getMinTimeForDate(date, preventPastTimeSelection, minuteStep);
  if (isTimeBeforeMin(time, minTime)) return false;

  return true;
}

function buildCalendarDays(monthBase: Date) {
  const year = monthBase.getFullYear();
  const month = monthBase.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const value = new Date(startDate);
    value.setDate(startDate.getDate() + index);

    return {
      key: `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`,
      dayNumber: value.getDate(),
      isoDate: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
      isCurrentMonth: value.getMonth() === month,
      isToday:
        value.getFullYear() === new Date().getFullYear() &&
        value.getMonth() === new Date().getMonth() &&
        value.getDate() === new Date().getDate(),
    };
  });
}

function buildAvailableTimes({
  date,
  minuteStep,
  preventPastTimeSelection,
}: {
  date: string;
  minuteStep: number;
  preventPastTimeSelection: boolean;
}) {
  if (!date) return [];

  const values: string[] = [];

  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += minuteStep) {
      const time = `${pad(hour)}:${pad(minute)}`;

      if (
        isTimeSelectable({
          date,
          time,
          minuteStep,
          preventPastTimeSelection,
        })
      ) {
        values.push(time);
      }
    }
  }

  return values;
}

function getHourValue(time: string | null) {
  if (!time) return '--';

  return time.slice(0, 2);
}

function getMinuteValue(time: string | null) {
  if (!time) return '--';

  return time.slice(3, 5);
}

function TimeStepper({
  selectedTime,
  availableTimes,
  minuteStep,
  onChange,
}: {
  selectedTime: string;
  availableTimes: string[];
  minuteStep: number;
  onChange: (time: string) => void;
}) {
  const currentIndex = availableTimes.indexOf(selectedTime);
  const hourDelta = Math.max(1, 60 / minuteStep);
  const hasTime = currentIndex >= 0;

  function move(delta: number) {
    if (!availableTimes.length) return;

    const baseIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = Math.min(
      availableTimes.length - 1,
      Math.max(0, baseIndex + delta),
    );

    onChange(availableTimes[nextIndex]);
  }

  return (
    <div className="date-time-picker__time-stepper">
      <div className="date-time-picker__time-column">
        <button
          type="button"
          className="date-time-picker__time-nav"
          onClick={() => move(-hourDelta)}
          disabled={!hasTime || currentIndex <= 0}
          aria-label="Restar una hora"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="m7 14 5-5 5 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="date-time-picker__time-value">
          {getHourValue(selectedTime || null)}
        </div>
        <button
          type="button"
          className="date-time-picker__time-nav"
          onClick={() => move(hourDelta)}
          disabled={!hasTime || currentIndex >= availableTimes.length - 1}
          aria-label="Sumar una hora"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="m7 10 5 5 5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="date-time-picker__time-separator">:</div>

      <div className="date-time-picker__time-column">
        <button
          type="button"
          className="date-time-picker__time-nav"
          onClick={() => move(-1)}
          disabled={!hasTime || currentIndex <= 0}
          aria-label={`Restar ${minuteStep} minutos`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="m7 14 5-5 5 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="date-time-picker__time-value">
          {getMinuteValue(selectedTime || null)}
        </div>
        <button
          type="button"
          className="date-time-picker__time-nav"
          onClick={() => move(1)}
          disabled={!hasTime || currentIndex >= availableTimes.length - 1}
          aria-label={`Sumar ${minuteStep} minutos`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="m7 10 5 5 5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function DateTimePickerField({
  name,
  label,
  initialValue,
  required = false,
  allowClear = false,
  disablePastDates = false,
  preventPastTimeSelection = false,
  minuteStep = 10,
}: {
  name: string;
  label: string;
  initialValue: string | null;
  required?: boolean;
  allowClear?: boolean;
  disablePastDates?: boolean;
  preventPastTimeSelection?: boolean;
  minuteStep?: number;
}) {
  const fieldId = useId();
  const initialLocalValue = toLocalDateTimeInputValue(initialValue);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() =>
    getInitialDate(initialLocalValue),
  );
  const [selectedTime, setSelectedTime] = useState(() =>
    getInitialTime(initialLocalValue),
  );
  const [visibleMonth, setVisibleMonth] = useState(() =>
    getMonthBase(getInitialDate(initialLocalValue)),
  );

  const monthLabel = formatMonthLabel(visibleMonth);
  const calendarDays = useMemo(
    () => buildCalendarDays(visibleMonth),
    [visibleMonth],
  );
  const availableTimes = useMemo(
    () =>
      buildAvailableTimes({
        date: selectedDate,
        minuteStep,
        preventPastTimeSelection,
      }),
    [minuteStep, preventPastTimeSelection, selectedDate],
  );
  const isCurrentSelectionValid =
    (!selectedDate && !selectedTime) ||
    (Boolean(selectedDate) &&
      Boolean(selectedTime) &&
      (!disablePastDates || !isDateBeforeToday(selectedDate)) &&
      availableTimes.includes(selectedTime));

  const hiddenValue =
    isCurrentSelectionValid && selectedDate && selectedTime
      ? `${selectedDate}T${selectedTime}`
      : '';
  const preview =
    isCurrentSelectionValid && selectedDate && selectedTime
      ? formatPreview(selectedDate, selectedTime)
      : '';

  useEffect(() => {
    if (!selectedDate) {
      if (selectedTime) setSelectedTime('');
      return;
    }

    if (disablePastDates && isDateBeforeToday(selectedDate)) {
      setSelectedTime('');
      return;
    }

    if (!availableTimes.length) {
      if (selectedTime) setSelectedTime('');
      return;
    }

    if (!selectedTime || !availableTimes.includes(selectedTime)) {
      setSelectedTime(availableTimes[0]);
    }
  }, [
    availableTimes,
    disablePastDates,
    selectedDate,
    selectedTime,
  ]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;

      setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  function changeMonth(delta: number) {
    setVisibleMonth((current) =>
      new Date(current.getFullYear(), current.getMonth() + delta, 1),
    );
  }

  function handleDaySelect(date: string) {
    if (disablePastDates && isDateBeforeToday(date)) return;

    setSelectedDate(date);
    const [year, month] = date.split('-').map(Number);
    setVisibleMonth(new Date(year, (month ?? 1) - 1, 1));
  }

  function clearValue() {
    setSelectedDate('');
    setSelectedTime('');
  }

  return (
    <div className="auth-form__field">
      <span>{label}</span>

      <div ref={containerRef} className="date-time-picker">
        <input type="hidden" name={name} value={hiddenValue} required={required} />

        <button
          id={fieldId}
          type="button"
          className={`date-time-picker__trigger ${isOpen ? 'date-time-picker__trigger--active' : ''}`.trim()}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={`${fieldId}-popover`}
          onClick={() => setIsOpen((current) => !current)}
        >
          <span
            className={`date-time-picker__trigger-text ${preview ? '' : 'date-time-picker__trigger-text--placeholder'}`.trim()}
          >
            {preview || 'Seleccionar fecha'}
          </span>
          <span className="date-time-picker__trigger-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M8 3.5v3M16 3.5v3M4.5 9h15"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <rect
                x="4.5"
                y="5.5"
                width="15"
                height="14"
                rx="3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          </span>
        </button>

        {isOpen ? (
          <div
            id={`${fieldId}-popover`}
            className="date-time-picker__popover"
            role="dialog"
            aria-modal="false"
            aria-labelledby={`${fieldId}-title`}
          >
            <div className="date-time-picker__shell">
              <div className="date-time-picker__header">
                <div>
                  <p className="date-time-picker__eyebrow">Calendario</p>
                  <p id={`${fieldId}-title`} className="date-time-picker__month">
                    {monthLabel}
                  </p>
                </div>

                <div className="date-time-picker__month-actions">
                  <button
                    type="button"
                    className="date-time-picker__nav"
                    onClick={() => changeMonth(-1)}
                    aria-label="Mes anterior"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="m14.5 6.5-5 5 5 5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="date-time-picker__nav"
                    onClick={() => changeMonth(1)}
                    aria-label="Mes siguiente"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="m9.5 6.5 5 5-5 5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="date-time-picker__weekdays">
                {WEEKDAY_LABELS.map((weekday) => (
                  <span key={weekday}>{weekday}</span>
                ))}
              </div>

              <div className="date-time-picker__grid">
                {calendarDays.map((day) => {
                  const isSelected = day.isoDate === selectedDate;
                  const isDisabled =
                    disablePastDates && isDateBeforeToday(day.isoDate);

                  return (
                    <button
                      key={day.key}
                      type="button"
                      className={`date-time-picker__day ${day.isCurrentMonth ? '' : 'date-time-picker__day--outside'} ${day.isToday ? 'date-time-picker__day--today' : ''} ${isSelected ? 'date-time-picker__day--selected' : ''} ${isDisabled ? 'date-time-picker__day--disabled' : ''}`.trim()}
                      onClick={() => handleDaySelect(day.isoDate)}
                      aria-pressed={isSelected}
                      disabled={isDisabled}
                    >
                      {day.dayNumber}
                    </button>
                  );
                })}
              </div>

              <div className="date-time-picker__time-panel">
                <div>
                  <p className="date-time-picker__eyebrow">Horario</p>
                  <p className="date-time-picker__time-copy">
                    {selectedDate
                      ? `Saltos de ${minuteStep} minutos`
                      : 'Elegí primero una fecha'}
                  </p>
                </div>

                <TimeStepper
                  selectedTime={selectedTime}
                  availableTimes={availableTimes}
                  minuteStep={minuteStep}
                  onChange={setSelectedTime}
                />
              </div>

              <div className="date-time-picker__footer">
                {allowClear ? (
                  <button
                    type="button"
                    className="date-time-picker__clear"
                    onClick={clearValue}
                  >
                    Limpiar
                  </button>
                ) : <span />}

                <button
                  type="button"
                  className="date-time-picker__apply"
                  onClick={() => setIsOpen(false)}
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
