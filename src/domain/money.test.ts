import { chf, formatChf, formatChfRounded, parseAmountToRappen } from './money';

describe('money', () => {
  it('parses decimal strings into integer Rappen without floating point', () => {
    expect(parseAmountToRappen('14800.00')).toBe(1_480_000);
    expect(parseAmountToRappen('53.12')).toBe(5_312);
    expect(parseAmountToRappen('0.1')).toBe(10);
    expect(parseAmountToRappen('14999.99')).toBe(1_499_999);
    expect(parseAmountToRappen('9999999999999.99')).toBe(999_999_999_999_999);
  });

  it('rejects malformed amounts', () => {
    for (const bad of ['', '1,000.00', '-5.00', '1.234', '1e5', 'abc', '12345678901234']) {
      expect(() => parseAmountToRappen(bad)).toThrow(/Invalid amount/);
    }
  });

  it('converts francs and formats CHF in de-CH', () => {
    expect(chf(5200)).toBe(520_000);
    expect(formatChf(25_000_000)).toMatch(/CHF\s250.000\.00/);
    expect(formatChfRounded(24_650_000)).toMatch(/CHF\s246.500$/);
  });
});
