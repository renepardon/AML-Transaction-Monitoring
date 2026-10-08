import { FileText } from 'lucide-react';
import { StatusPill } from '@/components/atoms/StatusPill';
import { cn } from '@/lib/cn';
import { formatAge } from '@/lib/format';
import { useReportList } from '@/stores/selectors/reports';
import { useUiStore } from '@/stores/useUiStore';

export function ReportList() {
  const reports = useReportList();
  const selected = useUiStore((s) => s.selectedReportId);
  const select = useUiStore((s) => s.selectReport);
  return (
    <div className="space-y-2 p-3">
      <h2 className="px-2 pt-2 text-sm font-semibold">
        Report drafts <span className="tabular text-muted-foreground">{reports.length}</span>
      </h2>
      {reports.length === 0 && (
        <p className="px-2 text-sm text-muted-foreground">
          No drafts yet. Escalating a case requests a draft automatically.
        </p>
      )}
      <ul className="space-y-1" aria-label="Report drafts">
        {reports.map((r) => (
          <li key={r.caseId}>
            <button
              type="button"
              onClick={() => select(r.caseId)}
              aria-current={selected === r.caseId ? 'true' : undefined}
              className={cn(
                'flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                selected === r.caseId
                  ? 'bg-primary/8 ring-1 ring-primary/20'
                  : 'hover:bg-black/[0.03] dark:hover:bg-white/5',
              )}
            >
              <FileText className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1 space-y-1">
                <span className="block truncate text-sm font-medium">{r.clientName}</span>
                <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <StatusPill status={r.status} /> v{r.version} · {formatAge(r.updatedAt)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
