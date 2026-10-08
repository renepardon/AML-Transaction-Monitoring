import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TransactionRow } from '@/components/molecules/TransactionRow';
import { useCase, useCaseTimeline } from '@/stores/selectors/cases';
import { EMPTY_ARRAY } from '@/stores/selectors/empty';
import { useDataStore } from '@/stores/useDataStore';
import { useUiStore } from '@/stores/useUiStore';

export interface TransactionTimelineProps {
  caseId: string;
}

export function TransactionTimeline({ caseId }: TransactionTimelineProps) {
  const rows = useCaseTimeline(caseId);
  const c = useCase(caseId);
  const expected = useDataStore((s) =>
    c ? (s.clients[c.clientId]?.expectedCountries ?? EMPTY_ARRAY) : EMPTY_ARRAY,
  );
  const evidenceOnly = useUiStore((s) => s.timelineEvidenceOnly);
  const setEvidenceOnly = useUiStore((s) => s.setTimelineEvidenceOnly);
  const visible = evidenceOnly ? rows.filter((r) => r.evidence) : rows;
  const evidenceCount = rows.filter((r) => r.evidence).length;
  return (
    <Card className="rounded-2xl border-black/5 shadow-none dark:border-white/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">
          Transactions{' '}
          <span className="tabular text-muted-foreground">
            {evidenceCount} evidence / {rows.length}
          </span>
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={evidenceOnly}
          onClick={() => setEvidenceOnly(!evidenceOnly)}
        >
          {evidenceOnly ? 'Show all' : 'Evidence only'}
        </Button>
      </CardHeader>
      <CardContent className="max-h-[28rem] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Counterparty</TableHead>
              <TableHead>Ctry</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Flag</TableHead>
              <TableHead>Ref</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((r) => (
              <TransactionRow
                key={r.tx.id}
                tx={r.tx}
                evidence={r.evidence}
                link={r.link}
                expectedCountries={expected as string[]}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
