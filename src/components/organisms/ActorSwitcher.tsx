import { ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ActorAvatar } from '@/components/atoms/ActorAvatar';
import { runAction } from '@/lib/notify';
import { switchActor } from '@/services/session';
import { useSessionStore } from '@/stores/useSessionStore';

export function ActorSwitcher() {
  const actors = useSessionStore((s) => s.actors);
  const current = useSessionStore((s) => s.currentActor);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Acting as ${current.name}. Switch analyst`}
          className="gap-2"
        >
          <ActorAvatar actor={current} />
          <span className="hidden text-xs text-muted-foreground sm:inline">{current.role}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Act as (demo of the four-eyes principle)
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actors.map((a) => (
          <DropdownMenuItem
            key={a.id}
            onSelect={() => void runAction(() => switchActor(a.id), `Now acting as ${a.name}`)}
          >
            <ActorAvatar actor={a} />
            <span className="ml-auto text-xs text-muted-foreground">{a.role}</span>
            {a.id === current.id && <Check className="size-4" aria-label="current" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
