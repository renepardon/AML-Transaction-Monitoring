export interface SplitViewTemplateProps {
  list: React.ReactNode;
  detail: React.ReactNode;
  listLabel?: string;
  detailLabel?: string;
}

export function SplitViewTemplate({
  list,
  detail,
  listLabel = 'Case list',
  detailLabel = 'Case detail',
}: SplitViewTemplateProps) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col lg:flex-row">
      <section
        aria-label={listLabel}
        className="shrink-0 border-b border-black/5 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:w-80 lg:overflow-y-auto lg:border-r lg:border-b-0 dark:border-white/10 no-print"
      >
        {list}
      </section>
      <section aria-label={detailLabel} className="min-w-0 flex-1">
        {detail}
      </section>
    </div>
  );
}
