import { useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MaskedIban } from '@/components/atoms/MaskedIban';
import { TransactionRow } from '@/components/molecules/TransactionRow';
import { formatChfRounded } from '@/lib/format';
import { useDataStore } from '@/stores/useDataStore';
import { useUiStore } from '@/stores/useUiStore';

export function ClientDetailSheet() {
  const clientId = useUiStore((s) => s.selectedClientId);
  const selectClient = useUiStore((s) => s.selectClient);
  const client = useDataStore((s) => (clientId ? s.clients[clientId] : undefined));
  const transactions = useDataStore((s) => s.transactions);
  const rows = useMemo(
    () =>
      Object.values(transactions)
        .filter((t) => t.clientId === clientId)
        .sort((a, b) => b.bookingDate.localeCompare(a.bookingDate)),
    [transactions, clientId],
  );
  return (
    <Sheet open={Boolean(client)} onOpenChange={(open) => !open && selectClient(null)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
        {client && (
          <>
            <SheetHeader>
              <SheetTitle>{client.name}</SheetTitle>
              <SheetDescription>
                {client.clientType} · {client.occupation}
                {client.age ? ` · ${client.age}` : ''} · risk {client.riskCategoryLabel} ·{' '}
                <MaskedIban iban={client.iban} />
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 px-4 pb-6">
              <p className="text-sm text-muted-foreground">
                Expected per month: inflow {formatChfRounded(client.expectedMonthlyInflow)}, outflow{' '}
                {formatChfRounded(client.expectedMonthlyOutflow)}, countries{' '}
                {client.expectedCountries.join(', ')}.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Counterparty</TableHead>
                    <TableHead>Ctry</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead />
                    <TableHead>Ref</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((t) => (
                    <TransactionRow
                      key={t.id}
                      tx={t}
                      evidence={false}
                      expectedCountries={client.expectedCountries}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
