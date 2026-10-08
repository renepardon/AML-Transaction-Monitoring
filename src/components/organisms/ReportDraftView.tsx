import { FileText, TriangleAlert } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { AiLabel } from '@/components/atoms/AiLabel';
import { ReportSectionEditor } from '@/components/molecules/ReportSectionEditor';
import { DRAFT_BANNER } from '@/domain/reports/ReportDrafter';
import { runAction } from '@/lib/notify';
import { editSection } from '@/services/reporting';
import { useReportDraft } from '@/stores/selectors/reports';
import { useCase } from '@/stores/selectors/cases';
import { useDataStore } from '@/stores/useDataStore';
import { useUiStore } from '@/stores/useUiStore';
import { ReportActions } from './ReportActions';
import { ReportStatusTracker } from './ReportStatusTracker';

export function ReportDraftView() {
  const caseId = useUiStore((s) => s.selectedReportId);
  const draft = useReportDraft(caseId);
  const c = useCase(caseId);
  const clientName = useDataStore((s) => (c ? (s.clients[c.clientId]?.name ?? c.clientId) : ''));
  const drafts = useUiStore((s) => s.drafts);
  const setDraft = useUiStore((s) => s.setDraft);
  const clearDraft = useUiStore((s) => s.clearDraft);
  if (!caseId || !draft) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-16 text-center text-muted-foreground">
        <FileText className="size-8" aria-hidden />
        <p className="text-sm">Select a report draft.</p>
      </div>
    );
  }
  const generating = draft.status === 'generating' || draft.status === 'queued';
  const lastWithText = [...draft.sections].reverse().find((s) => s.body)?.id;
  return (
    <article className="mx-auto max-w-4xl space-y-6 px-6 py-8 lg:px-10">
      <header className="space-y-3">
        <h1 className="text-xl font-semibold tracking-tight">
          Suspicious activity report – {clientName}
        </h1>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ReportStatusTracker status={draft.status} />
          <span className="text-xs text-muted-foreground">
            Version {draft.version} · requested by {draft.requestedBy.name}
          </span>
        </div>
        <p
          role="note"
          className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-800 dark:text-amber-300"
        >
          <TriangleAlert className="size-4" aria-hidden /> {DRAFT_BANNER}
        </p>
        {generating && <Progress value={draft.progress * 100} aria-label="Drafting progress" />}
        {draft.reviewer && (
          <p className="text-sm text-muted-foreground">
            {draft.reviewer.decision === 'approved' ? 'Approved' : 'Rejected'} by{' '}
            {draft.reviewer.actor.name}: “{draft.reviewer.reason}”
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ReportActions caseId={caseId} />
          <AiLabel />
        </div>
      </header>
      <div className="space-y-6 rounded-2xl border border-black/5 bg-card p-6 dark:border-white/10">
        {draft.sections.map((s) => {
          const key = `section:${caseId}:${s.id}`;
          return (
            <ReportSectionEditor
              key={s.id}
              section={s}
              draft={drafts[key]}
              editable={draft.status === 'draft'}
              streaming={generating && s.id === lastWithText}
              onEdit={() => setDraft(key, s.body)}
              onChange={(v) => setDraft(key, v)}
              onCancel={() => clearDraft(key)}
              onSave={() =>
                void runAction(
                  () => editSection(caseId, s.id, drafts[key] ?? s.body),
                  'Section saved',
                ).then((ok) => ok && clearDraft(key))
              }
            />
          );
        })}
      </div>
    </article>
  );
}
