import { useEffect, useRef } from 'react';
import { Panel } from './primitives';
import { formatCoordinate, formatTime } from '../utils/format';
import type { GeoLocation } from '../types';

export function UpdatesFeed({ history }: { history: GeoLocation[] }) {
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest update (rendered at top).
  useEffect(() => {
    feedRef.current?.scrollTo({ top: 0 });
  }, [history.length]);

  const recent = [...history].reverse();

  return (
    <Panel label="Update Feed" tag={`${history.length}`}>
      {recent.length === 0 ? (
        <div className="empty">No updates yet</div>
      ) : (
        <div className="feed" ref={feedRef}>
          {recent.map((loc) => (
            <div className="feed__row" key={loc.timestamp}>
              <span className="feed__time">{formatTime(loc.timestamp)}</span>
              <span className="feed__coords">
                {formatCoordinate(loc.latitude, 5)},{' '}
                {formatCoordinate(loc.longitude, 5)}
              </span>
              <span>±{Math.round(loc.accuracy)}m</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
