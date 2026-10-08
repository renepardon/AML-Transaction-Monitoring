import { useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SourceFileRow } from '@/components/molecules/SourceFileRow';
import { cn } from '@/lib/cn';
import { uploadFiles } from '@/services/pipeline';
import { useDataStore } from '@/stores/useDataStore';

export function IngestPanel() {
  const sources = useDataStore((s) => s.sources);
  const status = useDataStore((s) => s.status);
  const error = useDataStore((s) => s.error);
  // Purely visual drag-over highlight; no domain data.
  const [dragging, setDragging] = useState(false);

  const onFiles = (list: FileList | null) => {
    if (list && list.length > 0) void uploadFiles(Array.from(list));
  };

  return (
    <div className="space-y-4">
      {status === 'loading' && <Skeleton className="h-40 w-full rounded-xl" />}
      {status === 'error' && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {status === 'ready' && sources.length === 0 && (
        <p className="text-sm text-muted-foreground">No files loaded.</p>
      )}
      {sources.length > 0 && status !== 'loading' && (
        <ul className="divide-y divide-black/5 dark:divide-white/10">
          {sources.map((s) => (
            <SourceFileRow key={`${s.name}-${s.sha256}`} source={s} />
          ))}
        </ul>
      )}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-black/10 p-6 text-center text-sm text-muted-foreground transition-colors duration-200 hover:bg-muted/50 dark:border-white/15 no-print',
          dragging && 'border-primary bg-primary/5',
        )}
      >
        <UploadCloud className="size-6" aria-hidden />
        <span>
          Drop camt.053 <code>.xml</code> and <code>client_profiles.csv</code> files here, or click
          to choose.
        </span>
        <span className="text-xs">
          Up to 10 files, 5 MB each. Uploaded files replace the current dataset.
        </span>
        <input
          type="file"
          multiple
          accept=".xml,.csv"
          className="sr-only"
          aria-label="Upload statement or profile files"
          onChange={(e) => onFiles(e.target.files)}
        />
      </label>
    </div>
  );
}
