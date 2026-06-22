import type {
  BatteryInfo,
  BatteryManager,
  DeviceInfo,
  NetworkInfo,
  NetworkInformation,
} from '../types';

/** Best-effort browser name from the user agent string. */
function detectBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\/|opera/i.test(ua)) return 'Opera';
  if (/samsungbrowser/i.test(ua)) return 'Samsung Internet';
  if (/firefox\/|fxios/i.test(ua)) return 'Firefox';
  if (/chrome\/|crios/i.test(ua) && !/edg\//i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  return 'Unknown';
}

/** Best-effort OS from the user agent string. */
function detectOS(ua: string): string {
  if (/windows nt/i.test(ua)) return 'Windows';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/mac os x/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Unknown';
}

function getConnection(): NetworkInformation | undefined {
  const nav = navigator as Navigator & {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  };
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
}

function readNetwork(): NetworkInfo {
  const conn = getConnection();
  return {
    online: navigator.onLine,
    connectionType: conn?.type ?? null,
    effectiveType: conn?.effectiveType ?? null,
    downlink: conn?.downlink ?? null,
    rtt: conn?.rtt ?? null,
  };
}

async function readBattery(): Promise<BatteryInfo | null> {
  const nav = navigator as Navigator & {
    getBattery?: () => Promise<BatteryManager>;
  };
  if (typeof nav.getBattery !== 'function') return null;
  try {
    const b = await nav.getBattery();
    return {
      level: b.level,
      charging: b.charging,
      chargingTime: b.chargingTime,
      dischargingTime: b.dischargingTime,
    };
  } catch {
    return null;
  }
}

function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Unknown';
  }
}

function hasTouch(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as Navigator & { msMaxTouchPoints?: number }).msMaxTouchPoints !==
      undefined
  );
}

/** Collect a full device snapshot. Async because the Battery API is async. */
export async function collectDeviceInfo(): Promise<DeviceInfo> {
  const ua = navigator.userAgent;
  const net = readNetwork();
  const battery = await readBattery();

  return {
    userAgent: ua,
    platform: navigator.platform || 'Unknown',
    language: navigator.language || 'Unknown',
    languages: navigator.languages ?? [navigator.language],
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    timezone: getTimezone(),
    online: net.online,
    connectionType: net.connectionType,
    effectiveType: net.effectiveType,
    downlink: net.downlink,
    rtt: net.rtt,
    battery,
    touchSupport: hasTouch(),
    browserName: detectBrowser(ua),
    operatingSystem: detectOS(ua),
  };
}

/** Read just the network portion (cheap, sync) — useful for live updates. */
export function collectNetworkInfo(): NetworkInfo {
  return readNetwork();
}

export { getConnection };
