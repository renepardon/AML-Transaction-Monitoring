import { DomainError } from './errors';

export const MIN_REASON_LENGTH = 10;

/** Every compliance decision needs a reason: trimmed, at least 10 characters. */
export function validateReason(reason: string): string {
  const trimmed = reason.trim();
  if (trimmed.length < MIN_REASON_LENGTH) {
    throw new DomainError(
      'REASON_REQUIRED',
      `A reason of at least ${MIN_REASON_LENGTH} characters is required`,
    );
  }
  return trimmed;
}

export function isValidReason(reason: string): boolean {
  return reason.trim().length >= MIN_REASON_LENGTH;
}
