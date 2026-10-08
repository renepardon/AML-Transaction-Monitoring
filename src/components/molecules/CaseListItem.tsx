import { RuleChip } from '@/components/atoms/RuleChip';
import { ScoreRing } from '@/components/atoms/ScoreRing';
import { StatusPill } from '@/components/atoms/StatusPill';
import { cn } from '@/lib/cn';
import { formatAge } from '@/lib/format';
import type { CaseListView } from '@/stores/selectors/cases';

export interface CaseListItemProps {
  item: CaseListView;
  selected: boolean;
  onSelect: (id: string) => void;
  now?: Date;
}

export function CaseListItem({ item, selected, onSelect, now }: CaseListItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      aria-current={selected ? 'true' : undefined}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        selected
          ? 'bg-primary/8 ring-1 ring-primary/20'
          : 'hover:bg-black/[0.03] dark:hover:bg-white/5',
      )}
    >
      <ScoreRing score={item.score} size={38} />
      <span className="min-w-0 flex-1 space-y-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">{item.clientName}</span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {formatAge(item.openedAt, now)}
          </span>
        </span>
        <span className="flex flex-wrap gap-1">
          {item.ruleIds.map((r) => (
            <RuleChip key={r} ruleId={r} compact />
          ))}
        </span>
        <StatusPill status={item.status} />
      </span>
    </button>
  );
}
