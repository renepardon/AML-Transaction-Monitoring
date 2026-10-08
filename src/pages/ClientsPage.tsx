import { PageTemplate } from '@/components/templates/PageTemplate';
import { ClientDetailSheet } from '@/components/organisms/ClientDetailSheet';
import { ClientGrid } from '@/components/organisms/ClientGrid';

export function ClientsPage() {
  return (
    <PageTemplate
      title="Clients"
      description="Profile vs actual activity. Bars show monthly inflow; the dashed line is the expected inflow."
    >
      <ClientGrid />
      <ClientDetailSheet />
    </PageTemplate>
  );
}
