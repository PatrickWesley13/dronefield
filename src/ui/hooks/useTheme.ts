import { useEffect } from 'react';
import type { ThemePreference } from '@/persistence';

export function useTheme(theme: ThemePreference): void {
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);
}
