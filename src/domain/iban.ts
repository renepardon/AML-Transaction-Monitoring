export function normalizeIban(iban: string): string {
  return iban.replace(/\s+/g, '').toUpperCase();
}

/** ISO 13616 mod-97 check. */
export function isValidIban(raw: string): boolean {
  const iban = normalizeIban(raw);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const digits = /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch;
    for (const d of digits) {
      remainder = (remainder * 10 + Number(d)) % 97;
    }
  }
  return remainder === 1;
}

/** "CH3208146000100100001" → "CH32 •••• 0001" */
export function maskIban(raw: string): string {
  const iban = normalizeIban(raw);
  if (iban.length < 8) return iban;
  return `${iban.slice(0, 4)} •••• ${iban.slice(-4)}`;
}

/** Groups an IBAN in blocks of four for display. */
export function formatIban(raw: string): string {
  return normalizeIban(raw)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}
