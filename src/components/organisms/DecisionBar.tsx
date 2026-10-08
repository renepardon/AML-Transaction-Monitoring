import { CheckCircle2, RotateCcw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActorAvatar } from '@/components/atoms/ActorAvatar';
import { Kbd } from '@/components/atoms/Kbd';
import { isDecided } from '@/domain/cases/types';
import { useCase } from '@/stores/selectors/cases';
import { useSessionStore } from '@/stores/useSessionStore';
import { useUiStore } from '@/stores/useUiStore';

export interface DecisionBarProps {
  caseId: string;
}

export function DecisionBar({ caseId }: DecisionBarProps) {
  const c = useCase(caseId);
  const actor = useSessionStore((s) => s.currentActor);
  const openDialog = useUiStore((s) => s.openDialog);
  if (!c) return null;
  const decided = isDecided(c.status);
  return (
    <div className="sticky bottom-0 z-10 -mx-6 border-t border-black/5 bg-background/80 px-6 py-3 backdrop-blur-xl lg:-mx-10 lg:px-10 dark:border-white/10 no-print">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-muted-foreground">Deciding as</span>
        <ActorAvatar actor={actor} />
        {c.decision && (
          <span className="text-xs text-muted-foreground">
            {c.decision.type === 'escalated' ? 'Escalated' : 'Closed'} by {c.decision.actor.name}: “
            {c.decision.reason}”
          </span>
        )}
        <div className="ml-auto flex gap-2">
          {decided ? (
            <Button
              variant="outline"
              onClick={() => openDialog({ kind: 'decision', caseId, decision: 'reopen' })}
            >
              <RotateCcw className="size-4" /> Reopen
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() => openDialog({ kind: 'decision', caseId, decision: 'close' })}
              >
                <CheckCircle2 className="size-4" /> Close as false positive{' '}
                <Kbd className="ml-1">C</Kbd>
              </Button>
              <Button
                variant="destructive"
                onClick={() => openDialog({ kind: 'decision', caseId, decision: 'escalate' })}
              >
                <ShieldAlert className="size-4" /> Escalate{' '}
                <Kbd className="ml-1 border-white/20 bg-white/15 text-white">E</Kbd>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
