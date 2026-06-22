import { useCallback, useEffect, useRef, useState } from 'react';
import type { GeoError, GeoLocation, PermissionStatus } from '../types';

interface PermissionStatus_DOM {
  state: PermissionState;
  addEventListener: (type: string, cb: () => void) => void;
  removeEventListener: (type: string, cb: () => void) => void;
}

const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 15_000,
};

interface UseGeolocationResult {
  supported: boolean;
  permission: PermissionStatus;
  location: GeoLocation | null;
  error: GeoError | null;
  isWatching: boolean;
  requestPermission: () => Promise<void>;
  startWatching: () => void;
  stopWatching: () => void;
  reset: () => void;
}

function toGeoLocation(p: GeolocationPosition): GeoLocation {
  const c = p.coords;
  return {
    latitude: c.latitude,
    longitude: c.longitude,
    accuracy: c.accuracy,
    altitude: c.altitude,
    altitudeAccuracy: c.altitudeAccuracy,
    heading: c.heading,
    speed: c.speed,
    timestamp: p.timestamp,
  };
}

/**
 * Wraps the Geolocation API: tracks permission state, exposes a live position
 * via watchPosition, and cleans up the watch on unmount.
 *
 * @param onUpdate called for every new fix (used to push to the backend).
 */
export function useGeolocation(
  onUpdate?: (loc: GeoLocation) => void,
): UseGeolocationResult {
  const supported =
    typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const [permission, setPermission] = useState<PermissionStatus>(
    supported ? 'prompt' : 'unsupported',
  );
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [error, setError] = useState<GeoError | null>(null);
  const [isWatching, setIsWatching] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  // Subscribe to the Permissions API where available.
  useEffect(() => {
    if (!supported || !('permissions' in navigator)) return;
    let permObj: PermissionStatus_DOM | null = null;

    const onChange = (): void => {
      if (permObj) setPermission(permObj.state as PermissionStatus);
    };

    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((result) => {
        permObj = result as unknown as PermissionStatus_DOM;
        setPermission(permObj.state as PermissionStatus);
        permObj.addEventListener('change', onChange);
      })
      .catch(() => {
        // Permissions API unavailable for geolocation; leave as 'prompt'.
      });

    return () => {
      permObj?.removeEventListener('change', onChange);
    };
  }, [supported]);

  const handleError = useCallback((err: GeolocationPositionError): void => {
    setError({ code: err.code, message: err.message });
    if (err.code === err.PERMISSION_DENIED) setPermission('denied');
  }, []);

  const applyFix = useCallback((pos: GeolocationPosition): void => {
    const loc = toGeoLocation(pos);
    setLocation(loc);
    setPermission('granted');
    setError(null);
    onUpdateRef.current?.(loc);
  }, []);

  const startWatching = useCallback((): void => {
    if (!supported || watchIdRef.current !== null) return;
    setError(null);

    // Seed the UI immediately; watchPosition can take several seconds.
    navigator.geolocation.getCurrentPosition(applyFix, handleError, WATCH_OPTIONS);

    watchIdRef.current = navigator.geolocation.watchPosition(
      applyFix,
      handleError,
      WATCH_OPTIONS,
    );
    setIsWatching(true);
  }, [supported, handleError, applyFix]);

  const stopWatching = useCallback((): void => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  }, []);

  const reset = useCallback((): void => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
    setLocation(null);
    setError(null);
  }, []);

  // Explicit permission request: a single getCurrentPosition triggers the prompt.
  const requestPermission = useCallback((): Promise<void> => {
    if (!supported) {
      setPermission('unsupported');
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation(toGeoLocation(pos));
          setPermission('granted');
          setError(null);
          resolve();
        },
        (err) => {
          handleError(err);
          resolve();
        },
        WATCH_OPTIONS,
      );
    });
  }, [supported, handleError]);

  // Clean up any active watch on unmount.
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  return {
    supported,
    permission,
    location,
    error,
    isWatching,
    requestPermission,
    startWatching,
    stopWatching,
    reset,
  };
}
