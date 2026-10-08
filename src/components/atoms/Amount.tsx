import { cn } from '@/lib/cn';
import { formatChf, formatChfRounded } from '@/lib/format';

export interface AmountProps {
  /** Amount in Rappen. */
  value: number;
  direction?: 'CRDT' | 'DBIT';
  rounded?: boolean;
  className?: string;
}

export function Amount({ value, direction, rounded = false, className }: AmountProps) {
  const text = rounded ? formatChfRounded(Math.abs(value)) : formatChf(Math.abs(value));
  const sign = direction === 'DBIT' ? '−' : direction === 'CRDT' ? '+' : value < 0 ? '−' : '';
  return (
    <span
      className={cn(
        'tabular whitespace-nowrap',
        direction === 'CRDT' && 'text-emerald-700 dark:text-emerald-400',
        className,
      )}
    >
      {sign}
      {text}
    </span>
  );
}
