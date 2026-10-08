import { daysBetween } from '../dates';
import { chf, formatChfRounded } from '../money';
import type { Rule, RuleHit } from './types';

const unique = (xs: string[]) => [...new Set(xs.filter(Boolean))];

/** R2: a large credit followed within N days by debits that sum to ≥ minOutRatio of it. */
export const passThrough: Rule = ({ client, transactions, config }) => {
  const c = config.passThrough;
  const minCredit = Math.max(chf(c.minCreditChf), c.inflowMultiple * client.expectedMonthlyInflow);
  const hits: RuleHit[] = [];

  for (const credit of transactions) {
    if (credit.direction !== 'CRDT' || credit.amount < minCredit) continue;
    const candidates = transactions
      .filter((d) => {
        if (d.direction !== 'DBIT') return false;
        const days = daysBetween(credit.bookingDate, d.bookingDate);
        return days >= 0 && days <= c.windowDays;
      })
      .sort((a, b) => b.amount - a.amount || a.bookingDate.localeCompare(b.bookingDate));

    // Take the largest debits first until the outflow covers the required share.
    const selected = [];
    let out = 0;
    for (const d of candidates) {
      if (out >= c.minOutRatio * credit.amount) break;
      selected.push(d);
      out += d.amount;
    }
    if (out < c.minOutRatio * credit.amount) continue;

    selected.sort((a, b) => a.bookingDate.localeCompare(b.bookingDate));
    const ratio = out / credit.amount;
    const days = Math.max(...selected.map((d) => daysBetween(credit.bookingDate, d.bookingDate)));
    const last = selected[selected.length - 1]!;
    const outNames = unique(selected.map((d) => d.counterparty.name));
    const outCountries = unique(selected.map((d) => d.counterparty.country ?? ''));
    hits.push({
      ruleId: 'R2_PASS_THROUGH',
      clientId: client.clientId,
      severity: ratio >= c.highRatio || days <= c.highDays ? 'high' : 'medium',
      title: 'Money in and out within days',
      summary:
        `${formatChfRounded(credit.amount)} from ${credit.counterparty.name} ` +
        `(${credit.counterparty.country ?? '–'}) on ${credit.bookingDate}; ` +
        `${(ratio * 100).toFixed(1)} % paid out to ${outNames.join(', ')} (${outCountries.join(', ')}) within ${days} day${days === 1 ? '' : 's'}.`,
      evidenceTxIds: [credit.id, ...selected.map((d) => d.id)],
      metrics: {
        credit: credit.amount,
        debits: out,
        ratio: Math.round(ratio * 1000) / 1000,
        daysBetween: days,
        inCounterparty: credit.counterparty.name,
        inCountry: credit.counterparty.country ?? '',
        outCounterparties: outNames.join(', '),
        outCountries: outCountries.join(', '),
      },
      period: { from: credit.bookingDate, to: last.bookingDate },
    });
  }
  return hits;
};
