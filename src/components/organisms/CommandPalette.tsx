import { Moon, Play, Sun } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { ScoreRing } from '@/components/atoms/ScoreRing';
import { NAV_ITEMS } from '@/lib/navigation';
import { runAction } from '@/lib/notify';
import { rerunDetection } from '@/services/settings';
import { useCaseNavigationOrder } from '@/stores/selectors/cases';
import { useCaseStore } from '@/stores/useCaseStore';
import { useDataStore } from '@/stores/useDataStore';
import { useUiStore } from '@/stores/useUiStore';

export function CommandPalette() {
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);
  const navigate = useUiStore((s) => s.navigate);
  const selectCase = useUiStore((s) => s.selectCase);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const caseIds = useCaseNavigationOrder();
  const cases = useCaseStore((s) => s.cases);
  const clients = useDataStore((s) => s.clients);

  const openCase = (id: string) => {
    selectCase(id);
    navigate('cases');
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command palette"
      description="Navigate or open a case by client name"
    >
      <CommandInput placeholder="Type a page or a client name…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Cases">
          {caseIds.map((id) => {
            const c = cases[id];
            if (!c) return null;
            const name = clients[c.clientId]?.name ?? c.clientId;
            return (
              <CommandItem
                key={id}
                value={`case ${name} ${c.clientId}`}
                onSelect={() => openCase(id)}
              >
                <ScoreRing score={c.score} size={22} />
                {name}
                <CommandShortcut>{c.clientId}</CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Go to">
          {NAV_ITEMS.map(({ view, label, icon: Icon }) => (
            <CommandItem key={view} value={`go ${label}`} onSelect={() => navigate(view)}>
              <Icon /> {label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem
            value="re-run detection"
            onSelect={() => {
              setOpen(false);
              void runAction(rerunDetection, 'Detection re-run');
            }}
          >
            <Play /> Re-run detection
          </CommandItem>
          <CommandItem
            value="toggle theme dark light"
            onSelect={() => {
              setTheme(theme === 'dark' ? 'light' : 'dark');
              setOpen(false);
            }}
          >
            {theme === 'dark' ? <Sun /> : <Moon />} Toggle dark mode
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
