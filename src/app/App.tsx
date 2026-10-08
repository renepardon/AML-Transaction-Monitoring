import { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/templates/AppShell';
import { AppSidebar } from '@/components/organisms/AppSidebar';
import { TopBar } from '@/components/organisms/TopBar';
import { AlertsPage } from '@/pages/AlertsPage';
import { AuditPage } from '@/pages/AuditPage';
import { CasesPage } from '@/pages/CasesPage';
import { ClientsPage } from '@/pages/ClientsPage';
import { DataPage } from '@/pages/DataPage';
import { OverviewPage } from '@/pages/OverviewPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { CommandPalette } from '@/components/organisms/CommandPalette';
import { GlobalHotkeys } from '@/components/organisms/GlobalHotkeys';
import { ReportsPage } from '@/pages/ReportsPage';
import { bootstrap } from '@/services/pipeline';
import { useUiStore, type View } from '@/stores/useUiStore';
import { ThemeProvider } from './ThemeProvider';
import { ErrorBoundary } from './ErrorBoundary';

const PAGES: Record<View, () => React.ReactNode> = {
  overview: () => <OverviewPage />,
  clients: () => <ClientsPage />,
  settings: () => <SettingsPage />,
  data: () => <DataPage />,
  audit: () => <AuditPage />,
  alerts: () => <AlertsPage />,
  cases: () => <CasesPage />,
  reports: () => <ReportsPage />,
};

export function App() {
  const view = useUiStore((s) => s.view);
  const theme = useUiStore((s) => s.theme);
  useEffect(() => {
    void bootstrap();
  }, []);
  const Page = PAGES[view] ?? PAGES.overview;
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={300}>
        <AppShell sidebar={<AppSidebar />} topBar={<TopBar />}>
          <ErrorBoundary>
            <Page />
          </ErrorBoundary>
        </AppShell>
        <CommandPalette />
        <GlobalHotkeys />
        <Toaster theme={theme} position="bottom-right" />
      </TooltipProvider>
    </ThemeProvider>
  );
}
