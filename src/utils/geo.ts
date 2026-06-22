import type { GeoLocation, NavigationStatus } from '../types';

const EARTH_RADIUS_M = 6_371_000;
const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

export interface LatLng {
  latitude: number;
  longitude: number;
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** Great-circle distance in meters. */
export function haversineDistanceMeters(from: LatLng, to: LatLng): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Initial bearing from `from` to `to` in degrees (0 = north, clockwise). */
export function bearingDegrees(from: LatLng, to: LatLng): number {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const dLon = toRadians(to.longitude - from.longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

export function compassDirection(degrees: number): string {
  const idx = Math.round(degrees / 45) % 8;
  return COMPASS[idx];
}

function normalizeHeading(heading: number | null): number | null {
  if (heading === null || Number.isNaN(heading)) return null;
  return (heading + 360) % 360;
}

/** Build navigation metrics from home + current GPS fix. */
export function buildNavigationStatus(
  sessionId: string,
  home: LatLng,
  loc: GeoLocation,
): NavigationStatus {
  const current: LatLng = {
    latitude: loc.latitude,
    longitude: loc.longitude,
  };

  const meters = haversineDistanceMeters(current, home);
  const kilometers = meters / 1000;
  const bearingToHome = bearingDegrees(current, home);
  const heading = normalizeHeading(loc.heading);
  const speedKmh =
    loc.speed !== null && !Number.isNaN(loc.speed) ? loc.speed * 3.6 : 0;
  const speedForEta = speedKmh > 0.5 ? speedKmh : 5;
  const estimatedTimeHours = kilometers / speedForEta;
  const estimatedTimeMinutes = estimatedTimeHours * 60;
  const bearing = heading !== null ? heading : bearingToHome;

  return {
    sessionId,
    home,
    current: {
      latitude: loc.latitude,
      longitude: loc.longitude,
      accuracy: loc.accuracy,
    },
    distance: {
      meters: Math.round(meters * 100) / 100,
      kilometers: Math.round(kilometers * 10_000) / 10_000,
    },
    travel: {
      speedKmh: Math.round(speedKmh * 10) / 10,
      estimatedTimeMinutes: Math.round(estimatedTimeMinutes * 10) / 10,
      estimatedTimeHours: Math.round(estimatedTimeHours * 10_000) / 10_000,
    },
    direction: {
      bearing: Math.round(bearing * 100) / 100,
      compass: compassDirection(bearing),
      bearingToHome: Math.round(bearingToHome * 100) / 100,
      compassToHome: compassDirection(bearingToHome),
    },
    timestamp: new Date(loc.timestamp).toISOString(),
  };
}

export function parseHomeFromEnv(): LatLng | null {
  const lat = import.meta.env.VITE_HOME_LATITUDE;
  const lng = import.meta.env.VITE_HOME_LONGITUDE;
  if (!lat || !lng) return null;

  const latitude = Number.parseFloat(lat);
  const longitude = Number.parseFloat(lng);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

  return { latitude, longitude };
}

/** Resolve home: env override wins, then API, then cached ref. */
export function resolveHome(
  apiHome: LatLng | null | undefined,
  cachedHome: LatLng | null,
): LatLng | null {
  return parseHomeFromEnv() ?? apiHome ?? cachedHome;
}

/** Within GPS accuracy or 50 m — treat as arrived at home. */
export const AT_HOME_THRESHOLD_M = 50;

export function isAtHome(
  distanceMeters: number,
  accuracyMeters: number,
): boolean {
  return distanceMeters <= Math.max(accuracyMeters, AT_HOME_THRESHOLD_M);
}

export function isNavigationStatus(value: unknown): value is NavigationStatus {
  if (!value || typeof value !== 'object') return false;
  const v = value as NavigationStatus;
  return (
    typeof v.sessionId === 'string' &&
    typeof v.home?.latitude === 'number' &&
    typeof v.home?.longitude === 'number' &&
    typeof v.current?.latitude === 'number' &&
    typeof v.current?.longitude === 'number' &&
    typeof v.distance?.meters === 'number'
  );
}

export function formatDistance(meters: number, kilometers: number): string {
  if (meters < AT_HOME_THRESHOLD_M) return 'At home';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${kilometers.toFixed(2)} km`;
}

export function formatEta(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
