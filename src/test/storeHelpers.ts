import { GENESIS_HASH } from '@/domain/audit/hashChain';
import { MockClaudeProvider } from '@/domain/triage/mockClaudeProvider';
import { setTriageProvider } from '@/services/triageProvider';
import { setReportDrafter } from '@/services/reporting';
import { MockReportDrafter } from '@/domain/reports/mockReportDrafter';
import { useReportStore } from '@/stores/useReportStore';
import { useAlertStore } from '@/stores/useAlertStore';
import { useAuditStore } from '@/stores/useAuditStore';
import { useCaseStore } from '@/stores/useCaseStore';
import { useDataStore } from '@/stores/useDataStore';
import { useRuleConfigStore } from '@/stores/useRuleConfigStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { useUiStore } from '@/stores/useUiStore';

/** Loads the bundled sample dataset into useDataStore (once per test file is enough). */
export async function loadSampleIntoStore(): Promise<void> {
  useDataStore.getState().reset();
  await useDataStore.getState().loadSampleData();
}

export function resetUi(): void {
  useUiStore.getState().resetUi();
  localStorage.clear();
}

/** Clears every store and installs an instant triage provider. */
export function resetAllStores(): void {
  setTriageProvider(new MockClaudeProvider({ latencyScale: 0 }));
  setReportDrafter(new MockReportDrafter({ chunkDelayMs: 0 }));
  useReportStore.getState().resetReports();
  useDataStore.getState().reset();
  useAlertStore.getState().resetAlerts();
  useCaseStore.getState().resetCases();
  useRuleConfigStore.getState().resetDefaults();
  useSessionStore.getState().resetSession();
  useAuditStore.setState({
    entries: [],
    anchorHash: GENESIS_HASH,
    verification: { status: 'idle' },
  });
  useUiStore.getState().resetUi();
  localStorage.clear();
}
