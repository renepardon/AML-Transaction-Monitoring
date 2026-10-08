import { chunkText } from './mockReportDrafter';

describe('chunkText', () => {
  it('splits at word boundaries and preserves the text', () => {
    const text = 'Nordstern Trading received CHF 250’000 from a Hong Kong company.';
    const chunks = chunkText(text, 12);
    expect(chunks.join('')).toBe(text);
    expect(chunks.length).toBeGreaterThan(3);
  });
});
