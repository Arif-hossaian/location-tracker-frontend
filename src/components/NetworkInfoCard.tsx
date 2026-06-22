import { Panel, Row } from './primitives';
import type { NetworkInfo } from '../types';

export function NetworkInfoCard({ network }: { network: NetworkInfo }) {
  return (
    <Panel
      label="Network"
      tag={
        <span className="pill" data-tone={network.online ? 'online' : 'offline'}>
          <span
            className="beacon"
            data-live={network.online ? 'true' : 'false'}
            style={{ width: 8, height: 8 }}
          />
          {network.online ? 'Online' : 'Offline'}
        </span>
      }
    >
      <Row k="Status" v={network.online ? 'Connected' : 'Disconnected'} />
      <Row k="Connection" v={network.connectionType ?? 'Unknown'} />
      <Row k="Effective Type" v={network.effectiveType ?? 'Unknown'} />
      <Row
        k="Downlink"
        v={network.downlink !== null ? `${network.downlink} Mbps` : 'Unknown'}
      />
      <Row
        k="Round Trip"
        v={network.rtt !== null ? `${network.rtt} ms` : 'Unknown'}
      />
    </Panel>
  );
}
