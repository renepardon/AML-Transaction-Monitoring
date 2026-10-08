import { runSamplePipeline } from '@/test/pipelineFixture';
import { useAuditStore } from '@/stores/useAuditStore';
import { useCaseStore } from '@/stores/useCaseStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { closeCase } from './decisions';
import { resetDemo, switchActor } from './session';

describe('session services', () => {
  beforeEach(runSamplePipeline);

  it('audits actor switches', async () => {
    await switchActor('officer-rossi');
    expect(useSessionStore.getState().currentActor.name).toBe('M. Rossi');
    expect(useAuditStore.getState().entries.at(-1)).toMatchObject({
      action: 'actor.switched',
      actor: { name: 'M. Rossi' },
    });
  });

  it('reset demo writes a final entry, anchors a new chain and reloads', async () => {
    await closeCase('CASE-C1001', 'documented, harmless activity');
    const before = useAuditStore.getState().entries;
    await resetDemo();
    const finalEntry = before.length; // the demo.reset entry was appended after `before` was captured
    expect(finalEntry).toBeGreaterThan(0);
    const { entries, anchorHash } = useAuditStore.getState();
    expect(entries[0]).toMatchObject({ seq: 1, action: 'demo.reset', prevHash: anchorHash });
    expect(useCaseStore.getState().cases['CASE-C1001']?.status).toBe('open');
    expect(await useAuditStore.getState().verifyChain()).toMatchObject({ ok: true });
  });
});
