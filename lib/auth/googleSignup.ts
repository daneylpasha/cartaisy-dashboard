export interface GoogleIdentity {
  email: string;
  emailVerified: boolean;
  sub: string;
}

export type GoogleIdTokenVerifier = (
  idToken: string,
  audience: string,
) => Promise<GoogleIdentity | null>;

export type GoogleSignupDecision =
  | {
      ok: true;
      email: string;
      googleSub: string;
      password: string;
    }
  | {
      ok: false;
      status: 401 | 403;
      code: 'GOOGLE_TOKEN_INVALID' | 'GOOGLE_EMAIL_UNVERIFIED' | 'GOOGLE_EMAIL_MISMATCH';
      message: string;
    };

const INVALID_TOKEN: GoogleSignupDecision = {
  ok: false,
  status: 401,
  code: 'GOOGLE_TOKEN_INVALID',
  message: 'Google sign-in could not be verified. Try again.',
};

/**
 * Decide whether an invite signup may proceed from a verified Google identity.
 * The verifier is injected so tests can cover mismatch, unverified, and success
 * without calling Google.
 */
export async function resolveGoogleSignup(input: {
  idToken: string;
  audience: string;
  inviteEmail: string;
  verify: GoogleIdTokenVerifier;
  randomPassword: string;
}): Promise<GoogleSignupDecision> {
  let identity: GoogleIdentity | null = null;
  try {
    identity = await input.verify(input.idToken, input.audience);
  } catch {
    identity = null;
  }

  if (!identity?.email || !identity.sub) {
    return INVALID_TOKEN;
  }

  if (!identity.emailVerified) {
    return {
      ok: false,
      status: 403,
      code: 'GOOGLE_EMAIL_UNVERIFIED',
      message: 'This Google account has not verified its email.',
    };
  }

  const inviteEmail = input.inviteEmail.trim();
  if (!inviteEmail) {
    return {
      ok: false,
      status: 403,
      code: 'GOOGLE_EMAIL_MISMATCH',
      message: 'This invite does not include an email address.',
    };
  }

  if (identity.email.trim().toLowerCase() !== inviteEmail.toLowerCase()) {
    return {
      ok: false,
      status: 403,
      code: 'GOOGLE_EMAIL_MISMATCH',
      message: `This invite is for ${inviteEmail}. Sign in with that Google account.`,
    };
  }

  return {
    ok: true,
    email: identity.email.trim().toLowerCase(),
    googleSub: identity.sub,
    password: input.randomPassword,
  };
}
