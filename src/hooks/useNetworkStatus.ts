import { useEffect, useState } from 'react';
import { collectNetworkInfo, getConnection } from '../utils/deviceInfo';
import type { NetworkInfo } from '../types';

/** Tracks online/offline and connection changes in real time. */
export function useNetworkStatus(): NetworkInfo {
  const [info, setInfo] = useState<NetworkInfo>(() => collectNetworkInfo());

  useEffect(() => {
    const update = (): void => setInfo(collectNetworkInfo());

    window.addEventListener('online', update);
    window.addEventListener('offline', update);

    const conn = getConnection();
    conn?.addEventListener('change', update);

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      conn?.removeEventListener('change', update);
    };
  }, []);

  return info;
}
