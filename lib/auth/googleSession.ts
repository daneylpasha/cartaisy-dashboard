import type { LoginResponse } from '@/lib/api/generated/cartaisyAPI.schemas';
import { API_URL, customInstance } from '@/lib/api/mutator/custom-instance';

export function isGoogleSignInEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim());
}

export function googleAuthErrorMessage(code: string | undefined, fallback?: string): string {
  switch (code) {
    case 'NO_MERCHANT_ACCOUNT':
      return 'No Cartaisy account for this Google email yet. Ask your Cartaisy contact for an invite.';
    case 'GOOGLE_TOKEN_INVALID':
      return 'Google sign-in could not be verified. Try again.';
    case 'ACCOUNT_INACTIVE':
      return 'This account is inactive. Contact your store administrator.';
    case 'GOOGLE_NOT_CONFIGURED':
      return 'Google sign-in is not available right now.';
    default:
      return fallback || 'Google sign-in failed. Please try again.';
  }
}

export function readGoogleError(data: unknown): { code?: string; message?: string } {
  if (!data || typeof data !== 'object') return {};
  const body = data as { code?: unknown; message?: unknown };
  return {
    code: typeof body.code === 'string' ? body.code : undefined,
    message: typeof body.message === 'string' ? body.message : undefined,
  };
}

type GoogleLoginBody = LoginResponse & { code?: string };

export async function postGoogleLogin(idToken: string): Promise<{ status: number; data: GoogleLoginBody | undefined }> {
  const response = await customInstance<{ data: GoogleLoginBody | undefined; status: number }>(
    `${API_URL}/auth/google`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      skipAuth: true,
    },
  );
  return { status: response.status, data: response.data };
}
