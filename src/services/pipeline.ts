import { AI_ACTOR, SYSTEM_ACTOR, type Actor } from '@/domain/actors';
import { groupAlertsIntoCases, type CaseGroup } from '@/domain/cases/groupAlerts';
import { alertIdFor } from '@/domain/ids';
import { monthlyAggregates } from '@/domain/rules/aggregates';
import { runRules } from '@/domain/rules/runRules';
import { RULE_IDS } from '@/domain/rules/types';
import type { TriageInput } from '@/domain/triage/TriageProvider';
import type { Dataset } from '@/services/ingest';
import { useAlertStore, type AlertRecord } from '@/stores/useAlertStore';
import { useCaseStore } from '@/stores/useCaseStore';
import { useDataStore } from '@/stores/useDataStore';
import { useRuleConfigStore } from '@/stores/useRuleConfigStore';
import { audit } from './audit';
import { resumeDrafts } from './reporting';
import { getTriageProvider } from './triageProvider';

export const TRIAGE_CONCURRENCY = 2;

async function auditLoad(ds: Dataset | null, origin: 'sample' | 'upload'): Promise<void> {
  if (!ds) {
    await audit(
      'data.load_failed',
      { type: 'dataset', id: origin },
      {
        actor: SYSTEM_ACTOR,
        reason: useDataStore.getState().error ?? 'unknown error',
      },
    );
    return;
  }
  await audit(
    'data.loaded',
    { type: 'dataset', id: origin },
    {
      actor: SYSTEM_ACTOR,
      reason: `${ds.report.files} file(s), ${ds.report.transactions} transactions, ${ds.report.clients} clients`,
      after: {
        sources: ds.sources.map((s) => ({
          name: s.name,
          size: s.size,
          sha256: s.sha256,
          status: s.status,
        })),
        reconciled: ds.report.reconciliation.allOk,
        warnings: ds.report.warnings.length,
      },
    },
  );
}

/** Alert ids referenced by cases must survive a re-run, so decisions keep their evidence. */
function keepAlertIds(): string[] {
  return Object.values(useCaseStore.getState().cases).flatMap((c) => c.alertIds);
}

/** Stage 2 – Detect: deterministic rules raise alerts with stable ids. */
export async function runDetection(): Promise<{ added: string[]; removed: string[] }> {
  const { clients, transactions } = useDataStore.getState();
  const { config, enabledRules } = useRuleConfigStore.getState();
  const hits = runRules(Object.values(clients), Object.values(transactions), config, enabledRules);
  const records = hits.map((hit) => ({
    id: alertIdFor(hit.ruleId, hit.clientId, hit.evidenceTxIds),
    hit,
  }));
  const result = useAlertStore.getState().setAlerts(records, keepAlertIds());
  await audit(
    'rules.run',
    { type: 'rules', id: 'R1-R5' },
    {
      actor: SYSTEM_ACTOR,
      reason: `${hits.length} rule hit(s), ${result.added.length} new alert(s)`,
      after: {
        enabledRules: RULE_IDS.filter((r) => enabledRules[r]),
        hits: hits.length,
        removed: result.removed,
      },
    },
  );
  for (const id of result.added) {
    const alert = useAlertStore.getState().alerts[id]!;
    await audit(
      'alert.raised',
      { type: 'alert', id },
      {
        actor: SYSTEM_ACTOR,
        reason: `${alert.hit.ruleId} · ${alert.hit.clientId}: ${alert.hit.summary}`,
      },
    );
  }
  return result;
}

export function buildTriageInput(alert: AlertRecord): TriageInput | null {
  const { clients, transactions } = useDataStore.getState();
  const client = clients[alert.hit.clientId];
  if (!client) return null;
  const clientTx = Object.values(transactions)
    .filter((t) => t.clientId === client.clientId)
    .sort((a, b) => a.bookingDate.localeCompare(b.bookingDate));
  const clientHits = Object.values(useAlertStore.getState().alerts)
    .filter((a) => a.hit.clientId === client.clientId)
    .map((a) => a.hit);
  return {
    alertId: alert.id,
    hit: alert.hit,
    client,
    clientHits,
    transactions: clientTx,
    monthly: monthlyAggregates(client.clientId, clientTx),
  };
}

