import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { RULE_IDS, RULE_META, type RuleId } from '@/domain/rules/types';
import { useUiStore } from '@/stores/useUiStore';

export function AlertFilterBar() {
  const filters = useUiStore((s) => s.alertFilters);
  const setFilters = useUiStore((s) => s.setAlertFilters);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ToggleGroup
        type="multiple"
        variant="outline"
        size="sm"
        value={filters.rules}
        onValueChange={(v) => setFilters({ rules: v as RuleId[] })}
        aria-label="Filter by rule"
      >
        {RULE_IDS.map((r) => (
          <ToggleGroupItem
            key={r}
            value={r}
            aria-label={`${RULE_META[r].short} ${RULE_META[r].name}`}
            className="px-2.5 text-xs"
          >
            {RULE_META[r].short}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <ToggleGroup
        type="multiple"
        variant="outline"
        size="sm"
        value={filters.scores.map(String)}
        onValueChange={(v) => setFilters({ scores: v.map(Number) })}
        aria-label="Filter by score"
      >
        {[1, 2, 3, 4, 5].map((s) => (
          <ToggleGroupItem
            key={s}
            value={String(s)}
            aria-label={`Score ${s}`}
            className="px-2.5 text-xs"
          >
            {s}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={filters.showDismissed}
        onClick={() => setFilters({ showDismissed: !filters.showDismissed })}
      >
        {filters.showDismissed ? 'Hide dismissed' : 'Show dismissed'}
      </Button>
    </div>
  );
}
