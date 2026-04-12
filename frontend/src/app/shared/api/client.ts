type JsonObject = Record<string, unknown>;

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000/api/v1';
const TOKEN_STORAGE_KEY = 'invsys.accessToken';
const DEFAULT_TOKEN_STORAGE = 'session';

type TokenStorageMode = 'session' | 'local';

function getTokenStorageMode(): TokenStorageMode {
  const configured = (import.meta as ImportMeta & {
    env: { VITE_TOKEN_STORAGE?: string };
  }).env.VITE_TOKEN_STORAGE;

  return configured === 'local' ? 'local' : DEFAULT_TOKEN_STORAGE;
}

function tokenStorage(): Storage {
  return getTokenStorageMode() === 'local' ? window.localStorage : window.sessionStorage;
}

function getApiBaseUrl() {
  return (import.meta as ImportMeta & {
    env: { VITE_API_BASE_URL?: string; VITE_API_URL?: string };
  }).env.VITE_API_BASE_URL
    ?? (import.meta as ImportMeta & { env: { VITE_API_URL?: string } }).env.VITE_API_URL
    ?? DEFAULT_API_BASE_URL;
}

export function getStoredAccessToken() {
  return tokenStorage().getItem(TOKEN_STORAGE_KEY);
}

export function setStoredAccessToken(token: string | null) {
  if (token) {
    tokenStorage().setItem(TOKEN_STORAGE_KEY, token);
    return;
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(message: string, status: number, detail: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getStoredAccessToken();

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null && 'detail' in payload
      ? String((payload as JsonObject).detail ?? 'API request failed')
      : typeof payload === 'string' && payload.length > 0
        ? payload
        : 'API request failed';

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}