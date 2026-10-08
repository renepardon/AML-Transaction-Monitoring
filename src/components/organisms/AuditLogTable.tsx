import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ActorAvatar } from '@/components/atoms/ActorAvatar';
import { Timestamp } from '@/components/atoms/Timestamp';
import { shortHash } from '@/lib/format';
import { useFilteredAuditEntries } from '@/stores/selectors/audit';
import { useUiStore } from '@/stores/useUiStore';

export function AuditLogTable() {
  const entries = useFilteredAuditEntries();
  const filter = useUiStore((s) => s.auditFilter);
  const setFilter = useUiStore((s) => s.setAuditFilter);
  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" aria-hidden />
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by action, actor, entity, reason"
          aria-label="Filter audit log"
          className="pl-8"
        />
      </div>
      {entries.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No audit entries{filter ? ' match the filter' : ' yet'}.
        </p>
      ) : (
        <ScrollArea className="h-[60vh] rounded-xl border border-black/5 dark:border-white/10">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead className="w-14">#</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="tabular text-xs text-muted-foreground">{e.seq}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    <Timestamp iso={e.at} />
                  </TableCell>
                  <TableCell>
                    <ActorAvatar actor={e.actor} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{e.action}</TableCell>
                  <TableCell className="text-xs">
                    {e.entity.type} · <span className="font-mono">{e.entity.id}</span>
                  </TableCell>
                  <TableCell className="max-w-xs text-xs whitespace-normal text-muted-foreground">
                    {e.reason ?? '–'}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground" title={e.hash}>
                    {shortHash(e.hash, 8)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </div>
  );
}
