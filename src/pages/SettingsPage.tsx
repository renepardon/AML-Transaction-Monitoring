import { PageTemplate } from '@/components/templates/PageTemplate';
import { RuleSettingsForm } from '@/components/organisms/RuleSettingsForm';
import { SettingsActions } from '@/components/organisms/SettingsActions';
import { ThresholdReference } from '@/components/organisms/ThresholdReference';

export function SettingsPage() {
  return (
    <PageTemplate
      title="Settings"
      description="Rule thresholds are tunable and every change is audited. Re-running keeps existing decisions for unchanged alerts."
      actions={<SettingsActions />}
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <RuleSettingsForm />
        <ThresholdReference />
      </div>
    </PageTemplate>
  );
}
