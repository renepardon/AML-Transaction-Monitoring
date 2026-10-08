/** FNV-1a 32-bit. Deterministic, synchronous, good enough for stable UI ids (not for security). */
function fnv1a(input: string, seed = 0x811c9dc5): number {
  let hash = seed;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** 64-bit-ish stable hash as 16 hex chars. */
export function stableHash(input: string): string {
  const a = fnv1a(input).toString(16).padStart(8, '0');
  const b = fnv1a(input, 0x01000193 ^ 0x9e3779b9)
    .toString(16)
    .padStart(8, '0');
  return a + b;
}

export function alertIdFor(ruleId: string, clientId: string, evidenceTxIds: string[]): string {
  return `AL-${stableHash([ruleId, clientId, ...[...evidenceTxIds].sort()].join('|')).slice(0, 10)}`;
}

export function caseIdFor(clientId: string): string {
  return `CASE-${clientId}`;
}

/** Deterministic pseudo-random number in [0, 1) derived from a string seed. */
export function seededUnit(seed: string): number {
  return fnv1a(seed) / 0x1_0000_0000;
}
