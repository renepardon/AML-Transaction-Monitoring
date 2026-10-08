import { toast } from 'sonner';
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
import { closeCase, escalateCase, reopenCase } from '@/services/decisions';
import { useDataStore } from '@/stores/useDataStore';
import { useCase } from '@/stores/selectors/cases';
import { useSessionStore } from '@/stores/useSessionStore';
import { useUiStore } from '@/stores/useUiStore';

const COPY = {
  close: {
    title: 'Close as false positive',
    action: 'Close case',
    success: 'Case closed as false positive',
    placeholder: 'Why is this activity explained and harmless?',
  },
  escalate: {
    title: 'Escalate case',
    action: 'Escalate',
    success: 'Case escalated – report draft requested',
    placeholder: 'Which facts support a suspicion (Art. 9 GwG)?',
  },
  reopen: {
    title: 'Reopen case',
    action: 'Reopen',
    success: 'Case reopened',
    placeholder: 'Why does this decision need to be revisited?',
  },
} as const;

export function DecisionDialog() {
  const dialog = useUiStore((s) => s.dialog);
  const closeDialog = useUiStore((s) => s.closeDialog);
  const target = dialog?.kind === 'decision' ? dialog : null;
  const actor = useSessionStore((s) => s.currentActor);
  const c = useCase(target?.caseId ?? null);
  const clientName = useDataStore((s) => (c ? (s.clients[c.clientId]?.name ?? c.clientId) : ''));
  const key = target ? `decision:${target.caseId}` : '';
  const reason = useUiStore((s) => s.drafts[key] ?? '');
  const setDraft = useUiStore((s) => s.setDraft);
  const clearDraft = useUiStore((s) => s.clearDraft);
  const copy = COPY[target?.decision ?? 'close'];

  const submit = async () => {
    if (!target) return;
    const fn =
      target.decision === 'close'
        ? closeCase
        : target.decision === 'escalate'
          ? escalateCase
          : reopenCase;
    const escalating = target.decision === 'escalate';
    if (await runAction(() => fn(target.caseId, reason), escalating ? undefined : copy.success)) {
      clearDraft(key);
      closeDialog();
      if (escalating) {
        const ui = useUiStore.getState();
        ui.selectReport(target.caseId);
        toast.success(copy.success, {
          action: { label: 'View report', onClick: () => ui.navigate('reports') },
        });
      }
    }
  };

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>
            {clientName} · {target?.caseId}. A reason is required and is written to the audit log.
          </DialogDescription>
        </DialogHeader>
        <ReasonField
          id="decision-reason"
          label="Reason (required)"
          value={reason}
          onChange={(v) => setDraft(key, v)}
          actorLabel={actorLabel(actor)}
          placeholder={copy.placeholder}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={closeDialog}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!isValidReason(reason)}
            variant={target?.decision === 'escalate' ? 'destructive' : 'default'}
          >
            {copy.action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
