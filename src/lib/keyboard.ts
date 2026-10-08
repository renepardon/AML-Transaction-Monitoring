import { useEffect } from 'react';

export type HotkeyMap = Record<string, (e: KeyboardEvent) => void>;

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** Normalises an event to keys like "j", "shift+e" or "mod+k" (mod = ⌘ on macOS, Ctrl elsewhere). */
export function keyOf(e: KeyboardEvent): string {
  const parts = [];
  if (e.metaKey || e.ctrlKey) parts.push('mod');
  if (e.shiftKey && e.key.length > 1) parts.push('shift');
  parts.push(e.key.toLowerCase());
  return parts.join('+');
}

/** Global hotkeys. Plain keys are ignored while typing or when `enabled` is false; "mod+" keys always fire. */
export function useHotkeys(map: HotkeyMap, enabled = true): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = keyOf(e);
      const fn = map[key];
      if (!fn) return;
      if (!key.startsWith('mod+') && (!enabled || isTyping(e.target))) return;
      e.preventDefault();
      fn(e);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [map, enabled]);
}
