import { SEED_ANALYSTS } from '@/domain/actors';
import { useReportStore } from './useReportStore';

const [keller, rossi] = SEED_ANALYSTS as [(typeof SEED_ANALYSTS)[0], (typeof SEED_ANALYSTS)[0]];
const toReview = () => {
  const s = useReportStore.getState();
  s.requestDraft('CASE-1', keller!);
  s.startGenerating('CASE-1', [{ id: 'a', title: 'A' }]);
  s.appendChunk('CASE-1', { sectionId: 'a', text: 'Hello ' }, 0.5);
  s.appendChunk('CASE-1', { sectionId: 'a', text: 'world' }, 1);
  s.completeDraft('CASE-1', useReportStore.getState().drafts['CASE-1']!.sections);
};

describe('useReportStore', () => {
  beforeEach(() => useReportStore.getState().resetReports());

  it('walks the lifecycle queued → generating → draft', () => {
    const s = useReportStore.getState();
    s.requestDraft('CASE-1', keller!);
    expect(useReportStore.getState().drafts['CASE-1']?.status).toBe('queued');
    s.startGenerating('CASE-1', [{ id: 'a', title: 'A' }]);
    expect(useReportStore.getState().drafts['CASE-1']?.status).toBe('generating');
    s.completeDraft('CASE-1', []);
    expect(useReportStore.getState().drafts['CASE-1']?.status).toBe('draft');
  });

  it('streams chunks into sections and bumps the version on completion and edits', () => {
    toReview();
    const d = useReportStore.getState().drafts['CASE-1']!;
    expect(d).toMatchObject({
      status: 'draft',
      streamedText: 'Hello world',
      progress: 1,
      version: 1,
    });
    expect(useReportStore.getState().editSection('CASE-1', 'a', 'Edited')).toEqual({
      before: 'Hello world',
      after: 'Edited',
    });
    expect(useReportStore.getState().drafts['CASE-1']?.version).toBe(2);
  });

  it('enforces four-eyes: the escalating analyst cannot approve', () => {
    toReview();
    useReportStore.getState().submitForReview('CASE-1', keller!);
    expect(() => useReportStore.getState().approve('CASE-1', keller!, 'looks good to me')).toThrow(
      /Four-eyes/,
    );
    expect(() => useReportStore.getState().editSection('CASE-1', 'a', 'x')).toThrow(/Only a draft/);
    useReportStore.getState().approve('CASE-1', rossi!, 'reviewed, facts are complete');
    expect(useReportStore.getState().drafts['CASE-1']?.reviewer).toMatchObject({
      decision: 'approved',
      actor: { id: 'officer-rossi' },
    });
  });

  it('requires a reason for review decisions and allows a new draft after rejection', () => {
    toReview();
    useReportStore.getState().submitForReview('CASE-1', keller!);
    expect(() => useReportStore.getState().reject('CASE-1', rossi!, 'no')).toThrow(/at least 10/);
    useReportStore.getState().reject('CASE-1', rossi!, 'section 7 lacks the call notes');
    expect(() => useReportStore.getState().requestDraft('CASE-1', keller!)).not.toThrow();
    expect(useReportStore.getState().drafts['CASE-1']).toMatchObject({
      status: 'queued',
      version: 1,
    });
  });

  it('rejects a second request while a draft exists', () => {
    toReview();
    expect(() => useReportStore.getState().requestDraft('CASE-1', keller!)).toThrow(
      /already exists/,
    );
  });
});
