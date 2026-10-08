export type DomainErrorCode =
  | 'REASON_REQUIRED'
  | 'ALREADY_DECIDED'
  | 'INVALID_STATE'
  | 'FOUR_EYES'
  | 'NOT_FOUND'
  | 'FILE_REJECTED'
  | 'PARSE_ERROR'
  | 'VALIDATION_ERROR';

/** Typed error for violated domain invariants. Shown to the user via a toast. */
export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}

export function isDomainError(e: unknown): e is DomainError {
  return e instanceof DomainError;
}
