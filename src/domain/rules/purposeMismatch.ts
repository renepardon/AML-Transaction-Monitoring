import { chf, formatChfRounded } from '../money';
import { matchKeywords } from '../reference/keywords';
import type { Rule, RuleHit } from './types';

const normalizeName = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

/** R5: purpose or counterparty matches a keyword list, or own-account transfer abroad. */
export const purposeMismatch: Rule = ({ client, transactions, config }) => {
  const c = config.purposeMismatch;
  const min = chf(c.minChf);
  const hits: RuleHit[] = [];
  for (const tx of transactions) {
    if (tx.amount < min) continue;
    const keywords = matchKeywords(`${tx.remittance} ${tx.counterparty.name}`, c.keywords);
    const ownAccountAbroad =
      normalizeName(tx.counterparty.name) === normalizeName(client.name) &&
      tx.counterparty.country !== null &&
      tx.counterparty.country !== 'CH';
    if (keywords.length === 0 && !ownAccountAbroad) continue;

    const reasons = [
      keywords.length > 0 && `keywords: ${keywords.join(', ')}`,
      ownAccountAbroad && `own-account transfer abroad (${tx.counterparty.country})`,
    ].filter(Boolean);
    hits.push({
      ruleId: 'R5_PURPOSE_MISMATCH',
      clientId: client.clientId,
      severity: 'medium',
      title: 'Purpose or counterparty does not fit the profile',
      summary:
        `${formatChfRounded(tx.amount)} ${tx.direction === 'CRDT' ? 'from' : 'to'} ${tx.counterparty.name}, ` +
        `purpose "${tx.remittance}" (${reasons.join('; ')}) – profile: ${client.occupation}.`,
      evidenceTxIds: [tx.id],
      metrics: {
        amount: tx.amount,
        keywords: keywords.join(', '),
        ownAccountAbroad: ownAccountAbroad ? 'yes' : 'no',
        purpose: tx.remittance,
        counterparty: tx.counterparty.name,
      },
      period: { from: tx.bookingDate, to: tx.bookingDate },
    });
  }
  return hits;
};
