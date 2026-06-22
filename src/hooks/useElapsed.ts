import { useEffect, useState } from 'react';

/** Returns ms elapsed since `since`, ticking every second while `active`. */
export function useElapsed(since: number | null, active: boolean): number {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!active || since === null) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active, since]);

  if (since === null) return 0;
  return Math.max(0, now - since);
}
