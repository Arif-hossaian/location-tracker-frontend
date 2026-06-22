import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export type Theme = 'dark' | 'light';

function systemTheme(): Theme {
  // Default to the dark "cockpit" theme; users can switch to light.
  return 'dark';
}

/** Persisted theme, defaulting to the system preference, applied to <html>. */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useLocalStorage<Theme>('llt:theme', systemTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = (): void => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  return [theme, toggle];
}
