import { DomainError } from './errors';
import type { Rappen } from './types';

export const AMOUNT_REGEX = /^\d{1,13}(\.\d{1,2})?$/;

/** Parses a decimal amount string ("14800.5") into integer Rappen without floating point. */
export function parseAmountToRappen(text: string): Rappen {
  const trimmed = text.trim();
  if (!AMOUNT_REGEX.test(trimmed)) {
    throw new DomainError('VALIDATION_ERROR', `Invalid amount "${text}"`);
  }
  const [intPart = '0', fracPart = ''] = trimmed.split('.');
  return Number(intPart) * 100 + Number(fracPart.padEnd(2, '0'));
}

/** Converts whole francs (e.g. CSV values like "5200") to Rappen. */
export function chf(francs: number): Rappen {
  return Math.round(francs * 100);
}

export function toFrancs(rappen: Rappen): number {
  return rappen / 100;
}

const currencyFormat = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' });
const compactFormat = new Intl.NumberFormat('de-CH', {
  style: 'currency',
  currency: 'CHF',
  maximumFractionDigits: 0,
});

export function formatChf(rappen: Rappen): string {
  return currencyFormat.format(rappen / 100);
}

/** CHF without decimals, e.g. "CHF 250’000". */
export function formatChfRounded(rappen: Rappen): string {
  return compactFormat.format(Math.round(rappen / 100));
}
