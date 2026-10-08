import { buildCashDeposit } from '@/test/builders';
import { ruleContext } from '@/test/ruleContext';
import { structuring } from './structuring';

describe('R1 structuring', () => {
  it('raises one hit for ≥ 3 deposits in the band within 30 days', () => {
    const hits = structuring(
      ruleContext([
        buildCashDeposit(1_480_000, '2026-08-03'),
        buildCashDeposit(1_450_000, '2026-08-06'),
        buildCashDeposit(1_490_000, '2026-08-20'),
      ]),
    );
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ severity: 'medium', metrics: { count: 3, sum: 4_420_000 } });
  });

  it('is high with ≥ 5 deposits', () => {
    const deposits = [3, 6, 9, 12, 16].map((d) =>
      buildCashDeposit(1_450_000, `2026-08-${String(d).padStart(2, '0')}`),
    );
    expect(structuring(ruleContext(deposits))[0]?.severity).toBe('high');
  });

  it('ignores deposits spread over more than 30 days or below the band', () => {
    expect(
      structuring(
        ruleContext([
          buildCashDeposit(1_480_000, '2026-07-01'),
          buildCashDeposit(1_480_000, '2026-07-20'),
          buildCashDeposit(1_480_000, '2026-08-05'),
        ]),
      ),
    ).toEqual([]);
    const small = [1, 2, 3, 4].map((d) => buildCashDeposit(510_000, `2026-08-0${d}`));
    expect(structuring(ruleContext(small))).toEqual([]);
  });

  it('edge: 14’999.99 hits, 15’000.00 does not', () => {
    const at = (amount: number) =>
      structuring(ruleContext([1, 2, 3].map((d) => buildCashDeposit(amount, `2026-08-0${d}`))));
    expect(at(1_499_999)).toHaveLength(1);
    expect(at(1_500_000)).toHaveLength(0);
    expect(at(1_200_000)).toHaveLength(1);
    expect(at(1_199_999)).toHaveLength(0);
  });
});
