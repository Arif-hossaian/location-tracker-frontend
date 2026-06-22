import { Panel, Row } from './primitives';
import type { DeviceInfo } from '../types';

export function DeviceInfoCard({ device }: { device: DeviceInfo | null }) {
  if (!device) {
    return (
      <Panel label="Device Information">
        <div className="empty">Reading device…</div>
      </Panel>
    );
  }

  const battery = device.battery
    ? `${Math.round(device.battery.level * 100)}% ${
        device.battery.charging ? '⚡ charging' : ''
      }`.trim()
    : 'Unavailable';

  return (
    <Panel label="Device Information" tag={device.operatingSystem}>
      <Row k="Browser" v={device.browserName} />
      <Row k="OS" v={device.operatingSystem} />
      <Row k="Platform" v={device.platform} />
      <Row k="Language" v={device.language} />
      <Row k="Timezone" v={device.timezone} />
      <Row k="Screen" v={`${device.screenWidth} × ${device.screenHeight}`} />
      <Row
        k="Viewport"
        v={`${device.viewportWidth} × ${device.viewportHeight}`}
      />
      <Row k="Pixel Ratio" v={device.devicePixelRatio} />
      <Row k="Touch" v={device.touchSupport ? 'Yes' : 'No'} />
      <Row k="Battery" v={battery} />
      <Row
        k="User Agent"
        v={
          <span style={{ fontSize: 10, opacity: 0.8 }}>{device.userAgent}</span>
        }
      />
    </Panel>
  );
}
