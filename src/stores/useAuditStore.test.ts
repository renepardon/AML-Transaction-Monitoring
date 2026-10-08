import { SYSTEM_ACTOR } from '@/domain/actors';
import { GENESIS_HASH } from '@/domain/audit/hashChain';
import { useAuditStore } from './useAuditStore';

const input = (n: number) => ({
  action: 'rules.run' as const,
  entity: { type: 'rules' as const, id: `r${n}` },
  actor: SYSTEM_ACTOR,
});

describe('useAuditStore', () => {
  beforeEach(() =>
    useAuditStore.setState({
      entries: [],
      anchorHash: GENESIS_HASH,
      verification: { status: 'idle' },
    }),
  );

  it('appends in call order with linked hashes even when called concurrently', async () => {
    await Promise.all([1, 2, 3, 4].map((n) => useAuditStore.getState().append(input(n))));
    const { entries } = useAuditStore.getState();
    expect(entries.map((e) => e.entity.id)).toEqual(['r1', 'r2', 'r3', 'r4']);
    expect(entries.map((e) => e.seq)).toEqual([1, 2, 3, 4]);
    expect(entries[1]?.prevHash).toBe(entries[0]?.hash);
    expect(entries[0]?.prevHash).toBe(GENESIS_HASH);
  });

  it('verifyChain detects tampering', async () => {
    for (const n of [1, 2, 3]) await useAuditStore.getState().append(input(n));
    expect(await useAuditStore.getState().verifyChain()).toEqual({ ok: true, count: 3 });
    useAuditStore.setState((s) => ({
      entries: s.entries.map((e) => (e.seq === 2 ? { ...e, reason: 'forged' } : e)),
    }));
    expect(await useAuditStore.getState().verifyChain()).toMatchObject({ ok: false, brokenSeq: 2 });
    expect(useAuditStore.getState().verification).toMatchObject({ status: 'done', ok: false });
  });

  it('starts a new chain anchored on the previous head', async () => {
    const last = await useAuditStore.getState().append(input(1));
    useAuditStore.getState().startNewChain();
    const first = await useAuditStore.getState().append(input(2));
    expect(first).toMatchObject({ seq: 1, prevHash: last.hash });
    expect(await useAuditStore.getState().verifyChain()).toEqual({ ok: true, count: 1 });
  });

  it('persists entries under the aml-poc: prefix', async () => {
    await useAuditStore.getState().append(input(1));
    const stored = JSON.parse(localStorage.getItem('aml-poc:audit') ?? '{}');
    expect(stored.state.entries).toHaveLength(1);
    expect(stored.state.verification).toBeUndefined();
  });
});
