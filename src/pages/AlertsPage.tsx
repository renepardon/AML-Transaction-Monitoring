import { PageTemplate } from '@/components/templates/PageTemplate';
import { AlertQueueTable } from '@/components/organisms/AlertQueueTable';
import { AlertActionDialog } from '@/components/organisms/AlertActionDialog';
import { TriageProgressBar } from '@/components/organisms/TriageProgressBar';
import { AiLabel } from '@/components/atoms/AiLabel';

export function AlertsPage() {
  return (
    <PageTemplate
      title="Alert triage queue"
      description="Every alert raised by the rules, including scores below the case threshold. Dismiss or promote with a reason."
      actions={<AiLabel />}
    >
      <TriageProgressBar />
      <AlertQueueTable />
      <AlertActionDialog />
    </PageTemplate>
  );
}
