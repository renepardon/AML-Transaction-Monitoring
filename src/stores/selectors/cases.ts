import { useMemo } from 'react';
import { isDecided, type CaseRecord } from '@/domain/cases/types';
import { formatMonth, monthKey } from '@/domain/dates';
import { monthlyAggregates } from '@/domain/rules/aggregates';
import type { RuleId } from '@/domain/rules/types';
import type { ClientProfile, Transaction } from '@/domain/types';
import { useAlertStore, type AlertRecord } from '@/stores/useAlertStore';
import { useCaseStore } from '@/stores/useCaseStore';
import { useDataStore } from '@/stores/useDataStore';

export interface CaseListView {
  id: string;
  clientId: string;
  clientName: string;
  score: number;
  status: CaseRecord['status'];
  ruleIds: RuleId[];
  openedAt: string;
  updatedAt: string;
}

/** Score descending, then most recently opened. */
export function compareCases(a: CaseListView, b: CaseListView): number {
  return (
    b.score - a.score ||
    b.openedAt.localeCompare(a.openedAt) ||
    a.clientId.localeCompare(b.clientId)
  );
}

function toListView(
  c: CaseRecord,
  alerts: Record<string, AlertRecord>,
  clients: Record<string, ClientProfile>,
): CaseListView {
  const ruleIds = [
    ...new Set(c.alertIds.map((id) => alerts[id]?.hit.ruleId).filter((r): r is RuleId => !!r)),
  ].sort();
  return {
    id: c.id,
    clientId: c.clientId,
    clientName: clients[c.clientId]?.name ?? c.clientId,
    score: c.score,
    status: c.status,
    ruleIds,
    openedAt: c.openedAt,
    updatedAt: c.updatedAt,
  };
}

function useAllCaseViews(): CaseListView[] {
  const cases = useCaseStore((s) => s.cases);
  const alerts = useAlertStore((s) => s.alerts);
  const clients = useDataStore((s) => s.clients);
  return useMemo(
    () =>
      Object.values(cases)
        .map((c) => toListView(c, alerts, clients))
        .sort(compareCases),
    [cases, alerts, clients],
  );
}

/** Open and in-review cases, sorted by score (the analyst's work list). */
export function useOpenCasesSortedByScore(): CaseListView[] {
  const all = useAllCaseViews();
  return useMemo(() => all.filter((c) => !isDecided(c.status)), [all]);
}

export function useDecidedCases(): CaseListView[] {
  const all = useAllCaseViews();
  return useMemo(() => all.filter((c) => isDecided(c.status)), [all]);
}

/** Open first, then decided; used for J/K navigation. */
export function useCaseNavigationOrder(): string[] {
  const open = useOpenCasesSortedByScore();
  const decided = useDecidedCases();
  return useMemo(() => [...open, ...decided].map((c) => c.id), [open, decided]);
}

export function useAlertCaseIndex(): Record<string, string> {
  const cases = useCaseStore((s) => s.cases);
  return useMemo(() => {
    const index: Record<string, string> = {};
    for (const c of Object.values(cases)) for (const id of c.alertIds) index[id] = c.id;
    return index;
  }, [cases]);
}

export function useCase(caseId: string | null): CaseRecord | null {
  return useCaseStore((s) => (caseId ? (s.cases[caseId] ?? null) : null));
}

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 } as const;
const RULE_PRIORITY: Record<RuleId, number> = {
  R2_PASS_THROUGH: 0,
  R1_STRUCTURING: 1,
  R3_PROFILE_DEVIATION: 2,
  R5_PURPOSE_MISMATCH: 3,
  R4_RISK_COUNTRY: 4,
};

/** Score, then severity, then the most characteristic rule, then the earliest period. */
export function compareCaseAlerts(a: AlertRecord, b: AlertRecord): number {
  return (
    (b.triage?.score ?? 0) - (a.triage?.score ?? 0) ||
    SEVERITY_RANK[a.hit.severity] - SEVERITY_RANK[b.hit.severity] ||
    RULE_PRIORITY[a.hit.ruleId] - RULE_PRIORITY[b.hit.ruleId] ||
    a.hit.period.from.localeCompare(b.hit.period.from)
  );
}

/** Case alerts, most significant first. */
export function useCaseAlerts(caseId: string | null): AlertRecord[] {
  const c = useCase(caseId);
  const alerts = useAlertStore((s) => s.alerts);
  return useMemo(
    () =>
      c
        ? c.alertIds
            .map((id) => alerts[id])
            .filter((a): a is AlertRecord => !!a)
            .sort(compareCaseAlerts)
        : [],
    [c, alerts],
  );
}

export interface MonthlySeriesPoint {
  month: string;
  label: string;
  inflow: number;
  outflow: number;
  expectedInflow: number;
  expectedOutflow: number;
}

/** Monthly inflow/outflow vs expected in CHF (francs, for charting only). */
export function useClientMonthlySeries(clientId: string | null): MonthlySeriesPoint[] {
  const transactions = useDataStore((s) => s.transactions);
  const client = useDataStore((s) => (clientId ? s.clients[clientId] : undefined));
  return useMemo(() => {
    if (!client) return [];
    const all = Object.values(transactions);
    const months = [...new Set(all.map((t) => monthKey(t.bookingDate)))].sort();
    return monthlyAggregates(client.clientId, all, months).map((m) => ({
      month: m.month,
      label: formatMonth(m.month),
      inflow: m.inflow / 100,
      outflow: m.outflow / 100,
      expectedInflow: client.expectedMonthlyInflow / 100,
      expectedOutflow: client.expectedMonthlyOutflow / 100,
    }));
  }, [transactions, client]);
}

export interface TimelineRow {
  tx: Transaction;
  evidence: boolean;
  /** Pass-through group label, e.g. "PT1", with the role of the transaction in it. */
  link?: { group: string; role: 'in' | 'out' };
}

/** All client transactions (newest first), evidence highlighted, pass-through in→out linked. */
export function useCaseTimeline(caseId: string | null): TimelineRow[] {
  const c = useCase(caseId);
  const caseAlerts = useCaseAlerts(caseId);
  const transactions = useDataStore((s) => s.transactions);
  return useMemo(() => {
    if (!c) return [];
    const evidence = new Set(caseAlerts.flatMap((a) => a.hit.evidenceTxIds));
    const links = new Map<string, { group: string; role: 'in' | 'out' }>();
    caseAlerts
      .filter((a) => a.hit.ruleId === 'R2_PASS_THROUGH')
      .sort((a, b) => a.hit.period.from.localeCompare(b.hit.period.from))
      .forEach((a, i) =>
        a.hit.evidenceTxIds.forEach((id, j) =>
          links.set(id, { group: `PT${i + 1}`, role: j === 0 ? 'in' : 'out' }),
        ),
      );
    return Object.values(transactions)
      .filter((t) => t.clientId === c.clientId)
      .sort((a, b) => b.bookingDate.localeCompare(a.bookingDate) || a.id.localeCompare(b.id))
      .map((tx) => ({ tx, evidence: evidence.has(tx.id), link: links.get(tx.id) }));
  }, [c, caseAlerts, transactions]);
}
