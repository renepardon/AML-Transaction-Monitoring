import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RuleChip } from '@/components/atoms/RuleChip';
import { RiskScoreBadge } from '@/components/atoms/RiskScoreBadge';
import { StatusPill } from '@/components/atoms/StatusPill';
import type { AlertView } from '@/stores/selectors/alerts';

export interface AlertRowProps {
  alert: AlertView;
  caseId?: string | null;
  onDismiss?: (id: string) => void;
  onPromote?: (id: string) => void;
  onOpenCase?: (caseId: string) => void;
}

export function AlertRow({ alert, caseId, onDismiss, onPromote, onOpenCase }: AlertRowProps) {
  const triaging = alert.status === 'pending' || alert.status === 'running';
  const actionable = !alert.dismissed && !caseId && alert.status === 'done';
  return (
    <li
      className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:gap-4"
      aria-busy={triaging}
    >
      <div className="w-28 shrink-0 pt-0.5">
        {triaging ? (
          <Skeleton className="h-5 w-20 rounded-full" />
        ) : alert.score !== null ? (
          <RiskScoreBadge score={alert.score} />
        ) : (
          <StatusPill status={alert.status} />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{alert.clientName}</span>
          <RuleChip ruleId={alert.ruleId} />
          {alert.dismissed && <StatusPill status="dismissed" />}
          {caseId && <StatusPill status="open" />}
        </div>
        <p className="text-sm text-muted-foreground">{alert.summary}</p>
        {triaging ? (
          <div className="space-y-1.5 pt-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ) : (
          alert.explanation && <p className="text-sm">{alert.explanation}</p>
        )}
        {alert.dismissalReason && (
          <p className="text-xs text-muted-foreground">Dismissed: {alert.dismissalReason}</p>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        {caseId && onOpenCase && (
          <Button variant="outline" size="sm" onClick={() => onOpenCase(caseId)}>
            Open case
          </Button>
        )}
        {actionable && onPromote && (
          <Button variant="outline" size="sm" onClick={() => onPromote(alert.id)}>
            Promote
          </Button>
        )}
        {actionable && onDismiss && (
          <Button variant="secondary" size="sm" onClick={() => onDismiss(alert.id)}>
            Dismiss
          </Button>
        )}
      </div>
    </li>
  );
}
