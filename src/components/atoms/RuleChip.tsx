import { RULE_META, type RuleId } from '@/domain/rules/types';
import { cn } from '@/lib/cn';

export interface RuleChipProps {
  ruleId: RuleId;
  compact?: boolean;
  className?: string;
}

export function RuleChip({ ruleId, compact = false, className }: RuleChipProps) {
  const meta = RULE_META[ruleId];
  return (
    <span
      title={`${meta.short} ${meta.name}: ${meta.description}`}
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-black/5 bg-black/[0.03] px-1.5 py-0.5 text-[11px] font-medium text-foreground/80 dark:border-white/10 dark:bg-white/5',
        className,
      )}
    >
      <span className="font-semibold">{meta.short}</span>
      {!compact && <span>{meta.name}</span>}
    </span>
  );
}
