/** Purpose/counterparty keywords that rarely fit retail or small-business profiles (R5). */
export const PURPOSE_KEYWORDS = [
  'consulting',
  'advisory',
  'loan',
  'crypto',
  'exchange',
  'übertrag',
  'deposit account',
] as const;

/** Mitigating evidence patterns used by triage. */
export const SALARY_PATTERN = /\b(lohn|bonus|salär|salaer)\b/i;
export const CONTRACT_PATTERN = /(kaufvertrag|rechnung|vertrag)/i;

export function matchKeywords(text: string, keywords: readonly string[]): string[] {
  const haystack = text.toLowerCase();
  return keywords.filter((k) => haystack.includes(k.toLowerCase()));
}
