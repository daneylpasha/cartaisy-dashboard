/**
 * Auth Types for Cartaisy Dashboard
 *
 * These types extend/complement the Orval-generated types to provide
 * a consistent auth interface for the dashboard.
 */

// Re-export generated types for convenience
export type {
  LoginRequest,
  LoginResponse,
  LoginResponseData,
  LoginResponseDataUser,
  GetProfileResponse,
  GetProfileResponseData,
  GetProfileResponseDataUser,
} from '@/lib/api/generated/cartaisyAPI.schemas';

/**
 * Dashboard user - extends backend user with dashboard-specific fields
 * This is what we store in context and localStorage
 */
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  fullName?: string;
  role: string;
  storeId?: string;
  storeName?: string;
  isActive: boolean;
  isEmailVerified?: boolean;
  avatar?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

/**
 * Auth state for the context
 */
export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Login result
 */
export interface LoginResult {
  success: boolean;
  error?: string;
}

/**
 * Auth context value - what useAuth() returns
 */
export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  loginWithGoogle: (idToken: string) => Promise<LoginResult>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  getToken: () => string | null;
}

/**
 * Session data format - compatible with NextAuth's useSession format
 * This allows for easier migration by providing the same interface
 */
export interface SessionData {
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
    storeId?: string;
    storeName?: string;
  };
  expires: string;
}

/**
 * Session status - matches NextAuth's status values
 */
export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

/**
 * useSession return type - matches NextAuth's format for compatibility
 */
export interface UseSessionReturn {
  data: SessionData | null;
  status: SessionStatus;
  update: () => Promise<void>;
}
