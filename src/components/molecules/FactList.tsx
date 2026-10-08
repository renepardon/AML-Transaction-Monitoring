import { CircleMinus, CirclePlus } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface FactListProps {
  title: string;
  facts: string[];
  tone: 'aggravating' | 'mitigating';
  emptyText?: string;
}

export function FactList({ title, facts, tone, emptyText = 'None found.' }: FactListProps) {
  const Icon = tone === 'aggravating' ? CirclePlus : CircleMinus;
  return (
    <div>
      <h4 className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h4>
      {facts.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="space-y-1">
          {facts.map((f) => (
            <li key={f} className="flex gap-2 text-sm">
              <Icon
                className={cn(
                  'mt-0.5 size-4 shrink-0',
                  tone === 'aggravating' ? 'text-risk-high' : 'text-risk-low',
                )}
                aria-label={tone === 'aggravating' ? 'Aggravating' : 'Mitigating'}
              />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
