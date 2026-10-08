import { CheckCircle2, XCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Amount } from '@/components/atoms/Amount';
import { useDataStore } from '@/stores/useDataStore';
import { EMPTY_ARRAY } from '@/stores/selectors/empty';

export function ReconciliationTable() {
  const rows = useDataStore((s) => s.ingestReport?.reconciliation.statements ?? EMPTY_ARRAY);
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No statements loaded.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Statement</TableHead>
          <TableHead className="text-right">Opening</TableHead>
          <TableHead className="text-right">Σ entries</TableHead>
          <TableHead className="text-right">Closing</TableHead>
          <TableHead className="text-right">Check</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.statementId}>
            <TableCell className="font-mono text-xs">{r.statementId}</TableCell>
            <TableCell className="text-right">
              <Amount value={r.opening} />
            </TableCell>
            <TableCell className="text-right">
              <Amount value={r.sumEntries} />
            </TableCell>
            <TableCell className="text-right">
              <Amount value={r.closing} />
            </TableCell>
            <TableCell className="text-right">
              {r.ok ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" aria-hidden /> Reconciled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-red-700 dark:text-red-400">
                  <XCircle className="size-3.5" aria-hidden /> Off by{' '}
                  <Amount value={r.difference} />
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
