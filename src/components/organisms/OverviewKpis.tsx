import { ArrowUpRight, Briefcase, CreditCard, Landmark } from 'lucide-react';
import { KpiCard } from '@/components/molecules/KpiCard';
import { useOverviewKpis } from '@/stores/selectors/overview';

export function OverviewKpis() {
  const k = useOverviewKpis();
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        label="Accounts monitored"
        value={k.accounts}
        hint="camt.053, Jul–Sep 2026"
        icon={Landmark}
      />
      <KpiCard
        label="Transactions ingested"
        value={k.transactions}
        hint="Reconciled against balances"
        icon={CreditCard}
      />
      <KpiCard
        label="Open cases"
        value={k.openCases}
        hint="Score ≥ threshold, grouped per client"
        icon={Briefcase}
      />
      <KpiCard
        label="Escalated"
        value={k.escalated}
        hint="Report drafted for review"
        icon={ArrowUpRight}
      />
    </div>
  );
}
