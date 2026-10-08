import { chf, formatChfRounded } from '../money';
import { countryRiskTier, COUNTRY_TIER_LABEL } from '../reference/countryRisk';
import type { Rule, RuleHit, Severity } from './types';

/** R4: counterparty in a risk-tier country, or outside the expected countries above a minimum amount. */
export const riskCountry: Rule = ({ client, transactions, config }) => {
  const minUnexpected = chf(config.riskCountry.unexpectedMinChf);
  const hits: RuleHit[] = [];
  for (const tx of transactions) {
    const cc = tx.counterparty.country;
    if (!cc) continue;
    const tier = countryRiskTier(cc);
    const listed = tier !== 'standard';
    const unexpected = !client.expectedCountries.includes(cc) && tx.amount >= minUnexpected;
    if (!listed && !unexpected) continue;

    const severity: Severity =
      tier === 'fatf_blacklist' || tier === 'fatf_greylist' ? 'high' : 'medium';
    const reasons = [
      listed && COUNTRY_TIER_LABEL[tier],
      unexpected && `not in expected countries (${client.expectedCountries.join(', ')})`,
    ].filter(Boolean);
    hits.push({
      ruleId: 'R4_RISK_COUNTRY',
      clientId: client.clientId,
      severity,
      title:
        tx.direction === 'CRDT' ? 'Transfer from a risk country' : 'Transfer to a risk country',
      summary:
        `${formatChfRounded(tx.amount)} ${tx.direction === 'CRDT' ? 'from' : 'to'} ${tx.counterparty.name} (${cc}) ` +
        `on ${tx.bookingDate}: ${reasons.join('; ')}.`,
      evidenceTxIds: [tx.id],
      metrics: {
        country: cc,
        tier,
        unexpected: unexpected ? 'yes' : 'no',
        amount: tx.amount,
        direction: tx.direction,
        counterparty: tx.counterparty.name,
      },
      period: { from: tx.bookingDate, to: tx.bookingDate },
    });
  }
  return hits;
};
