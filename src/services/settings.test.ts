import { runSamplePipeline } from '@/test/pipelineFixture';
import { useAlertStore } from '@/stores/useAlertStore';
import { useCaseStore } from '@/stores/useCaseStore';
import { dismissAlert } from './decisions';
import {
  changeCaseScoreThreshold,
  changeRuleThreshold,
  rerunDetection,
  toggleRule,
} from './settings';

describe('settings services', () => {
  beforeEach(runSamplePipeline);

  it('re-running after a config change keeps decisions for unchanged alerts', async () => {
    const sara = Object.values(useAlertStore.getState().alerts).find(
      (a) => a.hit.clientId === 'C1006',
    )!;
    await dismissAlert(sara.id, 'car purchase with signed contract');
    await toggleRule('R4_RISK_COUNTRY', false);
    await rerunDetection();
    const alerts = useAlertStore.getState().alerts;
    expect(alerts[sara.id]?.dismissal?.reason).toBe('car purchase with signed contract');
    // R4 alerts stay because cases reference them; no new R4 alerts are raised.
    expect(Object.values(alerts).filter((a) => a.hit.ruleId === 'R4_RISK_COUNTRY')).toHaveLength(8);
  });

  it('a stricter structuring rule drops the unreferenced alert on re-run', async () => {
    await changeRuleThreshold('profileDeviation', 'multiple', 6);
    await rerunDetection();
    expect(
      Object.values(useAlertStore.getState().alerts).some(
        (a) => a.hit.clientId === 'C1006' && !a.dismissal,
      ),
    ).toBe(false);
  });

  it('a lower case threshold opens a case for C1006 on re-run', async () => {
    await changeCaseScoreThreshold(1);
    await rerunDetection();
    expect(useCaseStore.getState().cases['CASE-C1006']).toBeDefined();
  });

  it('rejects negative thresholds', async () => {
    await expect(changeRuleThreshold('structuring', 'minCount', -1)).rejects.toThrow(
      /non-negative/,
    );
  });
});
