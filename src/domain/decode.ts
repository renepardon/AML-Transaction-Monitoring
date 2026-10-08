import { DomainError } from './errors';

/** Strict UTF-8 decoding. Invalid byte sequences are rejected, a leading BOM is stripped. */
export function decodeUtf8(bytes: Uint8Array): string {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new DomainError('FILE_REJECTED', 'File is not valid UTF-8');
  }
  return stripBom(text);
}

export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}
