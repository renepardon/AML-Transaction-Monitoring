import { cn } from '@/lib/cn';

export interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-black/10 bg-muted px-1 font-sans text-[11px] font-medium text-muted-foreground dark:border-white/10',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
