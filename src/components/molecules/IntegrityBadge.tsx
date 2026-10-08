import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface IntegrityBadgeProps {
  ok: boolean;
  label?: string;
  className?: string;
}

export function IntegrityBadge({ ok, label, className }: IntegrityBadgeProps) {
  const Icon = ok ? ShieldCheck : ShieldAlert;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        ok
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          : 'bg-red-500/10 text-red-700 dark:text-red-400',
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label ?? (ok ? 'Data integrity OK' : 'Integrity issues')}
    </span>
  );
}
