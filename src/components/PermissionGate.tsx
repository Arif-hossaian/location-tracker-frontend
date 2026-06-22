import type { PermissionStatus } from '../types';

export function PermissionGate({
  supported,
  permission,
  onRequest,
}: {
  supported: boolean;
  permission: PermissionStatus;
  onRequest: () => void;
}) {
  if (!supported) {
    return (
      <div className="banner banner--error">
        <div className="banner__title">Geolocation unavailable</div>
        <p>This browser doesn’t expose the Geolocation API. Try a modern mobile browser over HTTPS.</p>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="banner banner--error">
        <div className="banner__title">Location access blocked</div>
        <p>
          Enable location for this site in your browser settings, then reload.
        </p>
      </div>
    );
  }

  if (permission === 'prompt' || permission === 'unsupported') {
    return (
      <div className="banner banner--info">
        <div className="banner__title">Location permission needed</div>
        <p style={{ marginBottom: 12 }}>
          Grant access so the tracker can read your live position.
        </p>
        <button className="btn btn--primary" onClick={onRequest}>
          Allow location access
        </button>
      </div>
    );
  }

  return null;
}
