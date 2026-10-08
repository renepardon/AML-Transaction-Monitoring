import { useMemo } from 'react';
import { useCaseStore } from '@/stores/useCaseStore';
import { useDataStore } from '@/stores/useDataStore';
import { useReportStore, type ReportDraft } from '@/stores/useReportStore';

export interface ReportListView {
  caseId: string;
  clientName: string;
  status: ReportDraft['status'];
  version: number;
  updatedAt: string;
}

const ORDER: Record<ReportDraft['status'], number> = {
  in_review: 0,
  draft: 1,
  generating: 2,
  queued: 3,
  rejected: 4,
  approved: 5,
  idle: 6,
};

export function useReportList(): ReportListView[] {
  const drafts = useReportStore((s) => s.drafts);
  const cases = useCaseStore((s) => s.cases);
  const clients = useDataStore((s) => s.clients);
  return useMemo(
    () =>
      Object.values(drafts)
        .map((d) => {
          const clientId = cases[d.caseId]?.clientId ?? '';
          return {
            caseId: d.caseId,
            clientName: clients[clientId]?.name ?? clientId,
            status: d.status,
            version: d.version,
            updatedAt: d.updatedAt,
          };
        })
        .sort(
          (a, b) => ORDER[a.status] - ORDER[b.status] || b.updatedAt.localeCompare(a.updatedAt),
        ),
    [drafts, cases, clients],
  );
}

export function useReportDraft(caseId: string | null): ReportDraft | null {
  return useReportStore((s) => (caseId ? (s.drafts[caseId] ?? null) : null));
}
