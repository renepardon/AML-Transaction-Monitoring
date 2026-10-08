import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { IntegrityBadge } from '@/components/molecules/IntegrityBadge';
import { useDataStore } from '@/stores/useDataStore';

export function IngestSummary() {
  const report = useDataStore((s) => s.ingestReport);
  if (!report) return null;
  const facts = [
    ['Files', report.files],
    ['Statements', report.statements],
    ['Transactions', report.transactions],
    ['Clients', report.clients],
    ['Duplicates skipped', report.duplicates.length],
  ] as const;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        {facts.map(([label, value]) => (
          <span key={label} className="text-muted-foreground">
            {label} <span className="tabular font-medium text-foreground">{value}</span>
          </span>
        ))}
        <IntegrityBadge
          ok={report.reconciliation.allOk && report.warnings.length === 0}
          className="ml-auto"
        />
      </div>
      {report.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertTitle>{report.warnings.length} ingest warning(s)</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {report.warnings.map((w, i) => (
                <li key={i}>
                  {w.source ? `${w.source}: ` : ''}
                  {w.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
