import { useEffect, useState } from 'react';
import { collectDeviceInfo } from '../utils/deviceInfo';
import type { DeviceInfo } from '../types';

/** Collects a device snapshot once on mount, refreshing on viewport resize. */
export function useDeviceInfo(): DeviceInfo | null {
  const [info, setInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    let active = true;

    const refresh = (): void => {
      void collectDeviceInfo().then((data) => {
        if (active) setInfo(data);
      });
    };

    refresh();
    window.addEventListener('resize', refresh);
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);

    return () => {
      active = false;
      window.removeEventListener('resize', refresh);
      window.removeEventListener('online', refresh);
      window.removeEventListener('offline', refresh);
    };
  }, []);

  return info;
}
