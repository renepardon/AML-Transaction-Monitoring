import { CaseListItem } from '@/components/molecules/CaseListItem';
import { useOpenCasesSortedByScore } from '@/stores/selectors/cases';
import { useUiStore } from '@/stores/useUiStore';

export function TopCases() {
  const cases = useOpenCasesSortedByScore().slice(0, 3);
  const selectCase = useUiStore((s) => s.selectCase);
  const navigate = useUiStore((s) => s.navigate);
  const open = (id: string) => {
    selectCase(id);
    navigate('cases');
  };
  return (
    <section aria-labelledby="top-cases-title" className="space-y-3">
      <h2 id="top-cases-title" className="text-sm font-semibold">
        Top cases
      </h2>
      {cases.length === 0 ? (
        <p className="text-sm text-muted-foreground">No open cases.</p>
      ) : (
        <ul className="grid gap-2 md:grid-cols-3">
          {cases.map((c) => (
            <li
              key={c.id}
              className="rounded-2xl border border-black/5 bg-card dark:border-white/10"
            >
              <CaseListItem item={c} selected={false} onSelect={open} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
