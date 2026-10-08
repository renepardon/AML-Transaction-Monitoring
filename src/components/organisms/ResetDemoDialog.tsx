import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { runAction } from '@/lib/notify';
import { resetDemo } from '@/services/session';
import { useUiStore } from '@/stores/useUiStore';

export function ResetDemoDialog() {
  const open = useUiStore((s) => s.dialog?.kind === 'reset');
  const closeDialog = useUiStore((s) => s.closeDialog);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset demo?</DialogTitle>
          <DialogDescription>
            Cases, alerts, report drafts, settings and the session are cleared. A final entry is
            written to the audit log, and the new audit chain is anchored on its hash. The sample
            data is then loaded again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={closeDialog}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              closeDialog();
              void runAction(resetDemo, 'Demo reset');
            }}
          >
            Reset demo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
