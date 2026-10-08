import type { LucideIcon } from 'lucide-react';

export interface KpiCardProps {
  label: string;
  value: number | string;
  hint?: string;
  icon: LucideIcon;
}

export function KpiCard({ label, value, hint, icon: Icon }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-black/5 bg-card p-5 dark:border-white/10">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-medium">{label}</span>
        <Icon className="size-4" aria-hidden />
      </div>
      <p className="tabular mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
