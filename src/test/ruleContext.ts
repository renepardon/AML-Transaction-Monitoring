import { DEFAULT_RULE_CONFIG } from '@/domain/rules/defaultConfig';
import { monthlyAggregates } from '@/domain/rules/aggregates';
import type { RuleConfig, RuleContext } from '@/domain/rules/types';
import type { ClientProfile, Transaction } from '@/domain/types';
import { buildClient } from './builders';

export function ruleContext(
  transactions: Transaction[],
  client: ClientProfile = buildClient(),
  config: RuleConfig = DEFAULT_RULE_CONFIG,
): RuleContext {
  const sorted = [...transactions].sort((a, b) => a.bookingDate.localeCompare(b.bookingDate));
  return {
    client,
    transactions: sorted,
    monthlyAggregates: monthlyAggregates(client.clientId, sorted),
    config,
  };
}
