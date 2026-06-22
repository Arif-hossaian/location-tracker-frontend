# Live Location Tracker

A mobile-first single-page app (Vite + React 19 + TypeScript) that continuously
collects device GPS and telemetry and streams it to a backend endpoint.

## Quick start

```bash
npm install
cp .env.example .env      # set VITE_LOCATION_API_URL to your backend
npm run dev               # http://localhost:5173
```

> **HTTPS required.** Browsers only grant `geolocation` on `https://` or
> `localhost`. To test on a phone, run behind HTTPS (e.g. a tunnel) or use
> `localhost` port-forwarding.

### Scripts

| Command           | Purpose                          |
| ----------------- | -------------------------------- |
| `npm run dev`     | Dev server (mobile-accessible)   |
| `npm run build`   | Type-check + production build    |
| `npm run preview` | Serve the production build       |
| `npm run lint`    | `tsc --noEmit` type check        |

## Configuration

One environment variable, read at build time:

```
VITE_LOCATION_API_URL=https://your-backend.example.com
```

The app sends `POST {VITE_LOCATION_API_URL}/api/location` on every new GPS fix.

### Payload

```json
{
  "sessionId": "uuid",
  "timestamp": "ISO-8601",
  "location": {
    "latitude": 0, "longitude": 0, "accuracy": 0,
    "altitude": null, "altitudeAccuracy": null,
    "heading": null, "speed": null
  },
  "device": {
    "userAgent": "", "platform": "", "language": "", "timezone": "",
    "screenWidth": 0, "screenHeight": 0,
    "viewportWidth": 0, "viewportHeight": 0, "devicePixelRatio": 0
  }
}
```

The API layer applies a 10s timeout and up to 2 retries with exponential
backoff on network errors, timeouts, and 5xx responses.

## Architecture

```
src/
├── components/        UI: dashboard cards, feed, gates, primitives
│   ├── primitives.tsx           Panel / Readout / Row building blocks
│   ├── ErrorBoundary.tsx        Catches render errors
│   ├── AccuracyIndicator.tsx    GPS quality bars
│   ├── TrackingStatusCard.tsx
│   ├── LiveCoordinatesCard.tsx  + copy / Google Maps deep link
│   ├── ApiStatusCard.tsx
│   ├── NetworkInfoCard.tsx
│   ├── DeviceInfoCard.tsx
│   ├── UpdatesFeed.tsx          Auto-scrolling history
│   └── PermissionGate.tsx
├── hooks/
│   ├── useGeolocation.ts        Permissions + watchPosition lifecycle
│   ├── useTrackingSession.ts    Orchestrates session, sending, stats
│   ├── useDeviceInfo.ts
│   ├── useNetworkStatus.ts
│   ├── usePageLifecycle.ts      Visibility + refresh detection
│   ├── useLocalStorage.ts       Typed persistence
│   ├── useElapsed.ts            1s duration ticker
│   └── useTheme.ts              Dark / light, persisted
├── services/
│   └── api.ts                   Axios client, timeout, retry
├── types/
│   └── index.ts                 All shared interfaces
├── utils/
│   ├── deviceInfo.ts            Browser/OS/battery/network detection
│   └── format.ts                Coordinate/speed/duration formatting
├── App.tsx
└── main.tsx
```

## Features

- **Permission management** — detects support, reads the Permissions API live,
  and surfaces `granted` / `denied` / `prompt` with clear prompts.
- **Live GPS** — `watchPosition` in high-accuracy mode; captures lat, lng,
  accuracy, altitude, altitude accuracy, heading, speed, timestamp.
- **Device & network telemetry** — UA, platform, languages, screen/viewport,
  DPR, timezone, online status, connection type, battery, touch, browser, OS.
- **Session tracking** — session id, start time, last update, total updates,
  live duration, and status (`idle` → `requesting_permission` → `tracking` →
  `paused` / `error`).
- **Backend streaming** — Axios with timeout, retry, loading and error states;
  full API stats (last success, totals, failures, success rate).
- **Controls** — Start / Stop / Resume with duplicate-session guards and proper
  `watchPosition` cleanup.
- **Bonus** — GPS accuracy indicator, copy coordinates, Google Maps deep link,
  auto-scrolling feed, page-visibility + refresh awareness, localStorage
  persistence, and a dark/light theme toggle.

## Notes

- Background tabs throttle geolocation; the app shows a notice when hidden.
- Session id and counters survive a refresh via `localStorage`; an explicit
  **Start** always begins a fresh session.
```
