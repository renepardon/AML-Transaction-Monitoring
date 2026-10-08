export interface AppShellProps {
  sidebar: React.ReactNode;
  topBar: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ sidebar, topBar, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        {topBar}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
