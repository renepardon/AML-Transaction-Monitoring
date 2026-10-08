import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface NumberSettingProps {
  id: string;
  label: string;
  value: number;
  /** Uncommitted text while the field is being edited. */
  draft: string | undefined;
  step: number;
  unit?: string;
  disabled?: boolean;
  onDraft: (text: string) => void;
  onCommit: (value: number) => void;
}

export function NumberSetting({
  id,
  label,
  value,
  draft,
  step,
  unit,
  disabled,
  onDraft,
  onCommit,
}: NumberSettingProps) {
  const commit = () => {
    if (draft === undefined) return;
    const n = Number(draft);
    if (draft.trim() !== '' && Number.isFinite(n)) onCommit(n);
    else onDraft(String(value));
  };
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          min={0}
          disabled={disabled}
          value={draft ?? String(value)}
          onChange={(e) => onDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          className="tabular h-8 w-28"
        />
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}
