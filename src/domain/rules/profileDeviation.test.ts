import { buildClient, buildTx } from '@/test/builders';
import { ruleContext } from '@/test/ruleContext';
import { profileDeviation } from './profileDeviation';

const client = buildClient({ expectedMonthlyInflow: 980_000, expectedMonthlyOutflow: 820_000 });

describe('R3 profile deviation', () => {
  it('flags a month with outflow > 3× expected and excess ≥ CHF 10’000', () => {
    const hits = profileDeviation(
      ruleContext(
        [buildTx({ amount: 4_200_000, direction: 'DBIT', bookingDate: '2026-09-04' })],
        client,
      ),
    );
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({
      severity: 'medium',
      metrics: { month: '2026-09', direction: 'outflow' },
    });
  });

  it('is high above 6×', () => {
    const hits = profileDeviation(
      ruleContext(
        [buildTx({ amount: 6_000_000, direction: 'CRDT', bookingDate: '2026-08-04' })],
        client,
      ),
    );
    expect(hits[0]?.severity).toBe('high');
  });

  it('needs both the multiple and the absolute excess', () => {
    const tiny = buildClient({ expectedMonthlyInflow: 100_000, expectedMonthlyOutflow: 100_000 });
    expect(
      profileDeviation(
        ruleContext([buildTx({ amount: 900_000, bookingDate: '2026-08-04' })], tiny),
      ),
    ).toEqual([]);
    expect(
      profileDeviation(
        ruleContext([buildTx({ amount: 2_940_000, bookingDate: '2026-08-04' })], client),
      ),
    ).toEqual([]);
  });
});
