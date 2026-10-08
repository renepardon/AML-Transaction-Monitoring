import { buildClient, buildTx } from '@/test/builders';
import { ruleContext } from '@/test/ruleContext';
import { purposeMismatch } from './purposeMismatch';

describe('R5 purpose mismatch', () => {
  it('matches keywords in purpose or counterparty from CHF 10’000', () => {
    const hits = purposeMismatch(
      ruleContext([buildTx({ amount: 25_000_000, remittance: 'Consulting fee' })]),
    );
    expect(hits[0]).toMatchObject({ severity: 'medium', metrics: { keywords: 'consulting' } });
    expect(
      purposeMismatch(ruleContext([buildTx({ amount: 999_999, remittance: 'Loan' })])),
    ).toEqual([]);
  });

  it('detects own-account transfers abroad', () => {
    const client = buildClient({ name: 'Viktor Schaller' });
    const hits = purposeMismatch(
      ruleContext(
        [
          buildTx({
            amount: 12_000_000,
            direction: 'DBIT',
            remittance: 'Transfer',
            counterparty: { name: 'Viktor  Schaller', country: 'LI', iban: null },
          }),
        ],
        client,
      ),
    );
    expect(hits[0]?.metrics.ownAccountAbroad).toBe('yes');
  });

  it('ignores ordinary purposes and domestic own transfers', () => {
    const client = buildClient({ name: 'Lukas Frei' });
    expect(
      purposeMismatch(
        ruleContext(
          [
            buildTx({ amount: 3_800_000, remittance: 'Kaufvertrag Toyota Corolla' }),
            buildTx({
              amount: 3_800_000,
              counterparty: { name: 'Lukas Frei', country: 'CH', iban: null },
            }),
          ],
          client,
        ),
      ),
    ).toEqual([]);
  });
});
