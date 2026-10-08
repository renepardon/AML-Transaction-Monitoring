import { formatMetric, metricLabel } from './metrics';

describe('metrics formatting', () => {
  it('formats money, ratios, tiers and months', () => {
    expect(formatMetric('sum', 13_180_000)).toMatch(/CHF\s131.800/);
    expect(formatMetric('ratio', 0.986)).toBe('98.6 %');
    expect(formatMetric('maxRatio', 6.43)).toBe('6.4×');
    expect(formatMetric('tier', 'internal_elevated')).toBe('Internal risk list – demo policy');
    expect(formatMetric('month', '2026-08')).toBe('Aug 2026');
    expect(metricLabel('daysBetween')).toBe('Days in → out');
  });
});
