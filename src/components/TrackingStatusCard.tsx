import { Panel, Readout } from './primitives';
import { useElapsed } from '../hooks/useElapsed';
import { formatDuration } from '../utils/format';
import type { TrackingSession } from '../types';

const STATUS_LABEL: Record<TrackingSession['status'], string> = {
  idle: 'Idle',
  requesting_permission: 'Requesting',
  tracking: 'Tracking',
  paused: 'Paused',
  error: 'Error',
};

export function TrackingStatusCard({ session }: { session: TrackingSession }) {
  const elapsed = useElapsed(
    session.trackingStartedAt,
    session.status === 'tracking',
  );

  const shortId = session.sessionId.slice(0, 8);

  return (
    <Panel label="Tracking Status">
      <div className="timer">{formatDuration(elapsed)}</div>
      <div className="readout-grid" style={{ marginTop: 14 }}>
        <Readout
          label="Status"
          value={
            <span className="status-word" data-state={session.status}>
              {STATUS_LABEL[session.status]}
            </span>
          }
        />
        <Readout label="Updates" value={session.totalUpdates} signal />
        <Readout label="Session" value={shortId} />
        <Readout
          label="Duration"
          value={formatDuration(elapsed)}
        />
      </div>
    </Panel>
  );
}
