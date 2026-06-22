import { useState } from 'react';
import { Panel, Readout } from './primitives';
import { AccuracyIndicator } from './AccuracyIndicator';
import {
  formatCoordinate,
  formatHeading,
  formatMeters,
  formatSpeed,
  formatTime,
  googleMapsUrl,
} from '../utils/format';
import type { GeoLocation } from '../types';

export function LiveCoordinatesCard({
  location,
  onCopied,
}: {
  location: GeoLocation | null;
  onCopied: (msg: string) => void;
}) {
  const [copying, setCopying] = useState(false);

  const copyCoords = async (): Promise<void> => {
    if (!location) return;
    const text = `${location.latitude}, ${location.longitude}`;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(text);
      onCopied('Coordinates copied');
    } catch {
      onCopied('Copy failed');
    } finally {
      setCopying(false);
    }
  };

  const openMaps = (): void => {
    if (!location) return;
    window.open(
      googleMapsUrl(location.latitude, location.longitude),
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <Panel
      label="Live Coordinates"
      tag={location ? formatTime(location.timestamp) : 'no fix'}
    >
      {location ? (
        <>
          <div className="readout-grid">
            <Readout
              label="Latitude"
              value={formatCoordinate(location.latitude)}
              signal
            />
            <Readout
              label="Longitude"
              value={formatCoordinate(location.longitude)}
              signal
            />
            <Readout label="Speed" value={formatSpeed(location.speed)} />
            <Readout label="Heading" value={formatHeading(location.heading)} />
            <Readout label="Altitude" value={formatMeters(location.altitude)} />
            <Readout
              label="Alt. Accuracy"
              value={formatMeters(location.altitudeAccuracy)}
            />
          </div>

          <div style={{ margin: '14px 0' }}>
            <AccuracyIndicator accuracy={location.accuracy} />
          </div>

          <div className="action-row">
            <button
              className="btn btn--ghost"
              onClick={copyCoords}
              disabled={copying}
            >
              Copy coordinates
            </button>
            <button className="btn btn--ghost" onClick={openMaps}>
              Open current location
            </button>
          </div>
        </>
      ) : (
        <div className="empty">Waiting for first GPS fix…</div>
      )}
    </Panel>
  );
}
