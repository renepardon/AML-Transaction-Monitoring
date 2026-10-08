import {
  formatAge,
  formatBytes,
  formatDate,
  formatMultiple,
  formatPercent,
  shortHash,
} from './format';

describe('format', () => {
  it('formats sizes, percents, hashes and dates', () => {
    expect(formatBytes(67083)).toBe('65.5 KB');
    expect(formatPercent(0.986)).toBe('98.6 %');
    expect(formatMultiple(6.43)).toBe('6.4×');
    expect(shortHash('abcdef0123456789')).toBe('abcdef0123');
    expect(formatDate('2026-07-14')).toBe('14.07.2026');
  });

  it('formats relative ages', () => {
    const now = new Date('2026-10-06T12:00:00Z');
    expect(formatAge('2026-10-06T11:58:00Z', now)).toBe('2 min ago');
    expect(formatAge('2026-10-06T09:00:00Z', now)).toBe('3 h ago');
    expect(formatAge('2026-10-03T12:00:00Z', now)).toBe('3 d ago');
  });
});
