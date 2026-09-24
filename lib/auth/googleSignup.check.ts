import assert from 'node:assert/strict';
import { resolveGoogleSignup, type GoogleIdentity, type GoogleIdTokenVerifier } from '@/lib/auth/googleSignup';

const INVITE = 'invite@store.com';
const AUDIENCE = 'test-client.apps.googleusercontent.com';
const RANDOM_PASSWORD = 'unused-secret-value';

function verifier(identity: GoogleIdentity | null, thrown = false): GoogleIdTokenVerifier {
  return async (idToken, audience) => {
    assert.equal(idToken, 'credential');
    assert.equal(audience, AUDIENCE);
    if (thrown) throw new Error('invalid token');
    return identity;
  };
}

async function mismatch() {
  const result = await resolveGoogleSignup({
    idToken: 'credential',
    audience: AUDIENCE,
    inviteEmail: INVITE,
    randomPassword: RANDOM_PASSWORD,
    verify: verifier({
      email: 'other@store.com',
      emailVerified: true,
      sub: 'google-sub',
    }),
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.status, 403);
  assert.equal(result.code, 'GOOGLE_EMAIL_MISMATCH');
  assert.equal(result.message, 'This invite is for invite@store.com. Sign in with that Google account.');
}

async function unverified() {
  const result = await resolveGoogleSignup({
    idToken: 'credential',
    audience: AUDIENCE,
    inviteEmail: INVITE,
    randomPassword: RANDOM_PASSWORD,
    verify: verifier({
      email: 'invite@store.com',
      emailVerified: false,
      sub: 'google-sub',
    }),
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.status, 403);
  assert.equal(result.code, 'GOOGLE_EMAIL_UNVERIFIED');
  assert.equal(result.message, 'This Google account has not verified its email.');
}

async function success() {
  const result = await resolveGoogleSignup({
    idToken: 'credential',
    audience: AUDIENCE,
    inviteEmail: 'Invite@Store.com',
    randomPassword: RANDOM_PASSWORD,
    verify: verifier({
      email: 'invite@store.com',
      emailVerified: true,
      sub: 'google-sub-1',
    }),
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.email, 'invite@store.com');
  assert.equal(result.googleSub, 'google-sub-1');
  assert.equal(result.password, RANDOM_PASSWORD);
  assert.ok(result.password.length >= 6);
}

async function invalidToken() {
  const result = await resolveGoogleSignup({
    idToken: 'credential',
    audience: AUDIENCE,
    inviteEmail: INVITE,
    randomPassword: RANDOM_PASSWORD,
    verify: verifier(null, true),
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.status, 401);
  assert.equal(result.code, 'GOOGLE_TOKEN_INVALID');
}

async function main() {
  await mismatch();
  await unverified();
  await success();
  await invalidToken();
  console.log('google signup checks passed');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
