import { SEED_ANALYSTS } from '@/domain/actors';
import type { RuleHit } from '@/domain/rules/types';
import { useAlertStore } from './useAlertStore';

const hit = (clientId: string): RuleHit => ({
  ruleId: 'R3_PROFILE_DEVIATION',
  clientId,
  severity: 'medium',
  title: 't',
  summary: 's',
  evidenceTxIds: [],
  metrics: {},
  period: { from: '2026-09-01', to: '2026-09-30' },
});
const actor = SEED_ANALYSTS[0]!;

describe('useAlertStore', () => {
  beforeEach(() => useAlertStore.getState().resetAlerts());

  it('adds new alerts as pending and keeps triage of existing ones on re-run', () => {
    expect(useAlertStore.getState().setAlerts([{ id: 'A', hit: hit('C1') }]).added).toEqual(['A']);
    useAlertStore.getState().setTriage('A', { status: 'running' });
    const second = useAlertStore.getState().setAlerts([
      { id: 'A', hit: hit('C1') },
      { id: 'B', hit: hit('C2') },
    ]);
    expect(second.added).toEqual(['B']);
    expect(useAlertStore.getState().alerts.A?.triageStatus).toBe('pending');
  });

  it('drops alerts no longer raised unless dismissed or kept', () => {
    useAlertStore.getState().setAlerts([
      { id: 'A', hit: hit('C1') },
      { id: 'B', hit: hit('C2') },
      { id: 'C', hit: hit('C3') },
    ]);
    useAlertStore.getState().dismissAlert('A', 'explained by the profile', actor);
    const result = useAlertStore.getState().setAlerts([], ['B']);
    expect(result.removed).toEqual(['C']);
    expect(Object.keys(useAlertStore.getState().alerts).sort()).toEqual(['A', 'B']);
  });

  it('requires a reason to dismiss and cannot dismiss twice', () => {
    useAlertStore.getState().setAlerts([{ id: 'A', hit: hit('C1') }]);
    expect(() => useAlertStore.getState().dismissAlert('A', 'too short', actor)).toThrow(
      /at least 10/,
    );
    useAlertStore.getState().dismissAlert('A', '  car purchase with contract  ', actor);
    expect(useAlertStore.getState().alerts.A?.dismissal?.reason).toBe('car purchase with contract');
    expect(() => useAlertStore.getState().dismissAlert('A', 'another valid reason', actor)).toThrow(
      /already/,
    );
  });
});
