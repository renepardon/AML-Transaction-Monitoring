import { addDays, daysBetween, formatMonth, isIsoDate, monthKey } from './dates';

describe('dates', () => {
  it('computes whole days across month ends', () => {
    expect(daysBetween('2026-07-14', '2026-07-16')).toBe(2);
    expect(daysBetween('2026-08-29', '2026-09-02')).toBe(4);
    expect(addDays('2026-08-29', 10)).toBe('2026-09-08');
  });

  it('validates ISO dates and month keys', () => {
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('2026-09-30')).toBe(true);
    expect(monthKey('2026-07-14')).toBe('2026-07');
    expect(formatMonth('2026-07')).toBe('Jul 2026');
  });
});
