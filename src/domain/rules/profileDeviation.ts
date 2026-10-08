import { chf, formatChfRounded } from '../money';
import { formatMonth } from '../dates';
import type { Rule, RuleHit } from './types';
import { monthBounds } from './aggregates';

const ratioOf = (actual: number, expected: number) =>
  expected > 0 ? actual / expected : actual > 0 ? Number.POSITIVE_INFINITY : 0;

/** R3: per month, inflow or outflow > multiple × expected and absolute excess ≥ minExcess. */
export const profileDeviation: Rule = ({ client, transactions, monthlyAggregates, config }) => {
  const c = config.profileDeviation;
  const minExcess = chf(c.minExcessChf);
  const hits: RuleHit[] = [];

  for (const agg of monthlyAggregates) {
    const inRatio = ratioOf(agg.inflow, client.expectedMonthlyInflow);
    const outRatio = ratioOf(agg.outflow, client.expectedMonthlyOutflow);
    const inHit = inRatio > c.multiple && agg.inflow - client.expectedMonthlyInflow >= minExcess;
    const outHit =
      outRatio > c.multiple && agg.outflow - client.expectedMonthlyOutflow >= minExcess;
    if (!inHit && !outHit) continue;

    const maxRatio = Math.max(inHit ? inRatio : 0, outHit ? outRatio : 0);
    const parts = [
      inHit &&
        `inflow ${formatChfRounded(agg.inflow)} = ${inRatio.toFixed(1)}× expected ${formatChfRounded(client.expectedMonthlyInflow)}`,
      outHit &&
        `outflow ${formatChfRounded(agg.outflow)} = ${outRatio.toFixed(1)}× expected ${formatChfRounded(client.expectedMonthlyOutflow)}`,
    ].filter(Boolean);
    const evidence = transactions.filter(
      (t) =>
        t.bookingDate.startsWith(agg.month) &&
        ((inHit && t.direction === 'CRDT') || (outHit && t.direction === 'DBIT')),
    );
    hits.push({
      ruleId: 'R3_PROFILE_DEVIATION',
      clientId: client.clientId,
      severity: maxRatio > c.highMultiple ? 'high' : 'medium',
      title: 'Sudden change from the usual profile',
      summary: `${formatMonth(agg.month)}: ${parts.join('; ')}.`,
      evidenceTxIds: evidence.map((t) => t.id),
      metrics: {
        month: agg.month,
        direction: inHit && outHit ? 'both' : inHit ? 'inflow' : 'outflow',
        inflow: agg.inflow,
        outflow: agg.outflow,
        expectedInflow: client.expectedMonthlyInflow,
        expectedOutflow: client.expectedMonthlyOutflow,
        inflowRatio: Math.round(inRatio * 100) / 100,
        outflowRatio: Math.round(outRatio * 100) / 100,
        maxRatio: Math.round(maxRatio * 100) / 100,
      },
      period: monthBounds(agg.month),
    });
  }
  return hits;
};
