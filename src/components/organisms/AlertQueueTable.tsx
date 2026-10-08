import { AlertRow } from '@/components/molecules/AlertRow';
import { Skeleton } from '@/components/ui/skeleton';
import { useFilteredAlertViews } from '@/stores/selectors/alerts';
import { useAlertCaseIndex } from '@/stores/selectors/cases';
import { useDataStore } from '@/stores/useDataStore';
import { useUiStore } from '@/stores/useUiStore';
import { AlertFilterBar } from './AlertFilterBar';

export function AlertQueueTable() {
  const alerts = useFilteredAlertViews();
  const caseByAlert = useAlertCaseIndex();
  const status = useDataStore((s) => s.status);
  const openDialog = useUiStore((s) => s.openDialog);
  const navigate = useUiStore((s) => s.navigate);
  const selectCase = useUiStore((s) => s.selectCase);

  const openCase = (caseId: string) => {
    selectCase(caseId);
    navigate('cases');
  };

  return (
    <div className="space-y-4">
      <AlertFilterBar />
      {status === 'loading' || status === 'idle' ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : status === 'error' ? (
        <p role="alert" className="py-10 text-center text-sm text-red-600">
          Data could not be loaded. Check the Data page.
        </p>
      ) : alerts.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No alerts match the current filters.
        </p>
      ) : (
        <ul className="divide-y divide-black/5 dark:divide-white/10" aria-label="Alerts">
          {alerts.map((a) => (
            <AlertRow
              key={a.id}
              alert={a}
              caseId={caseByAlert[a.id] ?? null}
              onOpenCase={openCase}
              onDismiss={(id) => openDialog({ kind: 'alert', alertId: id, action: 'dismiss' })}
              onPromote={(id) => openDialog({ kind: 'alert', alertId: id, action: 'promote' })}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
