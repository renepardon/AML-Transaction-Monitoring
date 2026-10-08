import { monthKey } from '../dates';
import type { ClientProfile, Transaction } from '../types';
import { monthlyAggregates } from './aggregates';
import { passThrough } from './passThrough';
import { profileDeviation } from './profileDeviation';
import { purposeMismatch } from './purposeMismatch';
import { riskCountry } from './riskCountry';
import { structuring } from './structuring';
import type { Rule, RuleConfig, RuleHit, RuleId } from './types';

export const RULES: Record<RuleId, Rule> = {
  R1_STRUCTURING: structuring,
  R2_PASS_THROUGH: passThrough,
  R3_PROFILE_DEVIATION: profileDeviation,
  R4_RISK_COUNTRY: riskCountry,
  R5_PURPOSE_MISMATCH: purposeMismatch,
};

/** Runs every enabled rule for every client. Pure and deterministic. */
export function runRules(
  clients: ClientProfile[],
  transactions: Transaction[],
  config: RuleConfig,
  enabled: Record<RuleId, boolean>,
): RuleHit[] {
  const months = [...new Set(transactions.map((t) => monthKey(t.bookingDate)))].sort();
  const hits: RuleHit[] = [];
  for (const client of clients) {
    const clientTx = transactions
      .filter((t) => t.clientId === client.clientId)
      .sort((a, b) => a.bookingDate.localeCompare(b.bookingDate) || a.id.localeCompare(b.id));
    const ctx = {
      client,
      transactions: clientTx,
      monthlyAggregates: monthlyAggregates(client.clientId, clientTx, months),
      config,
    };
    for (const [id, rule] of Object.entries(RULES) as [RuleId, Rule][]) {
      if (enabled[id]) hits.push(...rule(ctx));
    }
  }
  return hits;
}
