import { ShieldHalf } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NAV_ITEMS } from '@/lib/navigation';
import { useUiStore } from '@/stores/useUiStore';
import { useNavBadges } from '@/stores/selectors/navigation';

export function AppSidebar() {
  const view = useUiStore((s) => s.view);
  const navigate = useUiStore((s) => s.navigate);
  const badges = useNavBadges();
  return (
    <aside className="no-print sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-black/5 bg-sidebar px-3 py-5 backdrop-blur-xl md:flex dark:border-white/10">
      <div className="mb-6 flex items-center gap-2 px-2">
        <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ShieldHalf className="size-4" aria-hidden />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Bank Zürichsee</p>
          <p className="text-xs text-muted-foreground">AML Monitoring</p>
        </div>
      </div>
      <nav aria-label="Main" className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ view: v, label, icon: Icon }) => {
          const badge = badges[v];
          return (
            <button
              key={v}
              type="button"
              onClick={() => navigate(v)}
              aria-current={view === v ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                view === v
                  ? 'bg-black/5 font-medium text-foreground dark:bg-white/10'
                  : 'text-muted-foreground hover:bg-black/[0.03] hover:text-foreground dark:hover:bg-white/5',
              )}
            >
              <Icon className="size-4" aria-hidden />
              <span className="flex-1 text-left">{label}</span>
              {badge ? (
                <span className="tabular rounded-full bg-black/5 px-1.5 text-xs text-muted-foreground dark:bg-white/10">
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
      <p className="mt-auto px-2 text-[11px] leading-snug text-muted-foreground">
        Prototype · fictional data · runs entirely in your browser
      </p>
    </aside>
  );
}
