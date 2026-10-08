import { daysBetween } from '../dates';
import { chf, formatChfRounded } from '../money';
import type { Transaction } from '../types';
import type { Rule, RuleHit } from './types';

/** R1: ≥ minCount cash deposits in [band × threshold, threshold) within any rolling window. */
export const structuring: Rule = ({ client, transactions, config }) => {
  const c = config.structuring;
  const threshold = chf(c.thresholdChf);
  const lower = Math.round(threshold * c.bandRatio);
  const deposits = transactions.filter(
    (t) => t.kind === 'cash_deposit' && t.amount >= lower && t.amount < threshold,
  );

  // Merge every qualifying rolling window into connected clusters (one hit per cluster).
  const clusters: Transaction[][] = [];
  let current: { start: number; end: number } | null = null;
  for (let i = 0; i < deposits.length; i++) {
    let end = i;
    while (
      end + 1 < deposits.length &&
      daysBetween(deposits[i]!.bookingDate, deposits[end + 1]!.bookingDate) < c.windowDays
    ) {
      end++;
    }
    if (end - i + 1 < c.minCount) continue;
    if (current && i <= current.end) current.end = Math.max(current.end, end);
    else {
      if (current) clusters.push(deposits.slice(current.start, current.end + 1));
      current = { start: i, end };
    }
  }
  if (current) clusters.push(deposits.slice(current.start, current.end + 1));

  return clusters.map((cluster): RuleHit => {
    const sum = cluster.reduce((s, t) => s + t.amount, 0);
    const amounts = cluster.map((t) => t.amount);
    const from = cluster[0]!.bookingDate;
    const to = cluster[cluster.length - 1]!.bookingDate;
    const high = cluster.length >= c.highCount || sum > c.highSumMultiple * threshold;
    return {
      ruleId: 'R1_STRUCTURING',
      clientId: client.clientId,
      severity: high ? 'high' : 'medium',
      title: 'Cash just below identification threshold',
      summary:
        `${cluster.length} cash deposits between ${formatChfRounded(Math.min(...amounts))} and ` +
        `${formatChfRounded(Math.max(...amounts))} within ${daysBetween(from, to) + 1} days ` +
        `(Σ ${formatChfRounded(sum)}), each just below the ${formatChfRounded(threshold)} threshold.`,
      evidenceTxIds: cluster.map((t) => t.id),
      metrics: {
        count: cluster.length,
        sum,
        min: Math.min(...amounts),
        max: Math.max(...amounts),
        threshold,
        spanDays: daysBetween(from, to) + 1,
      },
      period: { from, to },
    };
  });
};
