import { MaskedIban } from '@/components/atoms/MaskedIban';
import { ScoreRing } from '@/components/atoms/ScoreRing';
import { StatusPill } from '@/components/atoms/StatusPill';
import { useCase } from '@/stores/selectors/cases';
import { useDataStore } from '@/stores/useDataStore';

export interface CaseHeaderProps {
  caseId: string;
}

export function CaseHeader({ caseId }: CaseHeaderProps) {
  const c = useCase(caseId);
  const client = useDataStore((s) => (c ? s.clients[c.clientId] : undefined));
  if (!c) return null;
  return (
    <div className="flex flex-wrap items-center gap-4">
      <ScoreRing score={c.score} size={56} />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-semibold tracking-tight">
          {client?.name ?? c.clientId}
        </h1>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>{client?.clientType}</span>
          {client && (
            <span>
              {client.occupation}
              {client.age ? `, ${client.age}` : ''}
            </span>
          )}
          {client && (
            <span
              className={client.riskCategory === 'elevated' ? 'font-medium text-risk-high' : ''}
            >
              Risk category: {client.riskCategoryLabel}
            </span>
          )}
          {client && <MaskedIban iban={client.iban} className="text-xs" />}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <StatusPill status={c.status} />
        <span className="font-mono text-[11px] text-muted-foreground">{c.id}</span>
      </div>
    </div>
  );
}
