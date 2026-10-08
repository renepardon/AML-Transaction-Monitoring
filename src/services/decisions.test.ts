import { runSamplePipeline } from '@/test/pipelineFixture';
import { useAlertStore } from '@/stores/useAlertStore';
import { useAuditStore } from '@/stores/useAuditStore';
import { useCaseStore } from '@/stores/useCaseStore';
import { closeCase, escalateCase, promoteAlert, reopenCase } from './decisions';
import { waitForDrafts } from './reporting';

describe('decision services', () => {
  beforeEach(runSamplePipeline);
  afterEach(waitForDrafts);

  it('a decision without a reason throws and writes nothing', async () => {
    const before = useAuditStore.getState().entries.length;
    await expect(closeCase('CASE-C1001', '   ')).rejects.toThrow(/reason/);
    expect(useAuditStore.getState().entries.length).toBe(before);
  });

  it('close → reopen → escalate is audited in order with the actor', async () => {
    await closeCase('CASE-C1001', 'documented inheritance, see notes');
    await expect(escalateCase('CASE-C1001', 'cannot decide twice here')).rejects.toThrow(/Reopen/);
    await reopenCase('CASE-C1001', 'documents turned out to be forged');
    await escalateCase('CASE-C1001', 'possible money mule, MROS report');
    const tail = useAuditStore
      .getState()
      .entries.slice(-4)
      .map((e) => [e.action, e.actor.name]);
    expect(tail).toEqual([
      ['case.closed', 'A. Keller'],
      ['case.reopened', 'A. Keller'],
      ['case.escalated', 'A. Keller'],
      ['report.requested', 'A. Keller'],
    ]);
  });

  it('promoting the low-score alert opens a case for C1006', async () => {
    const sara = Object.values(useAlertStore.getState().alerts).find(
      (a) => a.hit.clientId === 'C1006',
    )!;
    await promoteAlert(sara.id, 'want to see the purchase contract');
    expect(useCaseStore.getState().cases['CASE-C1006']).toMatchObject({
      alertIds: [sara.id],
      status: 'open',
    });
    expect(
      useAuditStore
        .getState()
        .entries.slice(-2)
        .map((e) => e.action),
    ).toEqual(['alert.promoted', 'case.opened']);
  });
});
