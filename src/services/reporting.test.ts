import { SEED_ANALYSTS } from '@/domain/actors';
import { runSamplePipeline } from '@/test/pipelineFixture';
import { useAuditStore } from '@/stores/useAuditStore';
import { useReportStore } from '@/stores/useReportStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { escalateCase } from './decisions';
import {
  approveReport,
  editSection,
  exportMarkdown,
  submitForReview,
  waitForDrafts,
} from './reporting';

describe('reporting service', () => {
  beforeEach(async () => {
    await runSamplePipeline();
    await escalateCase('CASE-C1003', 'pass-through HK → AE twice, no business reason');
  });

  it('escalate → report draft queued → generated, with audit entries in order', async () => {
    expect(['queued', 'generating']).toContain(
      useReportStore.getState().drafts['CASE-C1003']?.status,
    );
    await waitForDrafts();
    const d = useReportStore.getState().drafts['CASE-C1003']!;
    expect(d.status).toBe('draft');
    expect(d.sections).toHaveLength(9);
    const actions = useAuditStore.getState().entries.map((e) => e.action);
    const i = actions.lastIndexOf('case.escalated');
    expect(actions.slice(i)).toEqual(['case.escalated', 'report.requested', 'report.generated']);
    expect(useAuditStore.getState().entries.at(-1)?.actor.kind).toBe('ai');
  });

  it('builds the MROS structure with evidence refs, thresholds and the analyst reason', async () => {
    await waitForDrafts();
    const md = exportMarkdown('CASE-C1003');
    expect(md).toContain('> **Draft for human review – not submitted**');
    expect(md).toContain('## 4. Transactions concerned');
    expect(md).toMatch(
      /\| 14\.07\.2026 \| CHF\s250.000\.00 \| In \| Eastgate Holdings Ltd \| HK \| Consulting fee \| ZSEE\d+ \|/,
    );
    expect(md).toContain('not a FATF list');
    expect(md).toContain('pass-through HK → AE twice, no business reason');
    expect(md).toContain('Art. 9 GwG');
  });

  it('four-eyes: edit, submit, approval only by a second analyst', async () => {
    await waitForDrafts();
    await editSection('CASE-C1003', 'summary', 'Edited summary by the analyst.');
    await submitForReview('CASE-C1003');
    await expect(approveReport('CASE-C1003', 'self approval attempt')).rejects.toThrow(/Four-eyes/);
    useSessionStore.getState().switchActor(SEED_ANALYSTS[1]!.id);
    await approveReport('CASE-C1003', 'checked against statements, approve');
    expect(useReportStore.getState().drafts['CASE-C1003']).toMatchObject({
      status: 'approved',
      version: 2,
    });
    const tail = useAuditStore
      .getState()
      .entries.slice(-3)
      .map((e) => [e.action, e.actor.name]);
    expect(tail).toEqual([
      ['report.edited', 'A. Keller'],
      ['report.submitted', 'A. Keller'],
      ['report.approved', 'M. Rossi'],
    ]);
  });
});
