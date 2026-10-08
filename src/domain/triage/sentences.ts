// A sentence ends with . ! or ? (optionally followed by a closing quote/bracket), then whitespace
// and an uppercase letter or opening quote, or the end of the text. Decimals ("98.6 %") don't count.
const SENTENCE_END = /[.!?]["'”’)]*(?=\s+["'„“(]?[A-ZÄÖÜ]|\s*$)/g;

export function splitSentences(text: string): string[] {
  const out: string[] = [];
  let start = 0;
  for (const m of text.matchAll(SENTENCE_END)) {
    const end = (m.index ?? 0) + m[0].length;
    out.push(text.slice(start, end).trim());
    start = end;
  }
  const rest = text.slice(start).trim();
  if (rest) out.push(rest);
  return out.filter(Boolean);
}

export function countSentences(text: string): number {
  return splitSentences(text).length;
}

/** Guarantees 2–3 sentences: trims extra sentences, pads a single one with a neutral closer. */
export function enforceSentenceLimit(
  text: string,
  filler = 'The decision stays with the analyst.',
): string {
  const sentences = splitSentences(text);
  if (sentences.length > 3) return sentences.slice(0, 3).join(' ');
  if (sentences.length < 2) return [...sentences, filler].join(' ');
  return sentences.join(' ');
}
