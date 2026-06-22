import { Panel, Readout } from './primitives';
import { formatTime } from '../utils/format';
import type { ApiStats } from '../types';

export function ApiStatusCard({ stats }: { stats: ApiStats }) {
  const successRate =
    stats.totalRequests > 0
      ? Math.round((stats.successfulRequests / stats.totalRequests) * 100)
      : 0;

  return (
    <Panel
      label="API Status"
      tag={stats.sending ? 'sending…' : `${stats.totalRequests} sent`}
    >
      <div className="readout-grid">
        <Readout
          label="Last Success"
          value={formatTime(stats.lastSuccessAt)}
        />
        <Readout label="Success Rate" value={`${successRate}%`} signal />
        <Readout label="Total Requests" value={stats.totalRequests} />
        <Readout label="Failed" value={stats.failedRequests} />
      </div>
      {stats.lastError && (
        <div className="banner banner--error" style={{ marginTop: 12 }}>
          <div className="banner__title">Last error</div>
          <p>{stats.lastError}</p>
        </div>
      )}
    </Panel>
  );
}
