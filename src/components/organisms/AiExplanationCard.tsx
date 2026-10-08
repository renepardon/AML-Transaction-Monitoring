import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AiLabel } from '@/components/atoms/AiLabel';
import { RiskScoreBadge } from '@/components/atoms/RiskScoreBadge';
import { FactList } from '@/components/molecules/FactList';
import { Timestamp } from '@/components/atoms/Timestamp';
import { useCaseAlerts } from '@/stores/selectors/cases';

export interface AiExplanationCardProps {
  caseId: string;
}

const unique = (xs: string[]) => [...new Set(xs)];

export function AiExplanationCard({ caseId }: AiExplanationCardProps) {
  const alerts = useCaseAlerts(caseId);
  const top = alerts.find((a) => a.triage);
  const triage = top?.triage;
  return (
    <Card className="rounded-2xl border-primary/15 bg-primary/[0.03] shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Claude's assessment</CardTitle>
        {triage && <RiskScoreBadge score={triage.score} />}
      </CardHeader>
      <CardContent className="space-y-4">
        {!triage ? (
          <div className="space-y-2" aria-busy="true">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          <>
            <p className="text-[15px] leading-relaxed">{triage.explanation}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FactList
                title="Aggravating"
                tone="aggravating"
                facts={unique(alerts.flatMap((a) => a.triage?.aggravating.slice(1) ?? []))}
              />
              <FactList
                title="Mitigating"
                tone="mitigating"
                facts={unique(alerts.flatMap((a) => a.triage?.mitigating ?? []))}
                emptyText="No mitigating evidence found."
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-3 text-[11px] text-muted-foreground dark:border-white/10">
              <AiLabel />
              <span>
                {triage.model} · <Timestamp iso={triage.generatedAt} /> · {triage.latencyMs} ms
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
