import { cn } from '@/lib/cn';

export type PillStatus =
  | 'open'
  | 'in_review'
  | 'closed_false_positive'
  | 'escalated'
  | 'pending'
  | 'running'
  | 'done'
  | 'error'
  | 'dismissed'
  | 'idle'
  | 'queued'
  | 'generating'
  | 'draft'
  | 'approved'
  | 'rejected';

const META: Record<PillStatus, { label: string; tone: string }> = {
  open: { label: 'Open', tone: 'bg-primary/10 text-primary' },
  in_review: { label: 'In review', tone: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  closed_false_positive: {
    label: 'Closed · false positive',
    tone: 'bg-black/5 text-muted-foreground dark:bg-white/10',
  },
  escalated: { label: 'Escalated', tone: 'bg-red-500/10 text-red-700 dark:text-red-400' },
  pending: {
    label: 'Waiting for triage',
    tone: 'bg-black/5 text-muted-foreground dark:bg-white/10',
  },
  running: { label: 'Triage running', tone: 'bg-primary/10 text-primary' },
  done: { label: 'Triaged', tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  error: { label: 'Triage failed', tone: 'bg-red-500/10 text-red-700 dark:text-red-400' },
  dismissed: { label: 'Dismissed', tone: 'bg-black/5 text-muted-foreground dark:bg-white/10' },
  idle: { label: 'Not requested', tone: 'bg-black/5 text-muted-foreground dark:bg-white/10' },
  queued: { label: 'Queued', tone: 'bg-black/5 text-muted-foreground dark:bg-white/10' },
  generating: { label: 'Generating', tone: 'bg-primary/10 text-primary' },
  draft: { label: 'Draft', tone: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  approved: { label: 'Approved', tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  rejected: { label: 'Rejected', tone: 'bg-red-500/10 text-red-700 dark:text-red-400' },
};

export interface StatusPillProps {
  status: PillStatus;
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  const meta = META[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        meta.tone,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
