/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOCATION_API_URL: string;
  readonly VITE_HOME_LATITUDE?: string;
  readonly VITE_HOME_LONGITUDE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
