// Central type definitions for the location tracker.

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

export type TrackingStatus =
  | 'idle'
  | 'requesting_permission'
  | 'tracking'
  | 'paused'
  | 'error';

/** A single GPS fix captured from the Geolocation API. */
export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

/** Everything we can learn about the device from browser APIs. */
export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  languages: readonly string[];
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  timezone: string;
  online: boolean;
  connectionType: string | null;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
  battery: BatteryInfo | null;
  touchSupport: boolean;
  browserName: string;
  operatingSystem: string;
}

export interface BatteryInfo {
  level: number; // 0..1
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

export interface NetworkInfo {
  online: boolean;
  connectionType: string | null;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
}

export interface TrackingSession {
  sessionId: string;
  trackingStartedAt: number | null;
  lastUpdatedAt: number | null;
  totalUpdates: number;
  status: TrackingStatus;
}

/** Shape sent to POST /api/location. */
export interface LocationPayload {
  sessionId: string;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  device: {
    userAgent: string;
    platform: string;
    language: string;
    timezone: string;
    screenWidth: number;
    screenHeight: number;
    viewportWidth: number;
    viewportHeight: number;
    devicePixelRatio: number;
  };
}

export interface ApiStats {
  lastSuccessAt: number | null;
  totalRequests: number;
  failedRequests: number;
  successfulRequests: number;
  sending: boolean;
  lastError: string | null;
}

export interface GeoError {
  code: number;
  message: string;
}

/** Navigation snapshot returned by POST /api/location/live. */
export interface NavigationStatus {
  sessionId: string;
  home: {
    latitude: number;
    longitude: number;
  };
  current: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  distance: {
    meters: number;
    kilometers: number;
  };
  travel: {
    speedKmh: number;
    estimatedTimeMinutes: number;
    estimatedTimeHours: number;
  };
  direction: {
    bearing: number;
    compass: string;
    bearingToHome: number;
    compassToHome: string;
  };
  timestamp: string;
}

// --- Browser API augmentations (not in standard lib.dom) ---

export interface NetworkInformation extends EventTarget {
  readonly type?: string;
  readonly effectiveType?: string;
  readonly downlink?: number;
  readonly rtt?: number;
}

export interface BatteryManager extends EventTarget {
  readonly level: number;
  readonly charging: boolean;
  readonly chargingTime: number;
  readonly dischargingTime: number;
}
