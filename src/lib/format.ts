import { formatChf, formatChfRounded } from '@/domain/money';
import { formatDay, formatMonth } from '@/domain/dates';
import { formatIban, maskIban } from '@/domain/iban';

export { formatChf, formatChfRounded, formatDay, formatMonth, formatIban, maskIban };

const dateTime = new Intl.DateTimeFormat('de-CH', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

const dateOnly = new Intl.DateTimeFormat('de-CH', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatDate(isoDate: string): string {
  return dateOnly.format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function shortHash(hash: string, length = 10): string {
  return hash.slice(0, length);
}

export function formatPercent(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)} %`;
}

export function formatMultiple(ratio: number): string {
  return `${ratio.toFixed(1)}×`;
}

/** "3 min ago", "2 h ago", "4 d ago" relative to `now`. */
export function formatAge(iso: string, now: Date = new Date()): string {
  const minutes = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}
