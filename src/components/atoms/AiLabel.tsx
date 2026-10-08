import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface AiLabelProps {
  className?: string;
}

export const AI_LABEL_TEXT = 'AI-generated · simulated Claude · decision stays with the analyst';

export function AiLabel({ className }: AiLabelProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-medium text-primary',
        className,
      )}
    >
      <Sparkles className="size-3.5" aria-hidden />
      {AI_LABEL_TEXT}
    </span>
  );
}
