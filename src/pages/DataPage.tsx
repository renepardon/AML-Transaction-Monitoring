import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTemplate } from '@/components/templates/PageTemplate';
import { ResetDemoButton } from '@/components/organisms/ResetDemoButton';
import { ResetDemoDialog } from '@/components/organisms/ResetDemoDialog';
import { IngestPanel } from '@/components/organisms/IngestPanel';
import { IngestSummary } from '@/components/organisms/IngestSummary';
import { ReconciliationTable } from '@/components/organisms/ReconciliationTable';

export function DataPage() {
  return (
    <PageTemplate
      title="Data"
      description="Loaded sources, ingest report and balance reconciliation per statement."
      actions={<ResetDemoButton />}
    >
      <IngestSummary />
      <Card className="rounded-2xl border-black/5 shadow-none dark:border-white/10">
        <CardHeader>
          <CardTitle className="text-base">Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <IngestPanel />
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-black/5 shadow-none dark:border-white/10">
        <CardHeader>
          <CardTitle className="text-base">Balance reconciliation</CardTitle>
        </CardHeader>
        <CardContent>
          <ReconciliationTable />
        </CardContent>
      </Card>
      <ResetDemoDialog />
    </PageTemplate>
  );
}
