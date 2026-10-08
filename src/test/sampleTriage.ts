import { alertIdFor } from '@/domain/ids';
import { monthlyAggregates } from '@/domain/rules/aggregates';
import { DEFAULT_ENABLED_RULES, DEFAULT_RULE_CONFIG } from '@/domain/rules/defaultConfig';
import { runRules } from '@/domain/rules/runRules';
import type { TriageInput } from '@/domain/triage/TriageProvider';
import { buildDataset, sampleSourceInputs } from '@/services/ingest';

/** Triage inputs for every alert raised on the bundled files. */
export async function sampleTriageInputs(): Promise<TriageInput[]> {
  const ds = await buildDataset(sampleSourceInputs());
  const hits = runRules(ds.clients, ds.transactions, DEFAULT_RULE_CONFIG, DEFAULT_ENABLED_RULES);
  return hits.map((hit) => {
    const transactions = ds.transactions.filter((t) => t.clientId === hit.clientId);
    return {
      alertId: alertIdFor(hit.ruleId, hit.clientId, hit.evidenceTxIds),
      hit,
      client: ds.clients.find((c) => c.clientId === hit.clientId)!,
      clientHits: hits.filter((h) => h.clientId === hit.clientId),
      transactions,
      monthly: monthlyAggregates(hit.clientId, transactions),
    };
  });
}
