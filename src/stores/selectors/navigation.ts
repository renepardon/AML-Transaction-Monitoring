import { useMemo } from 'react';
import { isDecided } from '@/domain/cases/types';
import { useAlertStore } from '@/stores/useAlertStore';
import { useCaseStore } from '@/stores/useCaseStore';
import { useReportStore } from '@/stores/useReportStore';
import type { View } from '@/stores/useUiStore';

/** Counts next to sidebar items: open cases, alerts awaiting a decision, reports in review. */
export function useNavBadges(): Partial<Record<View, number>> {
  const cases = useCaseStore((s) => s.cases);
  const alerts = useAlertStore((s) => s.alerts);
  const drafts = useReportStore((s) => s.drafts);
  return useMemo(() => {
    const inCase = new Set(Object.values(cases).flatMap((c) => c.alertIds));
    return {
      cases: Object.values(cases).filter((c) => !isDecided(c.status)).length,
      alerts: Object.values(alerts).filter(
        (a) => !a.dismissal && !inCase.has(a.id) && a.triageStatus === 'done',
      ).length,
      reports: Object.values(drafts).filter((d) => d.status === 'in_review' || d.status === 'draft')
        .length,
    };
  }, [cases, alerts, drafts]);
}
