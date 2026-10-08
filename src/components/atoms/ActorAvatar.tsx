import { Bot, Cpu, UserRound } from 'lucide-react';
import type { Actor } from '@/domain/actors';
import { cn } from '@/lib/cn';

export interface ActorAvatarProps {
  actor: Actor;
  showName?: boolean;
  className?: string;
}

const ICONS = { ai: Bot, system: Cpu, analyst: UserRound } as const;
const KIND_LABEL = { ai: 'AI', system: 'System', analyst: 'Analyst' } as const;

export function ActorAvatar({ actor, showName = true, className }: ActorAvatarProps) {
  const Icon = ICONS[actor.kind];
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-full',
          actor.kind === 'ai' && 'bg-primary/10 text-primary',
          actor.kind === 'system' && 'bg-black/5 text-muted-foreground dark:bg-white/10',
          actor.kind === 'analyst' && 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
        )}
        title={`${KIND_LABEL[actor.kind]}: ${actor.name}`}
      >
        <Icon className="size-3.5" aria-label={KIND_LABEL[actor.kind]} />
      </span>
      {showName && <span className="truncate text-sm">{actor.name}</span>}
    </span>
  );
}
