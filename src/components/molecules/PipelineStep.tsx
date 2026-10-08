import { Bot, Check, Cpu, Loader2, UserRound } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { PipelineStage } from '@/stores/selectors/overview';

export interface PipelineStepProps {
  stage: PipelineStage;
}

const KIND_ICON = { system: Cpu, ai: Bot, human: UserRound } as const;
const KIND_LABEL = { system: 'System step', ai: 'AI step', human: 'Human task' } as const;
const STATUS_LABEL = {
  idle: 'Not started',
  running: 'In progress',
  done: 'Done',
  waiting: 'Waiting for analyst',
} as const;

export function PipelineStep({ stage }: PipelineStepProps) {
  const KindIcon = KIND_ICON[stage.kind];
  return (
    <li
      className={cn(
        'flex min-w-0 flex-col gap-1 rounded-xl border p-3 transition-colors duration-200',
        stage.kind === 'ai' && 'border-primary/25 bg-primary/[0.04]',
        stage.kind === 'human' && 'border-dashed border-black/15 dark:border-white/20',
        stage.kind === 'system' && 'border-black/5 dark:border-white/10',
      )}
      aria-label={`Stage ${stage.index} ${stage.name}: ${STATUS_LABEL[stage.status]}, ${stage.detail}`}
    >
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="tabular text-[11px]">{stage.index}</span>
        <KindIcon className="size-3.5" aria-label={KIND_LABEL[stage.kind]} />
      </div>
      <p className="truncate text-sm font-medium">{stage.name}</p>
      <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
        {stage.status === 'running' && (
          <Loader2 className="size-3 animate-spin text-primary" aria-hidden />
        )}
        {stage.status === 'done' && <Check className="size-3 text-emerald-600" aria-hidden />}
        {stage.status === 'waiting' && (
          <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
        )}
        {stage.detail}
      </p>
    </li>
  );
}
