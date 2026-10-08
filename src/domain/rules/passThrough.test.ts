import { buildClient, buildTx } from '@/test/builders';
import { ruleContext } from '@/test/ruleContext';
import { passThrough } from './passThrough';

const credit = (amount: number, date = '2026-07-14') =>
  buildTx({
    amount,
    bookingDate: date,
    direction: 'CRDT',
    counterparty: { name: 'Eastgate', country: 'HK', iban: null },
  });
const debit = (amount: number, date: string) =>
  buildTx({
    amount,
    bookingDate: date,
    direction: 'DBIT',
    counterparty: { name: 'Meridian', country: 'AE', iban: null },
  });

describe('R2 pass-through', () => {
  it('detects a credit paid out ≥ 80 % within 10 days, using the largest debits', () => {
    const hits = passThrough(
      ruleContext([
        credit(25_000_000),
        debit(772_728, '2026-07-16'),
        debit(24_650_000, '2026-07-16'),
      ]),
    );
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({
      severity: 'high',
      metrics: { ratio: 0.986, daysBetween: 2, outCountries: 'AE', inCountry: 'HK' },
    });
    expect(hits[0]?.evidenceTxIds).toHaveLength(2);
  });

  it('is medium when ratio < 95 % and days > 3', () => {
    const hits = passThrough(ruleContext([credit(10_000_000), debit(8_500_000, '2026-07-20')]));
    expect(hits[0]?.severity).toBe('medium');
  });

  it('ignores outflows after the window or below 80 %', () => {
    expect(passThrough(ruleContext([credit(10_000_000), debit(9_000_000, '2026-07-25')]))).toEqual(
      [],
    );
    expect(passThrough(ruleContext([credit(10_000_000), debit(7_900_000, '2026-07-15')]))).toEqual(
      [],
    );
  });

  it('requires credit ≥ max(CHF 50’000, 2× expected inflow)', () => {
    const big = buildClient({ expectedMonthlyInflow: 4_000_000 });
    expect(
      passThrough(ruleContext([credit(7_000_000), debit(7_000_000, '2026-07-15')], big)),
    ).toEqual([]);
    expect(passThrough(ruleContext([credit(4_999_999), debit(4_999_999, '2026-07-15')]))).toEqual(
      [],
    );
    expect(
      passThrough(ruleContext([credit(5_000_000), debit(5_000_000, '2026-07-15')])),
    ).toHaveLength(1);
  });
});
