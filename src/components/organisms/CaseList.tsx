import { Skeleton } from '@/components/ui/skeleton';
import { CaseListItem } from '@/components/molecules/CaseListItem';
import { Kbd } from '@/components/atoms/Kbd';
import { useDecidedCases, useOpenCasesSortedByScore } from '@/stores/selectors/cases';
import { useTriageProgress } from '@/stores/selectors/alerts';
import { useUiStore } from '@/stores/useUiStore';

export function CaseList() {
  const open = useOpenCasesSortedByScore();
  const decided = useDecidedCases();
  const selected = useUiStore((s) => s.selectedCaseId);
  const select = useUiStore((s) => s.selectCase);
  const progress = useTriageProgress();
  const triaging = progress.total > 0 && progress.done + progress.failed < progress.total;

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center justify-between px-2 pt-2">
        <h2 className="text-sm font-semibold">
          Open cases <span className="tabular text-muted-foreground">{open.length}</span>
        </h2>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Kbd>J</Kbd>
          <Kbd>K</Kbd> to move
        </span>
      </div>
      {open.length === 0 && triaging && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}
      {open.length === 0 && !triaging && (
        <p className="px-2 text-sm text-muted-foreground">
          No open cases. Alerts below the score threshold stay in the triage queue.
        </p>
      )}
      <ul className="space-y-1" aria-label="Open cases">
        {open.map((c) => (
          <li key={c.id}>
            <CaseListItem item={c} selected={c.id === selected} onSelect={select} />
          </li>
        ))}
      </ul>
      {decided.length > 0 && (
        <>
          <h2 className="px-2 pt-2 text-sm font-semibold text-muted-foreground">Decided</h2>
          <ul className="space-y-1 opacity-80" aria-label="Decided cases">
            {decided.map((c) => (
              <li key={c.id}>
                <CaseListItem item={c} selected={c.id === selected} onSelect={select} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
