import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/cn';
import type { ReportSection } from '@/domain/reports/ReportDrafter';

export interface ReportSectionEditorProps {
  section: ReportSection;
  /** Current edit draft; undefined when not editing. */
  draft: string | undefined;
  editable: boolean;
  streaming: boolean;
  onEdit: () => void;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ReportSectionEditor({
  section,
  draft,
  editable,
  streaming,
  onEdit,
  onChange,
  onSave,
  onCancel,
}: ReportSectionEditorProps) {
  const editing = draft !== undefined;
  const id = `section-${section.id}`;
  return (
    <section aria-labelledby={`${id}-title`} className="group space-y-2 break-inside-avoid">
      <div className="flex items-center justify-between gap-2">
        <h3 id={`${id}-title`} className="text-sm font-semibold">
          {section.title}
        </h3>
        {editable && !editing && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 opacity-60 group-hover:opacity-100 no-print"
            onClick={onEdit}
            aria-label={`Edit ${section.title}`}
          >
            <Pencil className="size-3.5" /> Edit
          </Button>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <label htmlFor={id} className="sr-only">
            {section.title}
          </label>
          <Textarea
            id={id}
            value={draft}
            onChange={(e) => onChange(e.target.value)}
            rows={Math.min(16, Math.max(4, draft.split('\n').length + 1))}
            className="font-mono text-xs"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={onSave} disabled={draft === section.body}>
              Save section
            </Button>
          </div>
        </div>
      ) : (
        <p
          className={cn(
            'text-sm leading-relaxed whitespace-pre-wrap',
            section.body.includes('|') && 'font-mono text-xs',
            streaming && 'streaming-caret',
          )}
        >
          {section.body ||
            (streaming ? '' : <span className="text-muted-foreground">Waiting…</span>)}
        </p>
      )}
    </section>
  );
}
