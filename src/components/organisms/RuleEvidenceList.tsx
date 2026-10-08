import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskScoreBadge } from '@/components/atoms/RiskScoreBadge';
import { RuleChip } from '@/components/atoms/RuleChip';
import { formatMetric, metricLabel } from '@/lib/metrics';
import { useCaseAlerts } from '@/stores/selectors/cases';

export interface RuleEvidenceListProps {
  caseId: string;
}

export function RuleEvidenceList({ caseId }: RuleEvidenceListProps) {
  const alerts = useCaseAlerts(caseId);
  return (
    <Card className="rounded-2xl border-black/5 shadow-none dark:border-white/10">
      <CardHeader>
        <CardTitle className="text-base">
          Triggered rules <span className="tabular text-muted-foreground">{alerts.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-black/5 dark:divide-white/10">
          {alerts.map((a) => (
            <li key={a.id} className="py-3">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-start gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                  <RuleChip ruleId={a.hit.ruleId} className="mt-0.5 shrink-0" />
                  <span className="min-w-0 flex-1 text-sm">{a.hit.summary}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground uppercase">
                    {a.hit.severity}
                  </span>
                  {a.triage && <RiskScoreBadge score={a.triage.score} className="shrink-0" />}
                </summary>
                <div className="mt-3 space-y-3 pl-1 text-sm">
                  {a.triage && <p className="text-muted-foreground">{a.triage.explanation}</p>}
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
                    {Object.entries(a.hit.metrics).map(([k, v]) => (
                      <div key={k} className="min-w-0">
                        <dt className="text-muted-foreground">{metricLabel(k)}</dt>
                        <dd className="tabular truncate font-medium" title={formatMetric(k, v)}>
                          {formatMetric(k, v)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p className="text-[11px] text-muted-foreground">
                    {a.hit.evidenceTxIds.length} evidence transaction(s) · alert {a.id}
                  </p>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
