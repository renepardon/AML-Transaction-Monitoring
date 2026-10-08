import { PageTemplate } from '@/components/templates/PageTemplate';
import { DataIntegrityStatus } from '@/components/organisms/DataIntegrityStatus';
import { OverviewKpis } from '@/components/organisms/OverviewKpis';
import { PipelineStrip } from '@/components/organisms/PipelineStrip';
import { TopCases } from '@/components/organisms/TopCases';

export function OverviewPage() {
  return (
    <PageTemplate
      title="Overview"
      description="Suspicious activity detection for Bank Zürichsee · July to September 2026"
      actions={<DataIntegrityStatus />}
    >
      <OverviewKpis />
      <PipelineStrip />
      <TopCases />
    </PageTemplate>
  );
}
