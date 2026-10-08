import { useMemo } from 'react';
import { isDecided } from '@/domain/cases/types';
import { monthKey } from '@/domain/dates';
import { monthlyAggregates } from '@/domain/rules/aggregates';
import type { ClientProfile, MonthlyAggregate } from '@/domain/types';
import { useAlertStore } from '@/stores/useAlertStore';
import { useCaseStore } from '@/stores/useCaseStore';
import { useDataStore } from '@/stores/useDataStore';
import type { CaseRecord } from '@/domain/cases/types';

export interface ClientCardView {
  client: ClientProfile;
  monthly: MonthlyAggregate[];
  alertCount: number;
  caseStatus: CaseRecord['status'] | null;
  maxRatio: number;
}

export function useClientCards(): ClientCardView[] {
  const clients = useDataStore((s) => s.clients);
  const transactions = useDataStore((s) => s.transactions);
  const alerts = useAlertStore((s) => s.alerts);
  const cases = useCaseStore((s) => s.cases);
  return useMemo(() => {
    const tx = Object.values(transactions);
    const months = [...new Set(tx.map((t) => monthKey(t.bookingDate)))].sort();
    return Object.values(clients).map((client) => {
      const monthly = monthlyAggregates(client.clientId, tx, months);
      const c = Object.values(cases).find((x) => x.clientId === client.clientId);
      const maxRatio = Math.max(
        0,
        ...monthly.map((m) =>
          Math.max(
            m.inflow / Math.max(1, client.expectedMonthlyInflow),
            m.outflow / Math.max(1, client.expectedMonthlyOutflow),
          ),
        ),
      );
      return {
        client,
        monthly,
        alertCount: Object.values(alerts).filter(
          (a) => a.hit.clientId === client.clientId && !a.dismissal,
        ).length,
        caseStatus: c ? c.status : null,
        maxRatio,
      };
    });
  }, [clients, transactions, alerts, cases]);
}

export const openCase = (status: CaseRecord['status'] | null) =>
  status !== null && !isDecided(status);
