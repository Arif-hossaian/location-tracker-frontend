import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import L from 'leaflet';
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Panel, Readout } from './primitives';
import { formatDistance, formatEta, parseHomeFromEnv } from '../utils/geo';
import type { GeoLocation, NavigationStatus } from '../types';
import type { Theme } from '../hooks/useTheme';

const TILE_URL = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light:
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
};

const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

const homeIcon = L.divIcon({
  className: 'nav-marker',
  html: '<span class="nav-marker__pin nav-marker__pin--home" aria-hidden="true"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const youIcon = L.divIcon({
  className: 'nav-marker',
  html: '<span class="nav-marker__pin nav-marker__pin--you" aria-hidden="true"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function MapRefBridge({ mapRef }: { mapRef: MutableRefObject<L.Map | null> }) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
    return () => {
      mapRef.current = null;
    };
  }, [map, mapRef]);

  return null;
}

function MapBounds({
  home,
  current,
  fitSignal,
}: {
  home: [number, number];
  current: [number, number];
  fitSignal: number;
}) {
  const map = useMap();
  const didInitialFit = useRef(false);

  useEffect(() => {
    if (fitSignal > 0 || !didInitialFit.current) {
      const bounds = L.latLngBounds([home, current]);
      map.fitBounds(bounds, { padding: [56, 56], maxZoom: 17 });
      didInitialFit.current = true;
    }
  }, [map, home, current, fitSignal]);

  return null;
}

function CompassRose({ bearingToHome }: { bearingToHome: number }) {
  return (
    <div
      className="nav-compass"
      aria-label={`Home is ${Math.round(bearingToHome)} degrees`}
    >
      <svg viewBox="0 0 80 80" className="nav-compass__svg">
        <circle cx="40" cy="40" r="36" className="nav-compass__ring" />
        {(['N', 'E', 'S', 'W'] as const).map((label, i) => {
          const angle = i * 90;
          const rad = ((angle - 90) * Math.PI) / 180;
          const x = 40 + Math.cos(rad) * 28;
          const y = 40 + Math.sin(rad) * 28;
          return (
            <text
              key={label}
              x={x}
              y={y}
              className="nav-compass__label"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {label}
            </text>
          );
        })}
        <g transform={`rotate(${bearingToHome} 40 40)`}>
          <polygon
            points="40,12 34,44 40,38 46,44"
            className="nav-compass__needle"
          />
          <circle cx="40" cy="40" r="4" className="nav-compass__hub" />
        </g>
      </svg>
      <span className="nav-compass__caption">To home</span>
    </div>
  );
}