async function triageOne(alert: AlertRecord): Promise<void> {
  const store = useAlertStore.getState();
  const input = buildTriageInput(alert);
  if (!input) return;
  store.setTriage(alert.id, { status: 'running' });
  try {
    const result = await getTriageProvider().triage(input);
    useAlertStore.getState().setTriage(alert.id, { status: 'done', result });
    await audit(
      'triage.completed',
      { type: 'alert', id: alert.id },
      {
        actor: AI_ACTOR,
        reason: `Score ${result.score}/5 – ${result.recommendedAction === 'open_case' ? 'open case' : 'close suggested'}`,
        after: { score: result.score, model: result.model, latencyMs: result.latencyMs },
      },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Triage failed';
    useAlertStore.getState().setTriage(alert.id, { status: 'error', error: message });
    await audit(
      'triage.failed',
      { type: 'alert', id: alert.id },
      { actor: AI_ACTOR, reason: message },
    );
  }
}

/** Stage 3 – Triage: explain and score each pending alert, two at a time. */
export async function runTriage(): Promise<void> {
  const queue = Object.values(useAlertStore.getState().alerts).filter(
    (a) => !a.dismissal && (a.triageStatus === 'pending' || a.triageStatus === 'error'),
  );
  const worker = async () => {
    for (let next = queue.shift(); next; next = queue.shift()) await triageOne(next);
  };
  await Promise.all(Array.from({ length: TRIAGE_CONCURRENCY }, worker));
}

/** Opens or updates cases for the given groups and audits the result. */
export async function applyCaseGroups(
  groups: CaseGroup[],
  actor: Actor = SYSTEM_ACTOR,
): Promise<void> {
  const { opened, updated } = useCaseStore.getState().openCasesFromAlerts(groups);
  for (const id of opened) {
    const c = useCaseStore.getState().cases[id]!;
    await audit(
      'case.opened',
      { type: 'case', id },
      {
        actor,
        reason: `${c.alertIds.length} alert(s) for ${c.clientId}, score ${c.score}/5`,
        after: { alertIds: c.alertIds, score: c.score },
      },
    );
  }
  for (const id of updated) {
    const c = useCaseStore.getState().cases[id]!;
    await audit(
      'case.updated',
      { type: 'case', id },
      {
        actor,
        reason: `Alerts merged, now ${c.alertIds.length}, score ${c.score}/5`,
        after: { alertIds: c.alertIds, score: c.score },
      },
    );
  }
}

/** Stage 4 – Open case: alerts with score ≥ threshold (or promoted) grouped per client. */
export async function openCases(): Promise<void> {
  const threshold = useRuleConfigStore.getState().config.caseScoreThreshold;
  const scored = Object.values(useAlertStore.getState().alerts)
    .filter((a) => !a.dismissal && a.triageStatus === 'done' && a.triage)
    .map((a) => ({
      id: a.id,
      clientId: a.hit.clientId,
      score: a.triage!.score,
      promoted: Boolean(a.promotedAt),
    }));
  await applyCaseGroups(groupAlertsIntoCases(scored, threshold));
}

let running: Promise<void> | null = null;

/** ingest → detect → triage → open cases. Idempotent: same data + config gives the same alert ids. */
export function runPipeline(): Promise<void> {
  if (running) return running;
  running = (async () => {
    if (useDataStore.getState().status !== 'ready') return;
    await runDetection();
    await runTriage();
    await openCases();
  })().finally(() => {
    running = null;
  });
  return running;
}

/** Loads the bundled sample files on first start, then runs the pipeline. Safe to call repeatedly. */
export async function bootstrap(): Promise<void> {
  if (useDataStore.getState().status !== 'idle') return;
  const ds = await useDataStore.getState().loadSampleData();
  await auditLoad(ds, 'sample');
  await runPipeline();
  resumeDrafts();
}

export async function uploadFiles(files: File[]): Promise<void> {
  const ds = await useDataStore.getState().loadFiles(files);
  await auditLoad(ds, 'upload');
  await runPipeline();
}
