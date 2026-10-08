import { useEffect } from 'react';
import { useUiStore } from '@/stores/useUiStore';

/** Applies the theme from useUiStore to the document root. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUiStore((s) => s.theme);
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && Boolean(media?.matches));
      document.documentElement.classList.toggle('dark', dark);
    };
    apply();
    media?.addEventListener?.('change', apply);
    return () => media?.removeEventListener?.('change', apply);
  }, [theme]);
  return <>{children}</>;
}
