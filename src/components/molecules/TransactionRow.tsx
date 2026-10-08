import { TableCell, TableRow } from '@/components/ui/table';
import { Amount } from '@/components/atoms/Amount';
import { CountryTag } from '@/components/atoms/CountryTag';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import type { Transaction } from '@/domain/types';

export interface TransactionRowProps {
  tx: Transaction;
  evidence: boolean;
  expectedCountries: string[];
  link?: { group: string; role: 'in' | 'out' };
}

export function TransactionRow({ tx, evidence, expectedCountries, link }: TransactionRowProps) {
  return (
    <TableRow
      className={cn(evidence && 'bg-amber-500/[0.07] dark:bg-amber-400/10')}
      data-evidence={evidence || undefined}
    >
      <TableCell className="tabular text-xs whitespace-nowrap">
        {formatDate(tx.bookingDate)}
      </TableCell>
      <TableCell className="text-right">
        <Amount value={tx.amount} direction={tx.direction} />
      </TableCell>
      <TableCell className="max-w-48 truncate text-sm" title={tx.counterparty.name}>
        {tx.counterparty.name}
      </TableCell>
      <TableCell>
        <CountryTag
          code={tx.counterparty.country}
          expected={!tx.counterparty.country || expectedCountries.includes(tx.counterparty.country)}
        />
      </TableCell>
      <TableCell className="max-w-56 truncate text-xs text-muted-foreground" title={tx.remittance}>
        {tx.remittance || '–'}
      </TableCell>
      <TableCell className="text-xs whitespace-nowrap">
        {evidence && (
          <span className="font-medium text-amber-700 dark:text-amber-400">Evidence</span>
        )}
        {link && (
          <span
            className="ml-1 rounded bg-primary/10 px-1 font-mono text-[11px] text-primary"
            title={`Pass-through ${link.group}: money ${link.role}`}
          >
            {link.group} {link.role === 'in' ? '→ in' : 'out →'}
          </span>
        )}
      </TableCell>
      <TableCell className="font-mono text-[11px] text-muted-foreground">
        {tx.acctSvcrRef}
      </TableCell>
    </TableRow>
  );
}
