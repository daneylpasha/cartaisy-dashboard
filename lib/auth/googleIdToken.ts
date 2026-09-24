import { OAuth2Client } from 'google-auth-library';
import type { GoogleIdentity } from '@/lib/auth/googleSignup';

export function googleAudience(): string | null {
  const configured = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const audience = configured?.trim();
  return audience || null;
}

/** Verify a Google Identity Services credential. Server-side only. */
export async function verifyGoogleIdToken(
  idToken: string,
  audience: string,
): Promise<GoogleIdentity | null> {
  const client = new OAuth2Client(audience);
  const ticket = await client.verifyIdToken({ idToken, audience });
  const payload = ticket.getPayload();
  if (!payload?.email || !payload.sub) return null;
  return {
    email: payload.email,
    emailVerified: payload.email_verified === true,
    sub: payload.sub,
  };
}
