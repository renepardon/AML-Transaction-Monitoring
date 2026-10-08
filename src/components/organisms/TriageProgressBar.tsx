import { Progress } from '@/components/ui/progress';
import { useTriageProgress } from '@/stores/selectors/alerts';

export function TriageProgressBar() {
  const { total, done, running, failed } = useTriageProgress();
  if (total === 0) return null;
  const complete = done + failed === total;
  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{complete ? 'Triage complete' : `Claude is triaging… ${running} running`}</span>
        <span className="tabular">
          {done} / {total} scored{failed ? ` · ${failed} failed` : ''}
        </span>
      </div>
      <Progress value={(done / total) * 100} aria-label="Triage progress" />
    </div>
  );
}
