import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { RuleId } from '@/domain/rules/types';
import { devtoolsOptions, persistOptions } from './persistConfig';

export type View =
  'overview' | 'cases' | 'alerts' | 'clients' | 'reports' | 'audit' | 'data' | 'settings';
export type Theme = 'light' | 'dark' | 'system';

export type DialogState =
  | { kind: 'decision'; caseId: string; decision: 'close' | 'escalate' | 'reopen' }
  | { kind: 'alert'; alertId: string; action: 'dismiss' | 'promote' }
  | { kind: 'review'; caseId: string; action: 'approve' | 'reject' }
  | { kind: 'reset' };

export interface AlertFilters {
  rules: RuleId[];
  scores: number[];
  showDismissed: boolean;
}

interface UiState {
  view: View;
  selectedCaseId: string | null;
  selectedClientId: string | null;
  selectedReportId: string | null;
  alertFilters: AlertFilters;
  auditFilter: string;
  timelineEvidenceOnly: boolean;
  dialog: DialogState | null;
  /** Form drafts keyed by purpose, e.g. `decision:CASE-C1002` or `note:CASE-C1002`. */
  drafts: Record<string, string>;
  theme: Theme;
  commandOpen: boolean;
  navigate: (view: View) => void;
  selectCase: (id: string | null) => void;
  selectClient: (id: string | null) => void;
  selectReport: (id: string | null) => void;
  setAlertFilters: (patch: Partial<AlertFilters>) => void;
  setAuditFilter: (value: string) => void;
  setTimelineEvidenceOnly: (value: boolean) => void;
  openDialog: (dialog: DialogState) => void;
  closeDialog: () => void;
  setDraft: (key: string, value: string) => void;
  clearDraft: (key: string) => void;
  setTheme: (theme: Theme) => void;
  setCommandOpen: (open: boolean) => void;
  resetUi: () => void;
}

const initial = {
  view: 'overview' as View,
  selectedCaseId: null,
  selectedClientId: null,
  selectedReportId: null,
  alertFilters: { rules: [], scores: [], showDismissed: false },
  auditFilter: '',
  timelineEvidenceOnly: false,
  dialog: null,
  drafts: {},
  theme: 'system' as Theme,
  commandOpen: false,
};

export const useUiStore = create<UiState>()(
  devtools(
    persist(
      (set) => ({
        ...initial,
        navigate: (view) => set({ view, commandOpen: false }),
        selectCase: (selectedCaseId) => set({ selectedCaseId }),
        selectClient: (selectedClientId) => set({ selectedClientId }),
        selectReport: (selectedReportId) => set({ selectedReportId }),
        setAlertFilters: (patch) => set((s) => ({ alertFilters: { ...s.alertFilters, ...patch } })),
        setAuditFilter: (auditFilter) => set({ auditFilter }),
        setTimelineEvidenceOnly: (timelineEvidenceOnly) => set({ timelineEvidenceOnly }),
        openDialog: (dialog) => set({ dialog }),
        closeDialog: () => set({ dialog: null }),
        setDraft: (key, value) => set((s) => ({ drafts: { ...s.drafts, [key]: value } })),
        clearDraft: (key) =>
          set((s) => {
            const { [key]: _removed, ...rest } = s.drafts;
            return { drafts: rest };
          }),
        setTheme: (theme) => set({ theme }),
        setCommandOpen: (commandOpen) => set({ commandOpen }),
        resetUi: () => set({ ...initial }),
      }),
      persistOptions<UiState, Pick<UiState, 'theme' | 'view'>>('ui', 1, {
        partialize: (s) => ({ theme: s.theme, view: s.view }),
      }),
    ),
    devtoolsOptions('ui'),
  ),
);
