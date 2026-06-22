import axios, { AxiosError, type AxiosInstance } from 'axios';
import type { LocationPayload, NavigationStatus } from '../types';
import { isNavigationStatus } from '../utils/geo';

const BASE_URL = import.meta.env.VITE_LOCATION_API_URL ?? '';
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 600;

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** A request is worth retrying on network errors, timeouts, and 5xx. */
function isRetryable(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const err = error as AxiosError;
  if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') return true;
  const status = err.response?.status;
  return status !== undefined && status >= 500;
}

function describeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError;
    if (err.code === 'ECONNABORTED') return 'Request timed out';
    if (err.code === 'ERR_NETWORK') return 'Network unreachable';
    if (err.response) return `Server responded ${err.response.status}`;
    return err.message;
  }
  return error instanceof Error ? error.message : 'Unknown error';
}

export interface SendResult {
  ok: boolean;
  error?: string;
  attempts: number;
  navigation?: NavigationStatus;
}

/** POST a location update with bounded exponential-backoff retries. */
export async function sendLocation(
  payload: LocationPayload,
): Promise<SendResult> {
  if (!BASE_URL) {
    return {
      ok: false,
      error: 'VITE_LOCATION_API_URL is not configured',
      attempts: 0,
    };
  }

  let lastError = 'Unknown error';

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt += 1) {
    try {
      const response = await client.post<NavigationStatus>(
        '/api/location/live',
        payload,
      );
      const navigation = isNavigationStatus(response.data)
        ? response.data
        : undefined;
      return { ok: true, attempts: attempt, navigation };
    } catch (error) {
      lastError = describeError(error);
      if (attempt <= MAX_RETRIES && isRetryable(error)) {
        await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
        continue;
      }
      return { ok: false, error: lastError, attempts: attempt };
    }
  }

  return { ok: false, error: lastError, attempts: MAX_RETRIES + 1 };
}

export { BASE_URL };
