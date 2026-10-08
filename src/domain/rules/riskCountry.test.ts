import { buildClient, buildTx } from '@/test/builders';
import { ruleContext } from '@/test/ruleContext';
import { riskCountry } from './riskCountry';

const tx = (country: string, amount: number) =>
  buildTx({ amount, direction: 'DBIT', counterparty: { name: 'X Ltd', country, iban: null } });

describe('R4 risk country', () => {
  it('flags internal-list countries as medium and FATF lists as high', () => {
    expect(riskCountry(ruleContext([tx('AE', 10_000)]))[0]?.severity).toBe('medium');
    expect(riskCountry(ruleContext([tx('IR', 10_000)]))[0]?.severity).toBe('high');
    expect(riskCountry(ruleContext([tx('VE', 10_000)]))[0]?.metrics.tier).toBe('fatf_greylist');
  });

  it('flags an unexpected standard country only from CHF 10’000', () => {
    expect(riskCountry(ruleContext([tx('GB', 999_999)]))).toEqual([]);
    expect(riskCountry(ruleContext([tx('GB', 1_000_000)]))[0]?.metrics.unexpected).toBe('yes');
  });

  it('merges both signals into one hit per transaction and ignores expected countries', () => {
    const hits = riskCountry(ruleContext([tx('EE', 9_500_000)]));
    expect(hits).toHaveLength(1);
    expect(hits[0]?.summary).toMatch(/Internal risk list.*not in expected/);
    const de = buildClient({ expectedCountries: ['CH', 'DE'] });
    expect(riskCountry(ruleContext([tx('DE', 9_000_000)], de))).toEqual([]);
  });
});
