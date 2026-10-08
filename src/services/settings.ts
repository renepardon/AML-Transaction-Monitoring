import type { RuleConfig, RuleId } from '@/domain/rules/types';
import { RULE_META } from '@/domain/rules/types';
import { DomainError } from '@/domain/errors';
import { useRuleConfigStore } from '@/stores/useRuleConfigStore';
import { audit } from './audit';
import { runPipeline } from './pipeline';

type Section = Exclude<keyof RuleConfig, 'caseScoreThreshold'>;

/** Changes one numeric threshold and audits before/after. */
export async function changeRuleThreshold(
  section: Section,
  key: string,
  value: number,
): Promise<void> {
  if (!Number.isFinite(value) || value < 0)
    throw new DomainError('VALIDATION_ERROR', 'Thresholds must be non-negative numbers');
  const before = (useRuleConfigStore.getState().config[section] as Record<string, unknown>)[key];
  if (before === value) return;
  useRuleConfigStore
    .getState()
    .updateRule(section, { [key]: value } as Partial<RuleConfig[Section]>);
  await audit(
    'config.changed',
    { type: 'config', id: `${section}.${key}` },
    { reason: `${section}.${key}: ${String(before)} → ${value}`, before, after: value },
  );
}

export async function changeCaseScoreThreshold(value: number): Promise<void> {
  const before = useRuleConfigStore.getState().config.caseScoreThreshold;
  useRuleConfigStore.getState().setCaseScoreThreshold(value);
  const after = useRuleConfigStore.getState().config.caseScoreThreshold;
  if (before !== after)
    await audit(
      'config.changed',
      { type: 'config', id: 'caseScoreThreshold' },
      { reason: `Case-open score threshold: ${before} → ${after}`, before, after },
    );
}

export async function toggleRule(ruleId: RuleId, enabled: boolean): Promise<void> {
  useRuleConfigStore.getState().setEnabled(ruleId, enabled);
  await audit(
    'config.changed',
    { type: 'config', id: ruleId },
    {
      reason: `${RULE_META[ruleId].short} ${RULE_META[ruleId].name} ${enabled ? 'enabled' : 'disabled'}`,
      before: !enabled,
      after: enabled,
    },
  );
}

export async function resetRuleConfig(): Promise<void> {
  const before = useRuleConfigStore.getState().config;
  useRuleConfigStore.getState().resetDefaults();
  await audit(
    'config.changed',
    { type: 'config', id: 'all' },
    {
      reason: 'Rule configuration reset to defaults',
      before,
      after: useRuleConfigStore.getState().config,
    },
  );
}

/** Re-runs detection, triage and case opening; existing decisions are kept for unchanged alerts. */
export async function rerunDetection(): Promise<void> {
  await runPipeline();
}
