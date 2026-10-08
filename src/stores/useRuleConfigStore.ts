import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { DEFAULT_ENABLED_RULES, DEFAULT_RULE_CONFIG } from '@/domain/rules/defaultConfig';
import type { RuleConfig, RuleId } from '@/domain/rules/types';
import { devtoolsOptions, persistOptions } from './persistConfig';

type Section = Exclude<keyof RuleConfig, 'caseScoreThreshold'>;

interface RuleConfigState {
  config: RuleConfig;
  enabledRules: Record<RuleId, boolean>;
  updateRule: <K extends Section>(section: K, patch: Partial<RuleConfig[K]>) => void;
  setCaseScoreThreshold: (value: number) => void;
  setEnabled: (ruleId: RuleId, enabled: boolean) => void;
  resetDefaults: () => void;
}

export const useRuleConfigStore = create<RuleConfigState>()(
  devtools(
    persist(
      (set) => ({
        config: DEFAULT_RULE_CONFIG,
        enabledRules: DEFAULT_ENABLED_RULES,
        updateRule: (section, patch) =>
          set((s) => ({ config: { ...s.config, [section]: { ...s.config[section], ...patch } } })),
        setCaseScoreThreshold: (value) =>
          set((s) => ({
            config: {
              ...s.config,
              caseScoreThreshold: Math.min(5, Math.max(1, Math.round(value))),
            },
          })),
        setEnabled: (ruleId, enabled) =>
          set((s) => ({ enabledRules: { ...s.enabledRules, [ruleId]: enabled } })),
        resetDefaults: () =>
          set({ config: DEFAULT_RULE_CONFIG, enabledRules: DEFAULT_ENABLED_RULES }),
      }),
      persistOptions<RuleConfigState, Pick<RuleConfigState, 'config' | 'enabledRules'>>(
        'rule-config',
        1,
        {
          partialize: (s) => ({ config: s.config, enabledRules: s.enabledRules }),
        },
      ),
    ),
    devtoolsOptions('rule-config'),
  ),
);
