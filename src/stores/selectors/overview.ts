import { useMemo } from 'react';
import { isDecided } from '@/domain/cases/types';
import { useAlertStore } from '@/stores/useAlertStore';
import { useAuditStore } from '@/stores/useAuditStore';
import { useCaseStore } from '@/stores/useCaseStore';
import { useDataStore } from '@/stores/useDataStore';
import { useReportStore } from '@/stores/useReportStore';

export type StageStatus = 'idle' | 'running' | 'done' | 'waiting';

export interface PipelineStage {
  index: number;
  name: string;
  kind: 'system' | 'ai' | 'human';
  status: StageStatus;
  detail: string;
}

export interface OverviewKpis {
  accounts: number;
  transactions: number;
  openCases: number;
  escalated: number;
}

export function useOverviewKpis(): OverviewKpis {
  const statements = useDataStore((s) => s.statements);
  const transactions = useDataStore((s) => s.transactions);
  const cases = useCaseStore((s) => s.cases);
  return useMemo(() => {
    const list = Object.values(cases);
    return {
      accounts: new Set(Object.values(statements).map((s) => s.iban)).size,
      transactions: Object.keys(transactions).length,
      openCases: list.filter((c) => !isDecided(c.status)).length,
      escalated: list.filter((c) => c.status === 'escalated').length,
    };
  }, [statements, transactions, cases]);
}

/** Live status of the 8 stages of the exercise, derived from the stores. */
export function usePipelineStages(): PipelineStage[] {
  const dataStatus = useDataStore((s) => s.status);
  const txCount = useDataStore((s) => Object.keys(s.transactions).length);
  const alerts = useAlertStore((s) => s.alerts);
  const cases = useCaseStore((s) => s.cases);
  const drafts = useReportStore((s) => s.drafts);
  const auditCount = useAuditStore((s) => s.entries.length);
  return useMemo(() => {
    const a = Object.values(alerts);
    const c = Object.values(cases);
    const d = Object.values(drafts);
    const triaged = a.filter((x) => x.triageStatus === 'done').length;
    const triaging = a.some((x) => x.triageStatus === 'pending' || x.triageStatus === 'running');
    const inReview = c.filter((x) => x.status === 'in_review').length;
    const decided =
      c.filter((x) => isDecided(x.status)).length + a.filter((x) => x.dismissal).length;
    const generating = d.some((x) => x.status === 'queued' || x.status === 'generating');
    const ready = dataStatus === 'ready';
    return [
      {
        index: 1,
        name: 'Ingest',
        kind: 'system',
        status: dataStatus === 'loading' ? 'running' : ready ? 'done' : 'idle',
        detail: ready ? `${txCount} transactions` : dataStatus,
      },
      {
        index: 2,
        name: 'Detect',
        kind: 'system',
        status: ready ? 'done' : 'idle',
        detail: `${a.length} alerts`,
      },
      {
        index: 3,
        name: 'Triage',
        kind: 'ai',
        status: triaging ? 'running' : a.length > 0 ? 'done' : 'idle',
        detail: `${triaged}/${a.length} scored`,
      },
      {
        index: 4,
        name: 'Open case',
        kind: 'system',
        status: c.length > 0 ? 'done' : 'idle',
        detail: `${c.length} cases`,
      },
      {
        index: 5,
        name: 'Investigate',
        kind: 'human',
        status: inReview > 0 ? 'running' : c.length > 0 ? 'waiting' : 'idle',
        detail: `${inReview} in review`,
      },
      {
        index: 6,
        name: 'Decide',
        kind: 'human',
        status: decided > 0 ? 'done' : c.length > 0 ? 'waiting' : 'idle',
        detail: `${decided} decided`,
      },
      {
        index: 7,
        name: 'Draft report',
        kind: 'ai',
        status: generating ? 'running' : d.length > 0 ? 'done' : 'idle',
        detail: `${d.length} drafts`,
      },
      {
        index: 8,
        name: 'Audit log',
        kind: 'system',
        status: auditCount > 0 ? 'done' : 'idle',
        detail: `${auditCount} entries`,
      },
    ];
  }, [dataStatus, txCount, alerts, cases, drafts, auditCount]);
}
