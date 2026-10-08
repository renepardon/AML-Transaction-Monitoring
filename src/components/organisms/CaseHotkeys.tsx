import { useMemo } from 'react';
import { isDecided } from '@/domain/cases/types';
import { useHotkeys } from '@/lib/keyboard';
import { useCaseNavigationOrder } from '@/stores/selectors/cases';
import { useCaseStore } from '@/stores/useCaseStore';
import { useUiStore } from '@/stores/useUiStore';

/** J/K move through the case list, E escalates, C closes (both open the reason dialog). */
export function CaseHotkeys() {
  const order = useCaseNavigationOrder();
  const dialogOpen = useUiStore((s) => s.dialog !== null || s.commandOpen);
  const map = useMemo(() => {
    const ui = () => useUiStore.getState();
    const move = (delta: number) => {
      if (order.length === 0) return;
      const i = order.indexOf(ui().selectedCaseId ?? '');
      const next = order[Math.min(order.length - 1, Math.max(0, i < 0 ? 0 : i + delta))];
      if (next) ui().selectCase(next);
    };
    const decide = (decision: 'close' | 'escalate') => {
      const id = ui().selectedCaseId;
      const c = id ? useCaseStore.getState().cases[id] : undefined;
      if (c && !isDecided(c.status)) ui().openDialog({ kind: 'decision', caseId: c.id, decision });
    };
    return {
      j: () => move(1),
      k: () => move(-1),
      e: () => decide('escalate'),
      c: () => decide('close'),
    };
  }, [order]);
  useHotkeys(map, !dialogOpen);
  return null;
}
