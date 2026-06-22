import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGeolocation } from './useGeolocation';
import { useLocalStorage } from './useLocalStorage';
import { sendLocation } from '../services/api';
import { generateSessionId } from '../utils/format';
import { buildNavigationStatus, parseHomeFromEnv } from '../utils/geo';
import type {
  ApiStats,
  DeviceInfo,
  GeoLocation,
  LocationPayload,
  NavigationStatus,
  TrackingSession,
  TrackingStatus,
} from '../types';

const STORAGE_KEY = 'llt:session';

interface PersistedSession {
  sessionId: string;
  trackingStartedAt: number | null;
  totalUpdates: number;
}

function buildPayload(
  sessionId: string,
  loc: GeoLocation,
  device: DeviceInfo | null,
): LocationPayload {
  return {
    sessionId,
    timestamp: new Date(loc.timestamp).toISOString(),
    location: {
      latitude: loc.latitude,
      longitude: loc.longitude,
      accuracy: loc.accuracy,
      altitude: loc.altitude,
      altitudeAccuracy: loc.altitudeAccuracy,
      heading: loc.heading,
      speed: loc.speed,
    },
    device: {
      userAgent: device?.userAgent ?? '',
      platform: device?.platform ?? '',
      language: device?.language ?? '',
      timezone: device?.timezone ?? '',
      screenWidth: device?.screenWidth ?? 0,
      screenHeight: device?.screenHeight ?? 0,
      viewportWidth: device?.viewportWidth ?? 0,
      viewportHeight: device?.viewportHeight ?? 0,
      devicePixelRatio: device?.devicePixelRatio ?? 0,
    },
  };
}

interface UseTrackingSessionResult {
  session: TrackingSession;
  location: GeoLocation | null;
  navigation: NavigationStatus | null;
  history: GeoLocation[];
  apiStats: ApiStats;
  permission: ReturnType<typeof useGeolocation>['permission'];
  supported: boolean;
  geoError: ReturnType<typeof useGeolocation>['error'];
  start: () => Promise<void>;
  stop: () => void;
  resume: () => void;
  reset: () => void;
  requestPermission: () => Promise<void>;
}

const MAX_HISTORY = 50;

const INITIAL_API_STATS: ApiStats = {
  lastSuccessAt: null,
  totalRequests: 0,
  failedRequests: 0,
  successfulRequests: 0,
  sending: false,
  lastError: null,
};

export function useTrackingSession(
  device: DeviceInfo | null,
): UseTrackingSessionResult {
  const [persisted, setPersisted] = useLocalStorage<PersistedSession>(
    STORAGE_KEY,
    {
      sessionId: generateSessionId(),
      trackingStartedAt: null,
      totalUpdates: 0,
    },
  );

  const [status, setStatus] = useState<TrackingStatus>('idle');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [history, setHistory] = useState<GeoLocation[]>([]);
  const [apiStats, setApiStats] = useState<ApiStats>(INITIAL_API_STATS);
  const [navigation, setNavigation] = useState<NavigationStatus | null>(null);
  const homeRef = useRef(parseHomeFromEnv());

  // Keep device snapshot in a ref so the geolocation callback stays stable.
  const deviceRef = useRef<DeviceInfo | null>(device);
  deviceRef.current = device;
  const sessionIdRef = useRef(persisted.sessionId);
  sessionIdRef.current = persisted.sessionId;

  const handleNewFix = useCallback(
    (loc: GeoLocation) => {
      setLastUpdatedAt(loc.timestamp);
      setHistory((prev) => [...prev.slice(-(MAX_HISTORY - 1)), loc]);
      setPersisted((prev) => ({
        ...prev,
        totalUpdates: prev.totalUpdates + 1,
      }));

      setApiStats((prev) => ({
        ...prev,
        sending: true,
        totalRequests: prev.totalRequests + 1,
      }));

      const payload = buildPayload(
        sessionIdRef.current,
        loc,
        deviceRef.current,
      );
      void sendLocation(payload).then((result) => {
        if (result.navigation) {
          homeRef.current = result.navigation.home;
          setNavigation(result.navigation);
        }
        setApiStats((prev) => ({
          ...prev,
          sending: false,
          successfulRequests: prev.successfulRequests + (result.ok ? 1 : 0),
          failedRequests: prev.failedRequests + (result.ok ? 0 : 1),
          lastSuccessAt: result.ok ? Date.now() : prev.lastSuccessAt,
          lastError: result.ok ? null : (result.error ?? 'Send failed'),
        }));
      });
    },
    [setPersisted],
  );

  const geo = useGeolocation(handleNewFix);

  const liveNavigation = useMemo((): NavigationStatus | null => {
    const home = navigation?.home ?? homeRef.current;
    if (!home || !geo.location) return navigation;

    return buildNavigationStatus(sessionIdRef.current, home, geo.location);
  }, [navigation, geo.location]);

  // Reflect denied permission as an error status.
  useEffect(() => {
    if (geo.permission === 'denied') setStatus('error');
  }, [geo.permission]);

  const requestPermission = useCallback(async (): Promise<void> => {
    setStatus('requesting_permission');
    await geo.requestPermission();
    setStatus((prev) => (prev === 'requesting_permission' ? 'idle' : prev));
  }, [geo]);

  const start = useCallback(async (): Promise<void> => {
    if (geo.isWatching) return; // prevent duplicate sessions

    if (geo.permission !== 'granted') {
      setStatus('requesting_permission');
      await geo.requestPermission();
    }

    // Fresh session each explicit start.
    const newId = generateSessionId();
    const startedAt = Date.now();
    setPersisted({
      sessionId: newId,
      trackingStartedAt: startedAt,
      totalUpdates: 0,
    });
    sessionIdRef.current = newId;
    setHistory([]);

    geo.startWatching();
    setStatus('tracking');
  }, [geo, setPersisted]);

  const stop = useCallback((): void => {
    geo.stopWatching();
    setStatus('paused');
  }, [geo]);

  const resume = useCallback((): void => {
    if (geo.isWatching) return;
    if (!persisted.trackingStartedAt) {
      setPersisted((prev) => ({ ...prev, trackingStartedAt: Date.now() }));
    }
    geo.startWatching();
    setStatus('tracking');
  }, [geo, persisted.trackingStartedAt, setPersisted]);

  const reset = useCallback((): void => {
    geo.reset();
    const newId = generateSessionId();
    setPersisted({
      sessionId: newId,
      trackingStartedAt: null,
      totalUpdates: 0,
    });
    sessionIdRef.current = newId;
    setHistory([]);
    setLastUpdatedAt(null);
    setApiStats(INITIAL_API_STATS);
    setNavigation(null);
    setStatus(geo.permission === 'denied' ? 'error' : 'idle');
  }, [geo, setPersisted]);

  const session: TrackingSession = {
    sessionId: persisted.sessionId,
    trackingStartedAt: persisted.trackingStartedAt,
    lastUpdatedAt,
    totalUpdates: persisted.totalUpdates,
    status,
  };

  return {
    session,
    location: geo.location,
    navigation: liveNavigation,
    history,
    apiStats,
    permission: geo.permission,
    supported: geo.supported,
    geoError: geo.error,
    start,
    stop,
    resume,
    reset,
    requestPermission,
  };
}
