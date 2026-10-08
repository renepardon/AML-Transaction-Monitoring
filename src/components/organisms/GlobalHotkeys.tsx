import { useMemo } from 'react';
import { useHotkeys } from '@/lib/keyboard';
import { useUiStore } from '@/stores/useUiStore';

/** ⌘K / Ctrl+K toggles the command palette from anywhere. */
export function GlobalHotkeys() {
  const map = useMemo(
    () => ({
      'mod+k': () => {
        const ui = useUiStore.getState();
        ui.setCommandOpen(!ui.commandOpen);
      },
    }),
    [],
  );
  useHotkeys(map);
  return null;
}
