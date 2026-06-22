import { useEffect, useState } from 'react';
import { TrackingStatusCard } from './components/TrackingStatusCard';
import { LiveCoordinatesCard } from './components/LiveCoordinatesCard';
import { DeviceInfoCard } from './components/DeviceInfoCard';
import { NetworkInfoCard } from './components/NetworkInfoCard';
import { ApiStatusCard } from './components/ApiStatusCard';
import { UpdatesFeed } from './components/UpdatesFeed';
import { PermissionGate } from './components/PermissionGate';
import { NavigationMapCard } from './components/NavigationMapCard';
import { useDeviceInfo } from './hooks/useDeviceInfo';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useTrackingSession } from './hooks/useTrackingSession';
import { usePageLifecycle } from './hooks/usePageLifecycle';
import { useTheme } from './hooks/useTheme';

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const device = useDeviceInfo();
  const network = useNetworkStatus();
  const { visible, wasRefreshed } = usePageLifecycle();
  const [toast, setToast] = useState<string | null>(null);

  const {
    session,
    location,
    navigation,
    history,
    apiStats,
    permission,
    supported,
    geoError,
    start,
    stop,
    resume,
    reset,
    requestPermission,
  } = useTrackingSession(device);

  // Transient copy/info toast.
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(id);
  }, [toast]);

  const isTracking = session.status === 'tracking';
  const canResume = session.status === 'paused';
  const beaconState =
    session.status === 'error'
      ? 'error'
      : session.status === 'paused'
        ? 'paused'
        : 'tracking';

  return (
    <div className="app">
      <header className="masthead">
        <div className="masthead__brand">
          <span
            className="beacon"
            data-live={isTracking ? 'true' : 'false'}
            data-state={beaconState}
          />
          <div>
            <div className="masthead__title">Live Tracker</div>
            <div className="masthead__sub">Telemetry · Real-time</div>
          </div>
        </div>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </header>

      <PermissionGate
        supported={supported}
        permission={permission}
        onRequest={requestPermission}
      />

      {geoError && permission !== 'denied' && (
        <div className="banner banner--warn">
          <div className="banner__title">GPS signal issue</div>
          <p>{geoError.message}</p>
        </div>
      )}

      {wasRefreshed && session.totalUpdates > 0 && (
        <div className="banner banner--info">
          <div className="banner__title">Session restored</div>
          <p>Page was refreshed. Previous session id and counters were kept.</p>
        </div>
      )}

      {!visible && isTracking && (
        <div className="banner banner--warn">
          <div className="banner__title">Running in background</div>
          <p>
            Tracking continues, but updates may slow while the tab is hidden.
          </p>
        </div>
      )}

      <NavigationMapCard
        navigation={navigation}
        location={location}
        theme={theme}
      />
      <TrackingStatusCard session={session} />
      <LiveCoordinatesCard location={location} onCopied={setToast} />
      <ApiStatusCard stats={apiStats} />
      <NetworkInfoCard network={network} />
      <UpdatesFeed history={history} />
      <DeviceInfoCard device={device} />

      <div className="dock">
        <div className="controls">
          {!isTracking && !canResume && (
            <button
              className="btn btn--primary"
              onClick={() => void start()}
              disabled={!supported || permission === 'denied'}
            >
              Start tracking
            </button>
          )}
          {canResume && (
            <button className="btn btn--primary" onClick={resume}>
              Resume tracking
            </button>
          )}
          {isTracking && (
            <button className="btn btn--danger" onClick={stop}>
              Stop tracking
            </button>
          )}
          <button className="btn btn--ghost" onClick={reset}>
            Reset
          </button>
        </div>
        <p className="dock__credit">Developer · Arif Hossain</p>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
