import { useMemo } from 'react';
import type { RuleId, Severity } from '@/domain/rules/types';
import { useAlertStore, type AlertRecord, type TriageStatus } from '@/stores/useAlertStore';
import { useDataStore } from '@/stores/useDataStore';
import { useUiStore, type AlertFilters } from '@/stores/useUiStore';

export interface AlertView {
  id: string;
  clientId: string;
  clientName: string;
  ruleId: RuleId;
  severity: Severity;
  summary: string;
  status: TriageStatus;
  score: number | null;
  explanation: string | null;
  recommendedAction: 'open_case' | 'close_suggested' | null;
  dismissed: boolean;
  dismissalReason: string | null;
  promoted: boolean;
  raisedAt: string;
}

export function toAlertView(a: AlertRecord, clientName: string): AlertView {
  return {
    id: a.id,
    clientId: a.hit.clientId,
    clientName,
    ruleId: a.hit.ruleId,
    severity: a.hit.severity,
    summary: a.hit.summary,
    status: a.triageStatus,
    score: a.triage?.score ?? null,
    explanation: a.triage?.explanation ?? null,
    recommendedAction: a.triage?.recommendedAction ?? null,
    dismissed: Boolean(a.dismissal),
    dismissalReason: a.dismissal?.reason ?? null,
    promoted: Boolean(a.promotedAt),
    raisedAt: a.raisedAt,
  };
}

/** Score descending (unscored last), then client and rule. */
export function compareAlerts(a: AlertView, b: AlertView): number {
  return (
    (b.score ?? 0) - (a.score ?? 0) ||
    a.clientId.localeCompare(b.clientId) ||
    a.ruleId.localeCompare(b.ruleId) ||
    a.id.localeCompare(b.id)
  );
}

export function filterAlerts(alerts: AlertView[], f: AlertFilters): AlertView[] {
  return alerts.filter(
    (a) =>
      (f.showDismissed || !a.dismissed) &&
      (f.rules.length === 0 || f.rules.includes(a.ruleId)) &&
      (f.scores.length === 0 || (a.score !== null && f.scores.includes(a.score))),
  );
}

export function useAlertViews(): AlertView[] {
  const alerts = useAlertStore((s) => s.alerts);
  const clients = useDataStore((s) => s.clients);
  return useMemo(
    () =>
      Object.values(alerts)
        .map((a) => toAlertView(a, clients[a.hit.clientId]?.name ?? a.hit.clientId))
        .sort(compareAlerts),
    [alerts, clients],
  );
}

export function useFilteredAlertViews(): AlertView[] {
  const views = useAlertViews();
  const filters = useUiStore((s) => s.alertFilters);
  return useMemo(() => filterAlerts(views, filters), [views, filters]);
}

export interface TriageProgress {
  total: number;
  done: number;
  running: number;
  failed: number;
}

export function useTriageProgress(): TriageProgress {
  const alerts = useAlertStore((s) => s.alerts);
  return useMemo(() => {
    const list = Object.values(alerts).filter((a) => !a.dismissal);
    return {
      total: list.length,
      done: list.filter((a) => a.triageStatus === 'done').length,
      running: list.filter((a) => a.triageStatus === 'running').length,
      failed: list.filter((a) => a.triageStatus === 'error').length,
    };
  }, [alerts]);
}
