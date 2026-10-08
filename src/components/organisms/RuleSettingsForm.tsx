import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NumberSetting } from '@/components/molecules/NumberSetting';
import { RULE_META } from '@/domain/rules/types';
import { RULE_SECTIONS } from '@/lib/ruleFields';
import { runAction } from '@/lib/notify';
import { changeCaseScoreThreshold, changeRuleThreshold, toggleRule } from '@/services/settings';
import { useRuleConfigStore } from '@/stores/useRuleConfigStore';
import { useUiStore } from '@/stores/useUiStore';

export function RuleSettingsForm() {
  const config = useRuleConfigStore((s) => s.config);
  const enabled = useRuleConfigStore((s) => s.enabledRules);
  const drafts = useUiStore((s) => s.drafts);
  const setDraft = useUiStore((s) => s.setDraft);
  const clearDraft = useUiStore((s) => s.clearDraft);

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-black/5 shadow-none dark:border-white/10">
        <CardHeader>
          <CardTitle className="text-base">Case opening</CardTitle>
          <CardDescription>
            Alerts with a triage score at or above this value are grouped into a case.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NumberSetting
            id="cfg-case-threshold"
            label="Case-open score threshold (1–5)"
            value={config.caseScoreThreshold}
            draft={drafts['cfg:caseScoreThreshold']}
            step={1}
            onDraft={(v) => setDraft('cfg:caseScoreThreshold', v)}
            onCommit={(v) =>
              void runAction(() => changeCaseScoreThreshold(v)).then(() =>
                clearDraft('cfg:caseScoreThreshold'),
              )
            }
          />
        </CardContent>
      </Card>
      {RULE_SECTIONS.map(({ ruleId, section, fields }) => {
        const values = config[section] as unknown as Record<string, number>;
        return (
          <Card
            key={ruleId}
            className="rounded-2xl border-black/5 shadow-none dark:border-white/10"
          >
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="text-base">
                  {RULE_META[ruleId].short} · {RULE_META[ruleId].name}
                </CardTitle>
                <CardDescription>{RULE_META[ruleId].description}</CardDescription>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--primary)]"
                  checked={enabled[ruleId]}
                  onChange={(e) => void runAction(() => toggleRule(ruleId, e.target.checked))}
                />
                Enabled
              </label>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fields.map((f) => {
                const key = `cfg:${section}.${f.key}`;
                return (
                  <NumberSetting
                    key={f.key}
                    id={key}
                    label={f.label}
                    unit={f.unit}
                    step={f.step}
                    value={values[f.key] ?? 0}
                    draft={drafts[key]}
                    disabled={!enabled[ruleId]}
                    onDraft={(v) => setDraft(key, v)}
                    onCommit={(v) =>
                      void runAction(() => changeRuleThreshold(section, f.key, v)).then(() =>
                        clearDraft(key),
                      )
                    }
                  />
                );
              })}
              {section === 'purposeMismatch' && (
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Keywords: {config.purposeMismatch.keywords.join(', ')}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
