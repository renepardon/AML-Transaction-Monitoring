import { DEFAULT_ENABLED_RULES, DEFAULT_RULE_CONFIG } from '@/domain/rules/defaultConfig';
import { runRules } from '@/domain/rules/runRules';
import type { RuleHit } from '@/domain/rules/types';
import { buildDataset, sampleSourceInputs } from './ingest';

/** Ground truth from the implementation plan §3. If this fails, fix the rules, not the test. */
describe('acceptance: detection on the bundled files', () => {
  let hits: RuleHit[] = [];
  const rulesOf = (clientId: string) =>
    new Set(hits.filter((h) => h.clientId === clientId).map((h) => h.ruleId));
  const hitsOf = (clientId: string, ruleId: RuleHit['ruleId']) =>
    hits.filter((h) => h.clientId === clientId && h.ruleId === ruleId);

  beforeAll(async () => {
    const ds = await buildDataset(sampleSourceInputs());
    hits = runRules(ds.clients, ds.transactions, DEFAULT_RULE_CONFIG, DEFAULT_ENABLED_RULES);
  });

  it('C1002 Viktor Schaller: R1 (high), R3, R4, R5', () => {
    expect(rulesOf('C1002')).toEqual(
      new Set(['R1_STRUCTURING', 'R3_PROFILE_DEVIATION', 'R4_RISK_COUNTRY', 'R5_PURPOSE_MISMATCH']),
    );
    const [r1] = hitsOf('C1002', 'R1_STRUCTURING');
    expect(r1).toMatchObject({ severity: 'high', metrics: { count: 9, sum: 13_180_000 } });
    expect(hitsOf('C1002', 'R4_RISK_COUNTRY')[0]?.metrics.country).toBe('LI');
  });

  it('C1003 Nordstern Trading: R2 (high ×2), R3, R4, R5', () => {
    expect(rulesOf('C1003')).toEqual(
      new Set([
        'R2_PASS_THROUGH',
        'R3_PROFILE_DEVIATION',
        'R4_RISK_COUNTRY',
        'R5_PURPOSE_MISMATCH',
      ]),
    );
    const r2 = hitsOf('C1003', 'R2_PASS_THROUGH');
    expect(r2.map((h) => h.severity)).toEqual(['high', 'high']);
    expect(r2.map((h) => h.metrics.ratio)).toEqual([0.986, 0.99]);
  });

  it('C1001 Elsa Brunner: R2, R3, R4, R5 with inflow ~35× expected', () => {
    expect(rulesOf('C1001')).toEqual(
      new Set([
        'R2_PASS_THROUGH',
        'R3_PROFILE_DEVIATION',
        'R4_RISK_COUNTRY',
        'R5_PURPOSE_MISMATCH',
      ]),
    );
    expect(Number(hitsOf('C1001', 'R3_PROFILE_DEVIATION')[0]?.metrics.inflowRatio)).toBeGreaterThan(
      35,
    );
  });

  it('C1006 Sara Huber: R3 only (outflow 5.1×)', () => {
    expect(rulesOf('C1006')).toEqual(new Set(['R3_PROFILE_DEVIATION']));
    expect(hitsOf('C1006', 'R3_PROFILE_DEVIATION')[0]?.metrics.outflowRatio).toBe(5.13);
  });

  it('C1004 Lukas Frei and C1005 Bäckerei Moser: no alert', () => {
    expect(rulesOf('C1004').size).toBe(0);
    expect(rulesOf('C1005').size).toBe(0);
  });
});

describe('acceptance: full pipeline (detect → triage → cases) on the bundled files', () => {
  beforeAll(async () => {
    const { resetAllStores } = await import('@/test/storeHelpers');
    const { bootstrap } = await import('./pipeline');
    resetAllStores();
    await bootstrap();
  });

  it('opens exactly the cases C1001, C1002, C1003, sorted by score', async () => {
    const { useCaseStore } = await import('@/stores/useCaseStore');
    const cases = Object.values(useCaseStore.getState().cases).sort(
      (a, b) => b.score - a.score || a.clientId.localeCompare(b.clientId),
    );
    expect(cases.map((c) => c.clientId).sort()).toEqual(['C1001', 'C1002', 'C1003']);
    expect(cases.every((c) => c.status === 'open')).toBe(true);
    expect(cases.map((c) => c.score)).toEqual([5, 5, 5]);
  });

  it('keeps C1006 in the triage queue with score ≤ 2 and no case', async () => {
    const { useAlertStore } = await import('@/stores/useAlertStore');
    const { useCaseStore } = await import('@/stores/useCaseStore');
    const sara = Object.values(useAlertStore.getState().alerts).filter(
      (a) => a.hit.clientId === 'C1006',
    );
    expect(sara).toHaveLength(1);
    expect(sara[0]?.triage?.score).toBeLessThanOrEqual(2);
    expect(sara[0]?.triage?.recommendedAction).toBe('close_suggested');
    expect(useCaseStore.getState().cases['CASE-C1006']).toBeUndefined();
  });

  it('raises no alert for C1004 and C1005', async () => {
    const { useAlertStore } = await import('@/stores/useAlertStore');
    const clients = new Set(
      Object.values(useAlertStore.getState().alerts).map((a) => a.hit.clientId),
    );
    expect(clients.has('C1004')).toBe(false);
    expect(clients.has('C1005')).toBe(false);
  });

  it('audits every stage and the chain verifies', async () => {
    const { useAuditStore } = await import('@/stores/useAuditStore');
    const actions = useAuditStore.getState().entries.map((e) => e.action);
    expect(actions[0]).toBe('data.loaded');
    expect(actions[1]).toBe('rules.run');
    expect(actions.filter((a) => a === 'alert.raised')).toHaveLength(26);
    expect(actions.filter((a) => a === 'triage.completed')).toHaveLength(26);
    expect(actions.filter((a) => a === 'case.opened')).toHaveLength(3);
    expect(await useAuditStore.getState().verifyChain()).toMatchObject({ ok: true });
  });

  it('is idempotent: re-running keeps alert ids and does not re-triage', async () => {
    const { useAlertStore } = await import('@/stores/useAlertStore');
    const { useAuditStore } = await import('@/stores/useAuditStore');
    const { runPipeline } = await import('./pipeline');
    const ids = Object.keys(useAlertStore.getState().alerts).sort();
    const before = useAuditStore.getState().entries.length;
    await runPipeline();
    expect(Object.keys(useAlertStore.getState().alerts).sort()).toEqual(ids);
    const added = useAuditStore
      .getState()
      .entries.slice(before)
      .map((e) => e.action);
    expect(added).toEqual(['rules.run']);
  });
});
