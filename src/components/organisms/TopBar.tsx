import { Moon, Search, Sun } from 'lucide-react';
import { Kbd } from '@/components/atoms/Kbd';
import { Button } from '@/components/ui/button';
import { viewLabel } from '@/lib/navigation';
import { useUiStore } from '@/stores/useUiStore';
import { ActorSwitcher } from './ActorSwitcher';

export function TopBar() {
  const view = useUiStore((s) => s.view);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const isDark = theme === 'dark';
  return (
    <header className="no-print sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-black/5 bg-background/70 px-6 backdrop-blur-xl dark:border-white/10">
      <p className="text-sm font-medium">{viewLabel(view)}</p>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden gap-2 text-muted-foreground sm:flex"
          onClick={() => setCommandOpen(true)}
          aria-label="Search (⌘K)"
        >
          <Search className="size-3.5" /> Search <Kbd>⌘K</Kbd>
        </Button>
        <ActorSwitcher />
        <Button
          variant="ghost"
          size="icon"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </div>
    </header>
  );
}
