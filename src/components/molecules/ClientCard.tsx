import { RiskScoreBadge } from '@/components/atoms/RiskScoreBadge';
import { StatusPill } from '@/components/atoms/StatusPill';
import { cn } from '@/lib/cn';
import { formatChfRounded, formatMonth } from '@/lib/format';
import type { ClientCardView } from '@/stores/selectors/clients';

export interface ClientCardProps {
  view: ClientCardView;
  topScore: number | null;
  onOpen: (clientId: string) => void;
}

/** Sparkline: monthly inflow bars against the dashed expected-inflow line. */
function Sparkline({ view }: { view: ClientCardView }) {
  const expected = view.client.expectedMonthlyInflow;
  const max = Math.max(expected, ...view.monthly.map((m) => m.inflow), 1);
  const w = 120;
  const h = 36;
  const barW = w / Math.max(1, view.monthly.length) - 6;
  const y = (v: number) => h - (v / max) * (h - 2);
  return (
    <svg
      width={w}
      height={h}
      role="img"
      aria-label={`Inflow per month vs expected ${formatChfRounded(expected)}: ${view.monthly.map((m) => `${formatMonth(m.month)} ${formatChfRounded(m.inflow)}`).join(', ')}`}
    >
      {view.monthly.map((m, i) => (
        <rect
          key={m.month}
          x={i * (barW + 6) + 3}
          y={y(m.inflow)}
          width={barW}
          height={h - y(m.inflow)}
          rx={3}
          className={m.inflow > 3 * expected ? 'fill-risk-high' : 'fill-chart-2'}
        />
      ))}
      <line
        x1={0}
        x2={w}
        y1={y(expected)}
        y2={y(expected)}
        className="stroke-primary"
        strokeDasharray="4 3"
        strokeWidth={1.5}
      />
    </svg>
  );
}

export function ClientCard({ view, topScore, onOpen }: ClientCardProps) {
  const { client } = view;
  return (
    <button
      type="button"
      onClick={() => onOpen(client.clientId)}
      className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-card p-5 text-left transition-colors duration-150 hover:bg-black/[0.02] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:border-white/10 dark:hover:bg-white/5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{client.name}</p>
          <p className="truncate text-xs text-muted-foreground">{client.occupation}</p>
        </div>
        {topScore !== null && <RiskScoreBadge score={topScore} />}
      </div>
      <Sparkline view={view} />
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className={cn(client.riskCategory === 'elevated' && 'font-medium text-risk-high')}>
          Risk: {client.riskCategoryLabel}
        </span>
        <span>· {view.alertCount} alert(s)</span>
        <span>· peak {view.maxRatio.toFixed(1)}× profile</span>
        {view.caseStatus && <StatusPill status={view.caseStatus} />}
      </div>
    </button>
  );
}
