import { argentinaDay } from '../today/agenda';

export function quickDateRange(
  preset: 'today' | 'tomorrow' | 'seven_days' | 'thirty_days',
  now = new Date(),
) {
  const today = argentinaDay(now);
  const date = new Date(`${today}T12:00:00Z`);
  const day = (value: Date) => value.toISOString().slice(0, 10);
  if (preset === 'tomorrow') date.setUTCDate(date.getUTCDate() + 1);
  const from = day(date);
  if (preset === 'seven_days') date.setUTCDate(date.getUTCDate() + 6);
  if (preset === 'thirty_days') date.setUTCDate(date.getUTCDate() + 29);
  return { date_from: from, date_to: day(date) };
}
