'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type {
  AuthState,
  AuthUser,
  LoginCredentials,
  LoginResult,
  AuthContextValue,
  UseSessionReturn,
} from './types';
import { tokenStorage } from '@/lib/api/mutator/custom-instance';
import { login as apiLogin, getProfile } from '@/lib/api/generated/authentication/authentication';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/signup'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Initialize auth state from storage on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenStorage.getToken();
      const storedUser = tokenStorage.getUser<AuthUser>();

      if (token && storedUser) {
        try {
          // Verify token by fetching profile
          const response = await getProfile();

          if (response.status === 200 && response.data?.data?.user) {
            const profileUser = response.data.data.user;

            // Map profile response to AuthUser
            const user: AuthUser = {
              id: profileUser.id,
              email: profileUser.email,
              name: profileUser.fullName || storedUser.name,
              fullName: profileUser.fullName,
              role: profileUser.role,
              // GET /auth/profile always returns storeId/storeName freshly
              // resolved from the DB (see cartaisy-backend authTsoaController.ts
              // getProfile) - it's never actually missing them, so trust it
              // over the cached localStorage copy, which goes stale whenever
              // the account's store changes or an old session lingers.
              // Use `??`, not `||`: the backend defaults storeId/storeName to
              // '' (empty string) for a user with no store, and `||` would
              // treat that legitimate empty value as "missing" and silently
              // fall back to the stale cached value - the same bug this is
              // fixing. Only fall back on a genuinely absent (null/undefined)
              // field.
              storeId: profileUser.storeId ?? storedUser.storeId,
              storeName: profileUser.storeName ?? storedUser.storeName,
              isActive: profileUser.isActive,
              isEmailVerified: profileUser.isEmailVerified,
              avatar: profileUser.avatar,
              createdAt: profileUser.createdAt,
              lastLoginAt: profileUser.lastLoginAt,
            };

            tokenStorage.setUser(user);
            setState({
              user,
              isLoading: false,
              isAuthenticated: true,
              error: null,
            });
          } else {
            throw new Error('Invalid profile response');
          }
        } catch (error) {
          // Token invalid, clear storage
          console.error('Auth init failed:', error);
          tokenStorage.clear();
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: null,
          });
        }
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    };

    initAuth();
  }, []);

  // Redirect based on auth state - only for auth routes (login/signup)
  // Dashboard protection is handled by middleware.ts to avoid race conditions
  useEffect(() => {
    if (state.isLoading) return;

    const isAuthRoute = authRoutes.some((route) => pathname?.startsWith(route));

    // Redirect authenticated users away from auth routes (login/signup)
    if (state.isAuthenticated && isAuthRoute) {
      router.push('/dashboard');
    }
  }, [state.isAuthenticated, state.isLoading, pathname, router]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResult> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiLogin(credentials);

      if (response.status !== 200 || !response.data?.data) {
        const errorMessage =
          response.data?.message || 'Login failed. Please check your credentials.';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }

      const { token, refreshToken, user: loginUser } = response.data.data;

      // Validate admin role for dashboard access
      if (!['super_admin', 'admin'].includes(loginUser.role)) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Dashboard access requires admin privileges',
        }));
        return { success: false, error: 'Dashboard access requires admin privileges' };
      }

      // Map login response to AuthUser
      const user: AuthUser = {
        id: loginUser.id,
        email: loginUser.email,
        name: loginUser.name,
        role: loginUser.role,
        storeId: loginUser.storeId,
        storeName: loginUser.storeName,
        isActive: loginUser.isActive,
        isEmailVerified: loginUser.isEmailVerified,
        avatar: loginUser.avatar,
        lastLoginAt: loginUser.lastLoginAt,
      };

      // Debug: Log cookie being set
      console.log('[Auth] Login successful, setting cookie for token:', token.substring(0, 20) + '...');
      console.log('[Auth] User storeId:', user.storeId, 'storeName:', user.storeName);

      // Store tokens and user
      tokenStorage.setTokens(token, refreshToken);
      tokenStorage.setUser(user);

      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });

      return { success: true };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'An error occurred during login';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
    router.push('/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await getProfile();

      if (response.status === 200 && response.data?.data?.user) {
        const profileUser = response.data.data.user;
        const storedUser = tokenStorage.getUser<AuthUser>();

        const user: AuthUser = {
          id: profileUser.id,
          email: profileUser.email,
          name: profileUser.fullName || storedUser?.name,
          fullName: profileUser.fullName,
          role: profileUser.role,
          // Same fix and reasoning as initAuth() above: trust the fresh
          // profile response, `??` (not `||`) so a legitimate '' storeId
          // isn't mistaken for "missing" and overwritten by a stale cache.
          storeId: profileUser.storeId ?? storedUser?.storeId,
          storeName: profileUser.storeName ?? storedUser?.storeName,
          isActive: profileUser.isActive,
          isEmailVerified: profileUser.isEmailVerified,
          avatar: profileUser.avatar,
          createdAt: profileUser.createdAt,
          lastLoginAt: profileUser.lastLoginAt,
        };

        tokenStorage.setUser(user);
        setState((prev) => ({ ...prev, user }));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  const getToken = useCallback(() => {
    return tokenStorage.getToken();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refreshUser,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Main auth hook - use this for new code
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Compatibility hook - matches NextAuth's useSession() format
 * This makes migration easier by providing the same interface
 *
 * Usage:
 *   const { data: session, status } = useSession();
 *   if (status === 'authenticated') {
 *     console.log(session.user.email);
 *   }
 */
export function useSession(): UseSessionReturn {
  const { user, isLoading, isAuthenticated, refreshUser } = useAuth();

  return {
    data: user
      ? {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            storeId: user.storeId,
            storeName: user.storeName,
          },
          expires: '',
        }
      : null,
    status: isLoading
      ? 'loading'
      : isAuthenticated
        ? 'authenticated'
        : 'unauthenticated',
    update: refreshUser,
  };
}

/**
 * Compatibility function - matches NextAuth's signOut()
 */
export function signOut() {
  // This is a workaround since we can't use hooks outside components
  // Clear storage directly
  tokenStorage.clear();
  // Redirect to login
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
