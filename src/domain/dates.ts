const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function toUtcDay(isoDate: string): number {
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) / 86_400_000;
}

/** Whole days from `a` to `b` (positive if b is later). */
export function daysBetween(a: string, b: string): number {
  return toUtcDay(b) - toUtcDay(a);
}

export function addDays(isoDate: string, days: number): string {
  const ms = (toUtcDay(isoDate) + days) * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** "2026-07-14" → "2026-07" */
export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

const monthFormat = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const dayFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

/** "2026-07" → "Jul 2026" */
export function formatMonth(month: string): string {
  return monthFormat.format(new Date(`${month}-01T00:00:00Z`));
}

/** "2026-07-14" → "14 Jul" */
export function formatDay(isoDate: string): string {
  return dayFormat.format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`));
}

const longMonthFormat = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "2026-09-04" or "2026-09" → "September 2026" */
export function formatMonthLong(isoDateOrMonth: string): string {
  return longMonthFormat.format(new Date(`${isoDateOrMonth.slice(0, 7)}-01T00:00:00Z`));
}
