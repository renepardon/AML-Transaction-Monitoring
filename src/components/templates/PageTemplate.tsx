export interface PageTemplateProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function PageTemplate({ title, description, actions, children }: PageTemplateProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 no-print">{actions}</div>}
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}
