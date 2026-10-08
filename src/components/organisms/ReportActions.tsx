import { Copy, Printer, RefreshCw, Send, ShieldCheck, ShieldX } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { runAction } from '@/lib/notify';
import { exportMarkdown, redraft, submitForReview } from '@/services/reporting';
import { useReportDraft } from '@/stores/selectors/reports';
import { useUiStore } from '@/stores/useUiStore';

export interface ReportActionsProps {
  caseId: string;
}

export function ReportActions({ caseId }: ReportActionsProps) {
  const draft = useReportDraft(caseId);
  const openDialog = useUiStore((s) => s.openDialog);
  if (!draft) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportMarkdown(caseId));
      toast.success('Report copied as Markdown');
    } catch {
      toast.error('Clipboard is not available in this browser');
    }
  };
  const ready = draft.status !== 'queued' && draft.status !== 'generating';
  return (
    <div className="flex flex-wrap gap-2 no-print">
      {draft.status === 'draft' && (
        <Button
          onClick={() => void runAction(() => submitForReview(caseId), 'Submitted for review')}
        >
          <Send className="size-4" /> Submit for review
        </Button>
      )}
      {draft.status === 'in_review' && (
        <>
          <Button onClick={() => openDialog({ kind: 'review', caseId, action: 'approve' })}>
            <ShieldCheck className="size-4" /> Approve
          </Button>
          <Button
            variant="destructive"
            onClick={() => openDialog({ kind: 'review', caseId, action: 'reject' })}
          >
            <ShieldX className="size-4" /> Reject
          </Button>
        </>
      )}
      {draft.status === 'rejected' && (
        <Button
          variant="outline"
          onClick={() => void runAction(() => redraft(caseId), 'New draft requested')}
        >
          <RefreshCw className="size-4" /> Re-draft
        </Button>
      )}
      <Button variant="outline" onClick={copy} disabled={!ready}>
        <Copy className="size-4" /> Copy as Markdown
      </Button>
      <Button variant="outline" onClick={() => window.print()} disabled={!ready}>
        <Printer className="size-4" /> Print / Save as PDF
      </Button>
    </div>
  );
}
