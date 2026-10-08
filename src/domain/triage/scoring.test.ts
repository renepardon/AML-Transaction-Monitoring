import { buildClient } from '@/test/builders';
import type { RuleHit } from '../rules/types';
import { scoreAlert } from './scoring';

const h = (
  ruleId: RuleHit['ruleId'],
  severity: RuleHit['severity'],
  metrics: RuleHit['metrics'] = {},
): RuleHit => ({
  ruleId,
  clientId: 'C9999',
  severity,
  title: '',
  summary: '',
  evidenceTxIds: [],
  metrics,
  period: { from: '2026-09-01', to: '2026-09-01' },
});

describe('scoring', () => {
  it('Sara Huber-like: medium R3 with strong mitigation scores ≤ 2', () => {
    const r3 = h('R3_PROFILE_DEVIATION', 'medium', { maxRatio: 5.1 });
    const result = scoreAlert(
      r3,
      buildClient(),
      [r3],
      [
        { code: 'domestic_contract', strength: 'strong', text: '' },
        { code: 'one_off_below_income', strength: 'supporting', text: '' },
        { code: 'countries_expected', strength: 'supporting', text: '' },
      ],
    );
    expect(result.score).toBeLessThanOrEqual(2);
  });

  it('pass-through to a risk-tier country scores ≥ 4', () => {
    const r2 = h('R2_PASS_THROUGH', 'high', { outCountries: 'AE' });
    expect(scoreAlert(r2, buildClient(), [r2], []).score).toBeGreaterThanOrEqual(4);
  });

  it('adds +1 for ≥ 3 rules and +1 for elevated risk, and clamps to 5', () => {
    const hits = [
      h('R1_STRUCTURING', 'high'),
      h('R3_PROFILE_DEVIATION', 'high', { maxRatio: 6.4 }),
      h('R4_RISK_COUNTRY', 'medium'),
    ];
    const elevated = buildClient({ riskCategory: 'elevated', riskCategoryLabel: 'erhöht' });
    const r1 = scoreAlert(hits[0]!, elevated, hits, []);
    expect(r1).toMatchObject({ base: 3, score: 5 });
    expect(r1.factors.map((f) => f.delta)).toEqual([1, 1]);
    expect(scoreAlert(hits[2]!, elevated, hits, []).score).toBe(4);
  });

  it('adds +1 for deviation > 10× on a normal-risk client', () => {
    const r3 = h('R3_PROFILE_DEVIATION', 'high', { maxRatio: 35.6 });
    expect(scoreAlert(r3, buildClient(), [r3], []).score).toBe(4);
  });
});
