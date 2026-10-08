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
import { dismissAlert, promoteAlert } from '@/services/decisions';
import { useAlertStore } from '@/stores/useAlertStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { useUiStore } from '@/stores/useUiStore';

export function AlertActionDialog() {
  const dialog = useUiStore((s) => s.dialog);
  const closeDialog = useUiStore((s) => s.closeDialog);
  const actor = useSessionStore((s) => s.currentActor);
  const target = dialog?.kind === 'alert' ? dialog : null;
  const alert = useAlertStore((s) => (target ? s.alerts[target.alertId] : undefined));
  const draftKey = target ? `alert:${target.alertId}` : '';
  const reason = useUiStore((s) => s.drafts[draftKey] ?? '');
  const setDraft = useUiStore((s) => s.setDraft);
  const clearDraft = useUiStore((s) => s.clearDraft);

  const dismiss = target?.action === 'dismiss';
  const submit = async () => {
    if (!target) return;
    const ok = await runAction(
      () => (dismiss ? dismissAlert(target.alertId, reason) : promoteAlert(target.alertId, reason)),
      dismiss ? 'Alert closed as false positive' : 'Alert promoted to a case',
    );
    if (ok) {
      clearDraft(draftKey);
      closeDialog();
    }
  };

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {dismiss ? 'Dismiss alert as false positive' : 'Promote alert to a case'}
          </DialogTitle>
          <DialogDescription>{alert?.hit.summary}</DialogDescription>
        </DialogHeader>
        <ReasonField
          id="alert-reason"
          label="Reason (required)"
          value={reason}
          onChange={(v) => setDraft(draftKey, v)}
          actorLabel={actorLabel(actor)}
          placeholder={dismiss ? 'Why is this alert harmless?' : 'Why does this alert need a case?'}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={closeDialog}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!isValidReason(reason)}
            variant={dismiss ? 'secondary' : 'default'}
          >
            {dismiss ? 'Dismiss alert' : 'Promote to case'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
