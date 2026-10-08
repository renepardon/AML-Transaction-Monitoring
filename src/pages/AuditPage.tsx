import { PageTemplate } from '@/components/templates/PageTemplate';
import { AuditExportButton } from '@/components/organisms/AuditExportButton';
import { AuditLogTable } from '@/components/organisms/AuditLogTable';
import { ChainStatus } from '@/components/organisms/ChainStatus';

export function AuditPage() {
  return (
    <PageTemplate
      title="Audit log"
      description="Append-only and hash-chained. Every step records who or what did it, when, and why."
      actions={
        <>
          <ChainStatus />
          <AuditExportButton />
        </>
      }
    >
      <AuditLogTable />
    </PageTemplate>
  );
}
