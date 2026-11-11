import { ApiError } from '../types';
import { fetchWithTimeout } from './adapter';

const TOKEN_KEY = 'promptual:curator:tokens';
const EXPIRY_MARGIN_MS = 60_000;
const DEFAULT_SITE_BASE_URL = 'https://promptual.puntuale.nl';
const CURATOR_SCOPE = import.meta.env.VITE_OAUTH_SCOPE || 'nsfw_curator';

export interface CuratorTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
}

function siteBase(): string {
  return (import.meta.env.VITE_SITE_BASE_URL || DEFAULT_SITE_BASE_URL).replace(/\/+$/, '');
}

function clientId(): string {
  return import.meta.env.VITE_OAUTH_CLIENT_ID || '';
}

export function isOauthConfigured(): boolean {
  return clientId().length > 0;
}

export function readTokens(): CuratorTokens | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as CuratorTokens;
    return parsed && typeof parsed.accessToken === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

function saveTokens(tokens: CuratorTokens | null) {
  try {
    if (tokens) {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (error) {
    console.warn('Could not persist curator session:', error);
  }
}

async function requestToken(params: Record<string, string>): Promise<CuratorTokens> {
  const url = `${siteBase()}/oauth/token`;
  const body = new URLSearchParams({ client_id: clientId(), ...params });
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const invalid = response.status === 400 || response.status === 401;
    throw new ApiError(
      invalid ? 'Login failed. Check your username and password.' : `Login failed (HTTP ${response.status}).`,
      response.status,
      url
    );
  }

  const data = await response.json();
  if (!data?.access_token) {
    throw new ApiError('Login failed: unexpected response from the server.', response.status, url);
  }

  return {
    accessToken: String(data.access_token),
    refreshToken: data.refresh_token ? String(data.refresh_token) : null,
    expiresAt: Date.now() + (Number(data.expires_in) || 300) * 1000,
  };
}

export async function login(username: string, password: string): Promise<void> {
  if (!isOauthConfigured()) {
    throw new ApiError('Curator login is not configured for this site yet.');
  }
  const tokens = await requestToken({ grant_type: 'password', username, password, scope: CURATOR_SCOPE });
  saveTokens(tokens);
}

export function logout() {
  saveTokens(null);
}

export function isLoggedIn(): boolean {
  return readTokens() !== null;
}

/** Returns a valid access token, refreshing it when it is about to expire. */
export async function getAccessToken(forceRefresh = false): Promise<string | null> {
  const tokens = readTokens();
  if (!tokens) {
    return null;
  }

  if (!forceRefresh && tokens.expiresAt - Date.now() > EXPIRY_MARGIN_MS) {
    return tokens.accessToken;
  }

  if (!tokens.refreshToken) {
    logout();
    return null;
  }

  try {
    const refreshed = await requestToken({ grant_type: 'refresh_token', refresh_token: tokens.refreshToken });
    saveTokens({ ...refreshed, refreshToken: refreshed.refreshToken ?? tokens.refreshToken });
    return refreshed.accessToken;
  } catch (error) {
    if (error instanceof ApiError && (error.statusCode === 400 || error.statusCode === 401)) {
      logout();
    }
    return null;
  }
}
