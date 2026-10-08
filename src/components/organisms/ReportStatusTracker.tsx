import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ReportStatus } from '@/stores/useReportStore';

const STEPS: { status: ReportStatus; label: string }[] = [
  { status: 'queued', label: 'Queued' },
  { status: 'generating', label: 'Generating' },
  { status: 'draft', label: 'Draft' },
  { status: 'in_review', label: 'In review' },
  { status: 'approved', label: 'Approved' },
];

export interface ReportStatusTrackerProps {
  status: ReportStatus;
}

export function ReportStatusTracker({ status }: ReportStatusTrackerProps) {
  const rejected = status === 'rejected';
  const current = rejected ? 3 : STEPS.findIndex((s) => s.status === status);
  return (
    <ol className="flex flex-wrap items-center gap-1.5" aria-label="Report status">
      {STEPS.map((step, i) => {
        const done = i < current || status === 'approved';
        const active = i === current;
        const label = rejected && i === 4 ? 'Rejected' : step.label;
        return (
          <li
            key={step.status}
            className="flex items-center gap-1.5"
            aria-current={active ? 'step' : undefined}
          >
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors duration-200',
                done && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
                active && !done && 'bg-primary/10 text-primary',
                rejected && i === 4 && 'bg-red-500/10 text-red-700 dark:text-red-400',
                !done &&
                  !active &&
                  !(rejected && i === 4) &&
                  'bg-black/5 text-muted-foreground dark:bg-white/10',
              )}
            >
              {done && <Check className="size-3" aria-hidden />}
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="h-px w-3 bg-black/10 dark:bg-white/15" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
