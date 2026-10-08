import { SYSTEM_ACTOR } from '@/domain/actors';
import { useAlertStore } from '@/stores/useAlertStore';
import { useAuditStore } from '@/stores/useAuditStore';
import { useCaseStore } from '@/stores/useCaseStore';
import { useDataStore } from '@/stores/useDataStore';
import { useReportStore } from '@/stores/useReportStore';
import { useRuleConfigStore } from '@/stores/useRuleConfigStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { useUiStore } from '@/stores/useUiStore';
import { audit, currentActor } from './audit';
import { bootstrap } from './pipeline';
import { waitForDrafts } from './reporting';

/** Switches the acting analyst (needed to demonstrate four-eyes approval). */
export async function switchActor(actorId: string): Promise<void> {
  const previous = useSessionStore.getState().currentActor;
  if (previous.id === actorId) return;
  const next = useSessionStore.getState().switchActor(actorId);
  await audit(
    'actor.switched',
    { type: 'session', id: next.id },
    {
      actor: next,
      reason: `Switched from ${previous.name} to ${next.name}`,
      before: { actor: previous.id },
      after: { actor: next.id },
    },
  );
}

/**
 * "Reset demo": writes a final audit entry, clears every store and starts a new audit chain
 * anchored on the last hash, then reloads the sample data.
 */
export async function resetDemo(): Promise<void> {
  const actor = currentActor();
  await audit(
    'demo.reset',
    { type: 'demo', id: 'all' },
    {
      actor,
      reason: 'Demo reset: all cases, alerts, reports and settings cleared',
      before: {
        cases: Object.keys(useCaseStore.getState().cases).length,
        alerts: Object.keys(useAlertStore.getState().alerts).length,
        reports: Object.keys(useReportStore.getState().drafts).length,
        auditEntries: useAuditStore.getState().entries.length,
      },
    },
  );
  useReportStore.getState().resetReports();
  await waitForDrafts();
  useAlertStore.getState().resetAlerts();
  useCaseStore.getState().resetCases();
  useRuleConfigStore.getState().resetDefaults();
  useSessionStore.getState().resetSession();
  useUiStore.getState().resetUi();
  useAuditStore.getState().startNewChain();
  useDataStore.getState().reset();
  await audit(
    'demo.reset',
    { type: 'demo', id: 'new-chain' },
    { actor: SYSTEM_ACTOR, reason: 'New audit chain started after demo reset' },
  );
  await bootstrap();
}
