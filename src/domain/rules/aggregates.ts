import { monthKey } from '../dates';
import type { MonthlyAggregate, Transaction } from '../types';

/** Inflow/outflow per calendar month. `months` adds zero rows for months without activity. */
export function monthlyAggregates(
  clientId: string,
  transactions: Transaction[],
  months: string[] = [],
): MonthlyAggregate[] {
  const map = new Map<string, MonthlyAggregate>();
  for (const m of months) map.set(m, { clientId, month: m, inflow: 0, outflow: 0, txCount: 0 });
  for (const tx of transactions) {
    if (tx.clientId !== clientId) continue;
    const m = monthKey(tx.bookingDate);
    const agg = map.get(m) ?? { clientId, month: m, inflow: 0, outflow: 0, txCount: 0 };
    if (tx.direction === 'CRDT') agg.inflow += tx.amount;
    else agg.outflow += tx.amount;
    agg.txCount += 1;
    map.set(m, agg);
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export function monthBounds(month: string): { from: string; to: string } {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(y ?? 1970, m ?? 1, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
}
