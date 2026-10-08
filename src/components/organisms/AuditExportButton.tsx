import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadText } from '@/lib/download';
import { auditToCsv } from '@/stores/selectors/audit';
import { useAuditStore } from '@/stores/useAuditStore';

export function AuditExportButton() {
  const count = useAuditStore((s) => s.entries.length);
  const exportCsv = () =>
    downloadText('aml-audit-log.csv', auditToCsv(useAuditStore.getState().entries), 'text/csv');
  return (
    <Button variant="outline" size="sm" onClick={exportCsv} disabled={count === 0}>
      <Download className="size-4" /> Export CSV
    </Button>
  );
}
