import { useEffect, useState } from 'react';

interface PageLifecycle {
  visible: boolean;
  /** True if the page was reloaded (vs. fresh navigation). */
  wasRefreshed: boolean;
}

function detectRefresh(): boolean {
  const entries = performance.getEntriesByType(
    'navigation',
  ) as PerformanceNavigationTiming[];
  if (entries.length > 0) return entries[0].type === 'reload';
  return false;
}

/** Tracks document visibility and whether this load was a browser refresh. */
export function usePageLifecycle(): PageLifecycle {
  const [visible, setVisible] = useState<boolean>(
    typeof document !== 'undefined'
      ? document.visibilityState === 'visible'
      : true,
  );
  const [wasRefreshed] = useState<boolean>(() => {
    try {
      return detectRefresh();
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const onVisibility = (): void =>
      setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () =>
      document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return { visible, wasRefreshed };
}
