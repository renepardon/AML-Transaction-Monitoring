import { DEFAULT_RULE_CONFIG } from '@/domain/rules/defaultConfig';
import { useRuleConfigStore } from './useRuleConfigStore';

describe('useRuleConfigStore', () => {
  beforeEach(() => useRuleConfigStore.getState().resetDefaults());

  it('patches one rule section without touching others', () => {
    useRuleConfigStore.getState().updateRule('structuring', { minCount: 4 });
    const { config } = useRuleConfigStore.getState();
    expect(config.structuring.minCount).toBe(4);
    expect(config.structuring.thresholdChf).toBe(15_000);
    expect(config.passThrough).toEqual(DEFAULT_RULE_CONFIG.passThrough);
  });

  it('clamps the case threshold and toggles rules', () => {
    useRuleConfigStore.getState().setCaseScoreThreshold(9);
    useRuleConfigStore.getState().setEnabled('R4_RISK_COUNTRY', false);
    expect(useRuleConfigStore.getState().config.caseScoreThreshold).toBe(5);
    expect(useRuleConfigStore.getState().enabledRules.R4_RISK_COUNTRY).toBe(false);
  });
});
