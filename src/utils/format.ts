// Small pure helpers for formatting + identifiers.

export function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Format a duration in ms as H:MM:SS (or M:SS under an hour). */
export function formatDuration(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

export function formatCoordinate(value: number | null, digits = 6): string {
  return value === null || Number.isNaN(value) ? '—' : value.toFixed(digits);
}

/** Speed in m/s -> km/h string. */
export function formatSpeed(speed: number | null): string {
  if (speed === null || Number.isNaN(speed)) return '—';
  return `${(speed * 3.6).toFixed(1)} km/h`;
}

export function formatMeters(value: number | null): string {
  return value === null || Number.isNaN(value) ? '—' : `${value.toFixed(1)} m`;
}

/** Compass heading in degrees -> "NE 45°" style. */
export function formatHeading(heading: number | null): string {
  if (heading === null || Number.isNaN(heading)) return '—';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const idx = Math.round(heading / 45) % 8;
  return `${dirs[idx]} ${Math.round(heading)}°`;
}

export function formatTime(ts: number | null): string {
  if (ts === null) return '—';
  return new Date(ts).toLocaleTimeString();
}

/** Classify GPS accuracy (meters) into a quality band. */
export type AccuracyBand = 'excellent' | 'good' | 'fair' | 'poor';

export function accuracyBand(accuracy: number | null): AccuracyBand {
  if (accuracy === null) return 'poor';
  if (accuracy <= 10) return 'excellent';
  if (accuracy <= 30) return 'good';
  if (accuracy <= 100) return 'fair';
  return 'poor';
}

export function googleMapsUrl(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat},${lng}`;
}
