import { countSentences, enforceSentenceLimit, splitSentences } from './sentences';

describe('sentences', () => {
  it('counts sentences without splitting decimals, multiples or quotes', () => {
    expect(
      countSentences('Paid out 98.6 % of it two days later. It reached 6.4× the expected volume.'),
    ).toBe(2);
    expect(countSentences('The purpose "Übertrag". Then "Loan" followed! Why?')).toBe(3);
    expect(countSentences('One sentence without a final stop')).toBe(1);
  });

  it('splits into trimmed sentences', () => {
    expect(splitSentences('A b. C d.  E f.')).toEqual(['A b.', 'C d.', 'E f.']);
  });

  it('enforces 2–3 sentences', () => {
    expect(countSentences(enforceSentenceLimit('A. B. C. D.'))).toBe(3);
    expect(countSentences(enforceSentenceLimit('Only one.'))).toBe(2);
    expect(enforceSentenceLimit('A. B.')).toBe('A. B.');
  });
});