export function NavigationMapCard({
  navigation,
  location,
  theme,
}: {
  navigation: NavigationStatus | null;
  location: GeoLocation | null;
  theme: Theme;
}) {
  const mapRef = useRef<L.Map | null>(null);
  const [fitSignal, setFitSignal] = useState(0);
  const home = navigation?.home ?? parseHomeFromEnv();
  const current = navigation?.current ?? null;
  const hasFix = current !== null || location !== null;

  const currentPos: [number, number] | null = current
    ? [current.latitude, current.longitude]
    : location
      ? [location.latitude, location.longitude]
      : null;

  const homePos: [number, number] | null = home
    ? [home.latitude, home.longitude]
    : null;

  const accuracy = current?.accuracy ?? location?.accuracy ?? 0;
  const mapCenter: [number, number] = currentPos ?? homePos ?? [0, 0];
  const mapZoom = currentPos && homePos ? 14 : 13;

  const zoomIn = (): void => {
    mapRef.current?.zoomIn();
  };

  const zoomOut = (): void => {
    mapRef.current?.zoomOut();
  };

  const fitRoute = (): void => {
    setFitSignal((n) => n + 1);
  };

  return (
    <Panel
      label="Navigation to Home"
      tag={
        navigation
          ? formatDistance(
              navigation.distance.meters,
              navigation.distance.kilometers,
            )
          : 'waiting'
      }
    >
      {!homePos ? (
        <div className="nav-empty">
          <p className="nav-empty__title">Home location not set yet</p>
          <p>
            Start tracking to load home from the API, or set{' '}
            <code>VITE_HOME_LATITUDE</code> and <code>VITE_HOME_LONGITUDE</code>{' '}
            in your env file.
          </p>
        </div>
      ) : (
        <>
          {navigation && (
            <div className="nav-hud">
              <div className="nav-hud__distance">
                {formatDistance(
                  navigation.distance.meters,
                  navigation.distance.kilometers,
                )}
              </div>
              <div className="nav-hud__meta">
                <span>
                  {navigation.direction.compassToHome}{' '}
                  {Math.round(navigation.direction.bearingToHome)}° to home
                </span>
                <span>
                  ETA {formatEta(navigation.travel.estimatedTimeMinutes)}
                </span>
              </div>
            </div>
          )}

          <div className="nav-map-wrap">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              className="nav-map"
              scrollWheelZoom
              touchZoom
              doubleClickZoom
              attributionControl={false}
            >
              <MapRefBridge mapRef={mapRef} />
              <TileLayer url={TILE_URL[theme]} attribution={TILE_ATTRIBUTION} />
              <Marker position={homePos} icon={homeIcon} />
              {currentPos && (
                <>
                  <Marker position={currentPos} icon={youIcon} />
                  {accuracy > 0 && (
                    <Circle
                      center={currentPos}
                      radius={accuracy}
                      pathOptions={{
                        color: 'var(--signal)',
                        fillColor: 'var(--signal)',
                        fillOpacity: 0.08,
                        weight: 1,
                        dashArray: '4 4',
                      }}
                    />
                  )}
                  {homePos && (
                    <Polyline
                      positions={[currentPos, homePos]}
                      pathOptions={{
                        color: '#38bdf8',
                        weight: 3,
                        dashArray: '8 8',
                        opacity: 0.85,
                      }}
                    />
                  )}
                  {homePos && (
                    <MapBounds
                      home={homePos}
                      current={currentPos}
                      fitSignal={fitSignal}
                    />
                  )}
                </>
              )}
            </MapContainer>

            {navigation && (
              <CompassRose bearingToHome={navigation.direction.bearingToHome} />
            )}

            <div className="nav-zoom" aria-label="Map zoom controls">
              <button
                type="button"
                className="nav-zoom__btn"
                onClick={zoomIn}
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                type="button"
                className="nav-zoom__btn"
                onClick={zoomOut}
                aria-label="Zoom out"
              >
                −
              </button>
              {currentPos && homePos && (
                <button
                  type="button"
                  className="nav-zoom__btn nav-zoom__btn--fit"
                  onClick={fitRoute}
                  aria-label="Fit route on map"
                  title="Fit route"
                >
                  ⊙
                </button>
              )}
            </div>

            <div className="nav-map-legend">
              <span className="nav-map-legend__item">
                <i className="nav-map-legend__dot nav-map-legend__dot--home" />
                Home
              </span>
              <span className="nav-map-legend__item">
                <i className="nav-map-legend__dot nav-map-legend__dot--you" />
                You
              </span>
            </div>
          </div>

          {!hasFix && (
            <p className="nav-hint">
              Waiting for GPS fix to show your position…
            </p>
          )}

          {navigation && (
            <div className="readout-grid nav-stats">
              <Readout
                label="Distance"
                value={formatDistance(
                  navigation.distance.meters,
                  navigation.distance.kilometers,
                )}
                signal
              />
              <Readout
                label="Direction"
                value={`${navigation.direction.compassToHome} ${Math.round(navigation.direction.bearingToHome)}°`}
              />
              <Readout
                label="Speed"
                value={`${navigation.travel.speedKmh.toFixed(1)} km/h`}
              />
              <Readout
                label="ETA"
                value={formatEta(navigation.travel.estimatedTimeMinutes)}
              />
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
