import { FileCode2, FileSpreadsheet, FileX2 } from 'lucide-react';
import { formatBytes, shortHash } from '@/lib/format';
import type { SourceFile } from '@/services/ingest';

export interface SourceFileRowProps {
  source: SourceFile;
}

export function SourceFileRow({ source }: SourceFileRowProps) {
  const Icon =
    source.status === 'rejected' ? FileX2 : source.kind === 'camt053' ? FileCode2 : FileSpreadsheet;
  return (
    <li className="flex items-center gap-3 py-3">
      <Icon
        className={
          source.status === 'rejected' ? 'size-5 text-red-600' : 'size-5 text-muted-foreground'
        }
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{source.name}</p>
        <p className="text-xs text-muted-foreground">
          {source.status === 'rejected'
            ? `Rejected: ${source.error ?? 'unknown reason'}`
            : `${source.kind === 'camt053' ? 'camt.053 statement' : 'Client profiles'} · ${source.records} records`}
        </p>
      </div>
      <div className="text-right text-xs text-muted-foreground">
        <p className="tabular">{formatBytes(source.size)}</p>
        <p className="font-mono" title={source.sha256}>
          sha256 {shortHash(source.sha256)}
        </p>
      </div>
    </li>
  );
}
