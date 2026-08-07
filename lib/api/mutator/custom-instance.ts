/**
 * Custom fetch instance for Orval-generated API functions
 * Includes token management, auto-refresh, and auth interceptors
 */

// Exported so generated API-client URL builders (lib/api/generated/**) can
// resolve the configured backend at runtime instead of a value baked in at
// orval generation time. See lib/api/generated/authentication/authentication.ts
// getLoginUrl() for the first consumer.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://cartaisy-backend-production.up.railway.app/api/v1';

// Token storage keys
const TOKEN_KEY = 'cartaisy_token';
const REFRESH_TOKEN_KEY = 'cartaisy_refresh_token';
const USER_KEY = 'cartaisy_user';

// Cookie expiry - 7 days
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

// Token storage helpers - stores in both localStorage and cookies
export const tokenStorage = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens: (token: string, refreshToken: string) => {
    if (typeof window === 'undefined') return;
    // Store in localStorage
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    // Also set cookie for middleware/SSR support
    document.cookie = `cartaisy_token=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  },

  getUser: <T = unknown>(): T | null => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  setUser: (user: unknown) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear: () => {
    if (typeof window === 'undefined') return;
    // Clear localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Clear cookie
    document.cookie = 'cartaisy_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  },
};

// Refresh token state - prevents multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    tokenStorage.clear();
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      tokenStorage.clear();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return null;
    }

    const data = await response.json();
    const { token, refreshToken: newRefreshToken, user } = data.data;

    tokenStorage.setTokens(token, newRefreshToken);
    if (user) {
      tokenStorage.setUser(user);
    }

    return token;
  } catch (error) {
    console.error('Token refresh failed:', error);
    tokenStorage.clear();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }
}

/**
 * Custom fetch options with auth support
 */
export type CustomFetchOptions = RequestInit & {
  /** Bearer token for authentication (overrides stored token) */
  token?: string;
  /** Store ID for multi-tenancy */
  storeId?: string;
  /** Skip auto-auth (for login/register endpoints) */
  skipAuth?: boolean;
};

/**
 * Custom fetch instance for Orval
 * This is the mutator that Orval will use for all generated API functions
 *
 * Features:
 * - Automatic token injection from localStorage
 * - Automatic 401 handling with token refresh
 * - Support for explicit token override
 */
export const customInstance = async <T>(
  url: string,
  options?: CustomFetchOptions
): Promise<T> => {
  const {
    token: explicitToken,
    storeId,
    skipAuth,
    headers: optionHeaders,
    ...fetchOptions
  } = options || {};

  // Get token - explicit token takes priority, then stored token
  const token = explicitToken || (!skipAuth ? tokenStorage.getToken() : null);

  // Build headers
  const headers: Record<string, string> = {
    ...(optionHeaders as Record<string, string>),
  };

  // Add auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add store ID for multi-tenancy if provided
  if (storeId) {
    headers['X-Store-ID'] = storeId;
  }

  // Make the request
  let response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Handle 401 - try refresh token (but not for auth endpoints)
  if (response.status === 401 && token && !skipAuth) {
    // Prevent multiple simultaneous refresh attempts
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken();
    }

    const newToken = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;

    if (newToken) {
      // Retry request with new token
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, {
        ...fetchOptions,
        headers,
      });
    }
  }

  const responseHeaders = response.headers;

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return {
      data: undefined,
      status: response.status,
      headers: responseHeaders,
    } as T;
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = undefined;
  }

  return {
    data,
    status: response.status,
    headers: responseHeaders,
  } as T;
};

// Export as default for Orval mutator
export default customInstance;
