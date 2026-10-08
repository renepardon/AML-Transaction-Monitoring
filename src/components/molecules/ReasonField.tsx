import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MIN_REASON_LENGTH } from '@/domain/reason';
import { cn } from '@/lib/cn';

export interface ReasonFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  actorLabel: string;
  placeholder?: string;
  minLength?: number;
}

export function ReasonField({
  id,
  label,
  value,
  onChange,
  actorLabel,
  placeholder,
  minLength = MIN_REASON_LENGTH,
}: ReasonFieldProps) {
  const length = value.trim().length;
  const ok = length >= minLength;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        aria-describedby={`${id}-hint`}
        aria-invalid={!ok && value.length > 0}
      />
      <div id={`${id}-hint`} className="flex justify-between text-xs text-muted-foreground">
        <span>Recorded as {actorLabel}</span>
        <span className={cn('tabular', ok ? 'text-emerald-700 dark:text-emerald-400' : '')}>
          {length} / {minLength} min. characters
        </span>
      </div>
    </div>
  );
}
