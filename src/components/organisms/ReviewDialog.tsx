import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ReasonField } from '@/components/molecules/ReasonField';
import { actorLabel } from '@/domain/actors';
import { isValidReason } from '@/domain/reason';
import { runAction } from '@/lib/notify';
import { approveReport, rejectReport } from '@/services/reporting';
import { useReportDraft } from '@/stores/selectors/reports';
import { useSessionStore } from '@/stores/useSessionStore';
import { useUiStore } from '@/stores/useUiStore';

export function ReviewDialog() {
  const dialog = useUiStore((s) => s.dialog);
  const closeDialog = useUiStore((s) => s.closeDialog);
  const target = dialog?.kind === 'review' ? dialog : null;
  const draft = useReportDraft(target?.caseId ?? null);
  const actor = useSessionStore((s) => s.currentActor);
  const key = target ? `review:${target.caseId}` : '';
  const reason = useUiStore((s) => s.drafts[key] ?? '');
  const setDraft = useUiStore((s) => s.setDraft);
  const clearDraft = useUiStore((s) => s.clearDraft);
  const approve = target?.action === 'approve';
  const sameActor = draft?.requestedBy.id === actor.id;

  const submit = async () => {
    if (!target) return;
    const ok = await runAction(
      () => (approve ? approveReport(target.caseId, reason) : rejectReport(target.caseId, reason)),
      approve ? 'Report approved' : 'Report rejected',
    );
    if (ok) {
      clearDraft(key);
      closeDialog();
    }
  };

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{approve ? 'Approve report' : 'Reject report'}</DialogTitle>
          <DialogDescription>
            Escalated by {draft ? actorLabel(draft.requestedBy) : '–'}. The second review must come
            from a different person (four-eyes principle).
          </DialogDescription>
        </DialogHeader>
        {sameActor && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            You escalated this case yourself. Switch to another analyst in the top bar to review it.
          </p>
        )}
        <ReasonField
          id="review-reason"
          label="Reason (required)"
          value={reason}
          onChange={(v) => setDraft(key, v)}
          actorLabel={actorLabel(actor)}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={closeDialog}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!isValidReason(reason)}
            variant={approve ? 'default' : 'destructive'}
          >
            {approve ? 'Approve' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
