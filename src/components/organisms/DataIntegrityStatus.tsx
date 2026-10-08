import { IntegrityBadge } from '@/components/molecules/IntegrityBadge';
import { useDataStore } from '@/stores/useDataStore';
import { useUiStore } from '@/stores/useUiStore';

export function DataIntegrityStatus() {
  const report = useDataStore((s) => s.ingestReport);
  const navigate = useUiStore((s) => s.navigate);
  if (!report) return null;
  const ok = report.reconciliation.allOk && report.warnings.length === 0;
  return (
    <button
      type="button"
      onClick={() => navigate('data')}
      className="rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      aria-label="Open data integrity details"
    >
      <IntegrityBadge
        ok={ok}
        label={
          ok
            ? `Data integrity OK · ${report.statements} statements reconciled`
            : `${report.warnings.length} data warning(s)`
        }
      />
    </button>
  );
}
