/**
 * Merchant forgot/reset helpers.
 *
 * The reset token and the new password stay in the request body only.
 * Public results are reason codes and fixed copy, never the token or password.
 */

import { forgotPassword, resetPassword } from '@/lib/api/generated/authentication/authentication';

export const FORGOT_PASSWORD_SUCCESS_MESSAGE =
  'If an account exists with this email, you will receive a password reset link shortly.';

export const PASSWORD_RESET_COPY = {
  forgotSuccess: FORGOT_PASSWORD_SUCCESS_MESSAGE,
  invalidEmail: 'Enter a valid email address.',
  rateLimit: 'Too many password reset attempts. Please try again later.',
  generic: 'Something went wrong. Please try again.',
  invalidLink: 'This link is invalid or expired.',
  invalidLinkDetail: 'Request a new link if this one has expired or was already used.',
  passwordRules: 'Use 6 to 128 characters with at least one letter and one number.',
  mismatch: 'Passwords do not match.',
  updatedSignIn: 'Your password was updated. Sign in to continue.',
  googleHint: 'If you sign in with Google, use Continue with Google on the sign-in page.',
} as const;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

export type ForgotPasswordFailure = 'invalid_email' | 'rate_limit' | 'generic';
export type ResetPasswordFailure = 'invalid_token' | 'password' | 'rate_limit' | 'sign_in' | 'generic';

export type ForgotPasswordResult = { ok: true } | { ok: false; reason: ForgotPasswordFailure };

export type ResetPasswordResult =
  | { ok: true; token: string; refreshToken: string }
  | { ok: false; reason: ResetPasswordFailure };

export function normalizeForgotEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isEmailShape(email: string): boolean {
  return email.length > 0 && email.length <= 254 && EMAIL_SHAPE.test(email);
}

export function forgotPasswordBody(email: string): { email: string } | null {
  const normalized = normalizeForgotEmail(email);
  if (!isEmailShape(normalized)) return null;
  return { email: normalized };
}

/** Signup rule used by the reset API: 6–128 characters, one letter, one number. */
export function isAcceptableNewPassword(password: string): boolean {
  return (
    password.length >= 6 &&
    password.length <= 128 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  );
}

export function readResetToken(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const token = value.trim();
  if (!RESET_TOKEN_PATTERN.test(token)) return null;
  return token;
}

export function resetPasswordBody(
  token: string,
  newPassword: string,
): { token: string; newPassword: string } | null {
  const cleanToken = readResetToken(token);
  if (!cleanToken || !isAcceptableNewPassword(newPassword)) return null;
  return { token: cleanToken, newPassword };
}

export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password.length > 0 && password === confirmPassword;
}

function isJwt(value: string): boolean {
  const parts = value.split('.');
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

export function readResetSession(body: unknown): { token: string; refreshToken: string } | null {
  if (!body || typeof body !== 'object' || !('data' in body)) return null;
  const data = (body as { data?: unknown }).data;
  if (!data || typeof data !== 'object') return null;
  const token = (data as { token?: unknown }).token;
  const refreshToken = (data as { refreshToken?: unknown }).refreshToken;
  if (typeof token !== 'string' || typeof refreshToken !== 'string') return null;
  if (!isJwt(token) || !isJwt(refreshToken)) return null;
  return { token, refreshToken };
}

function readMessage(body: unknown): string {
  if (!body || typeof body !== 'object' || !('message' in body)) return '';
  const message = (body as { message?: unknown }).message;
  return typeof message === 'string' ? message : '';
}

function readErrorFields(body: unknown): string[] {
  if (!body || typeof body !== 'object' || !('errors' in body)) return [];
  const errors = (body as { errors?: unknown }).errors;
  if (!Array.isArray(errors)) return [];
  return errors.flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || !('field' in entry)) return [];
    const field = (entry as { field?: unknown }).field;
    return typeof field === 'string' ? [field] : [];
  });
}

export function classifyForgotFailure(status: number): ForgotPasswordFailure {
  if (status === 429) return 'rate_limit';
  if (status === 400) return 'invalid_email';
  return 'generic';
}

export function classifyResetFailure(status: number, body: unknown): ResetPasswordFailure {
  if (status === 429) return 'rate_limit';
  if (status !== 400) return 'generic';
  const fields = readErrorFields(body);
  const message = readMessage(body);
  if (fields.includes('token')) return 'invalid_token';
  if (fields.includes('newPassword')) return 'password';
  if (/password/i.test(message) && !/token/i.test(message)) return 'password';
  if (message === 'Invalid or expired reset token' || message === 'Validation failed') {
    return 'invalid_token';
  }
  return 'generic';
}

export function forgotFailureCopy(reason: ForgotPasswordFailure): string {
  if (reason === 'invalid_email') return PASSWORD_RESET_COPY.invalidEmail;
  if (reason === 'rate_limit') return PASSWORD_RESET_COPY.rateLimit;
  return PASSWORD_RESET_COPY.generic;
}

export function resetFailureCopy(reason: ResetPasswordFailure): string {
  if (reason === 'invalid_token') return PASSWORD_RESET_COPY.invalidLink;
  if (reason === 'password') return PASSWORD_RESET_COPY.passwordRules;
  if (reason === 'rate_limit') return PASSWORD_RESET_COPY.rateLimit;
  if (reason === 'sign_in') return PASSWORD_RESET_COPY.updatedSignIn;
  return PASSWORD_RESET_COPY.generic;
}

export async function requestPasswordReset(email: string): Promise<ForgotPasswordResult> {
  const body = forgotPasswordBody(email);
  if (!body) return { ok: false, reason: 'invalid_email' };

  try {
    const response = await forgotPassword(body);
    const status = response.status as number;
    if (status === 200) return { ok: true };
    return { ok: false, reason: classifyForgotFailure(status) };
  } catch {
    return { ok: false, reason: 'generic' };
  }
}

export async function submitPasswordReset(token: string, newPassword: string): Promise<ResetPasswordResult> {
  const body = resetPasswordBody(token, newPassword);
  if (!body) {
    if (!readResetToken(token)) return { ok: false, reason: 'invalid_token' };
    return { ok: false, reason: 'password' };
  }

  try {
    const response = await resetPassword(body);
    const status = response.status as number;
    if (status === 200) {
      const session = readResetSession(response.data);
      if (!session) return { ok: false, reason: 'sign_in' };
      return { ok: true, token: session.token, refreshToken: session.refreshToken };
    }
    return { ok: false, reason: classifyResetFailure(status, response.data) };
  } catch {
    return { ok: false, reason: 'generic' };
  }
}
