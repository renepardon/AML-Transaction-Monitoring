import { useMemo } from 'react';
import { ClientCard } from '@/components/molecules/ClientCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useClientCards } from '@/stores/selectors/clients';
import { useAlertStore } from '@/stores/useAlertStore';
import { useDataStore } from '@/stores/useDataStore';
import { useUiStore } from '@/stores/useUiStore';

export function ClientGrid() {
  const cards = useClientCards();
  const status = useDataStore((s) => s.status);
  const alerts = useAlertStore((s) => s.alerts);
  const selectClient = useUiStore((s) => s.selectClient);
  const topScores = useMemo(() => {
    const out: Record<string, number> = {};
    for (const a of Object.values(alerts)) {
      if (a.triage && !a.dismissal)
        out[a.hit.clientId] = Math.max(out[a.hit.clientId] ?? 0, a.triage.score);
    }
    return out;
  }, [alerts]);
  if (status !== 'ready') {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-44 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (cards.length === 0)
    return <p className="text-sm text-muted-foreground">No client profiles loaded.</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((v) => (
        <ClientCard
          key={v.client.clientId}
          view={v}
          topScore={topScores[v.client.clientId] ?? null}
          onOpen={selectClient}
        />
      ))}
    </div>
  );
}
