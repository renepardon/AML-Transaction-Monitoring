import { buildClient, buildTx } from '@/test/builders';
import type { RuleHit } from '../rules/types';
import { detectMitigations, mitigationDeduction } from './mitigation';

const sara = buildClient({
  clientId: 'C9999',
  name: 'Sara Test',
  expectedMonthlyInflow: 980_000,
  expectedCountries: ['CH'],
});
const salary = buildTx({
  amount: 985_000,
  bookingDate: '2026-08-25',
  remittance: 'Lohn',
  counterparty: { name: 'Versicherung AG', country: 'CH', iban: null },
});
const bonus = buildTx({
  amount: 1_850_000,
  bookingDate: '2026-08-28',
  remittance: 'Bonus 2025/26',
  counterparty: { name: 'Versicherung AG', country: 'CH', iban: null },
});
const car = buildTx({
  amount: 3_800_000,
  direction: 'DBIT',
  bookingDate: '2026-09-04',
  remittance: 'Kaufvertrag 118, Toyota',
  counterparty: { name: 'Garage AG', country: 'CH', iban: null },
});
const hit = (ids: string[]): RuleHit => ({
  ruleId: 'R3_PROFILE_DEVIATION',
  clientId: 'C9999',
  severity: 'medium',
  title: '',
  summary: '',
  evidenceTxIds: ids,
  metrics: {},
  period: { from: '2026-09-01', to: '2026-09-30' },
});

describe('mitigation detectors', () => {
  it('finds contract reference, bonus, one-off and expected countries for a Sara-like case', () => {
    const facts = detectMitigations(hit([car.id]), sara, [salary, bonus, car]);
    expect(facts.map((f) => f.code).sort()).toEqual([
      'countries_expected',
      'domestic_contract',
      'one_off_below_income',
      'salary_remittance',
    ]);
    expect(mitigationDeduction(facts)).toBe(2);
  });

  it('recognises the known salary payer', () => {
    const fromPayer = buildTx({
      amount: 1_500_000,
      bookingDate: '2026-09-02',
      remittance: 'Spesen',
      counterparty: { name: 'Versicherung AG', country: 'CH', iban: null },
    });
    expect(
      detectMitigations(hit([fromPayer.id]), sara, [salary, fromPayer]).map((f) => f.code),
    ).toContain('salary_payer');
  });

  it('does not deduct for supporting facts alone or for foreign counterparties', () => {
    const foreign = buildTx({
      amount: 3_800_000,
      direction: 'DBIT',
      bookingDate: '2026-09-04',
      remittance: 'Kaufvertrag',
      counterparty: { name: 'X', country: 'DE', iban: null },
    });
    const facts = detectMitigations(hit([foreign.id]), sara, [foreign]);
    expect(facts.map((f) => f.code)).not.toContain('domestic_contract');
    expect(mitigationDeduction(facts)).toBe(0);
    expect(
      mitigationDeduction([{ code: 'countries_expected', strength: 'supporting', text: '' }]),
    ).toBe(0);
  });
});
