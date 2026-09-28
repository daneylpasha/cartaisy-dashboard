import assert from 'node:assert/strict';
import {
  FORGOT_PASSWORD_SUCCESS_MESSAGE,
  PASSWORD_RESET_COPY,
  classifyForgotFailure,
  classifyResetFailure,
  forgotFailureCopy,
  forgotPasswordBody,
  isAcceptableNewPassword,
  passwordsMatch,
  readResetSession,
  readResetToken,
  resetFailureCopy,
  resetPasswordBody,
} from '@/lib/auth/passwordReset';

const TOKEN = 'ab'.repeat(32);
const PASSWORD = 'resetpass123';
const ACCESS = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtZXJjaGFudCJ9.signature';
const REFRESH = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJyZWZyZXNoIn0.refresh';

assert.equal(readResetToken(TOKEN), TOKEN);
assert.equal(readResetToken(`  ${TOKEN}  `), TOKEN);
assert.equal(readResetToken(TOKEN.toUpperCase()), TOKEN.toUpperCase());
assert.equal(readResetToken(null), null);
assert.equal(readResetToken(''), null);
assert.equal(readResetToken(TOKEN.slice(0, 63)), null);
assert.equal(readResetToken(`${TOKEN}00`), null);
assert.equal(readResetToken('z'.repeat(64)), null);
assert.equal(readResetToken(`${TOKEN}?next=/dashboard`), null);

assert.equal(isAcceptableNewPassword(PASSWORD), true);
assert.equal(isAcceptableNewPassword('short1'), true);
assert.equal(isAcceptableNewPassword('abcdef'), false);
assert.equal(isAcceptableNewPassword('123456'), false);
assert.equal(isAcceptableNewPassword('ab12'), false);
assert.equal(isAcceptableNewPassword(`${'a'.repeat(128)}1`), false);
assert.equal(isAcceptableNewPassword(`${'a'.repeat(127)}1`), true);
assert.equal(passwordsMatch(PASSWORD, PASSWORD), true);
assert.equal(passwordsMatch(PASSWORD, 'resetpass124'), false);

const forgotBody = forgotPasswordBody('  Merchant@Example.com ');
assert.deepEqual(forgotBody, { email: 'merchant@example.com' });
assert.equal(forgotPasswordBody('not-an-email'), null);
assert.equal('confirmPassword' in (forgotBody ?? {}), false);

const resetBody = resetPasswordBody(` ${TOKEN} `, PASSWORD);
assert.deepEqual(resetBody, { token: TOKEN, newPassword: PASSWORD });
assert.equal(resetBody && 'confirmPassword' in resetBody, false);
assert.equal(resetPasswordBody('short', PASSWORD), null);
assert.equal(resetPasswordBody(TOKEN, 'abcdef'), null);

assert.deepEqual(readResetSession({ data: { token: ACCESS, refreshToken: REFRESH } }), {
  token: ACCESS,
  refreshToken: REFRESH,
});
assert.equal(readResetSession({ data: { token: ACCESS } }), null);
assert.equal(readResetSession({ data: { token: TOKEN, refreshToken: REFRESH } }), null);
assert.equal(readResetSession({ token: ACCESS, refreshToken: REFRESH }), null);

assert.equal(classifyForgotFailure(400), 'invalid_email');
assert.equal(classifyForgotFailure(429), 'rate_limit');
assert.equal(classifyForgotFailure(500), 'generic');
assert.equal(classifyResetFailure(429, { message: TOKEN }), 'rate_limit');
assert.equal(
  classifyResetFailure(400, { message: 'Invalid or expired reset token' }),
  'invalid_token',
);
assert.equal(
  classifyResetFailure(400, {
    message: 'Validation failed',
    errors: [{ field: 'token', message: TOKEN }],
  }),
  'invalid_token',
);
assert.equal(
  classifyResetFailure(400, {
    message: 'Password must be at least 6 characters long and include a letter and a number',
  }),
  'password',
);
assert.equal(
  classifyResetFailure(400, {
    message: 'Validation failed',
    errors: [{ field: 'newPassword', message: PASSWORD }],
  }),
  'password',
);
assert.equal(classifyResetFailure(500, { message: TOKEN }), 'generic');

const publicCopy = [
  FORGOT_PASSWORD_SUCCESS_MESSAGE,
  ...Object.values(PASSWORD_RESET_COPY),
  forgotFailureCopy('invalid_email'),
  forgotFailureCopy('rate_limit'),
  forgotFailureCopy('generic'),
  resetFailureCopy('invalid_token'),
  resetFailureCopy('password'),
  resetFailureCopy('rate_limit'),
  resetFailureCopy('sign_in'),
  resetFailureCopy('generic'),
];

for (const copy of publicCopy) {
  assert.equal(copy.includes(TOKEN), false);
  assert.equal(copy.includes(PASSWORD), false);
  assert.equal(copy.includes(ACCESS), false);
  assert.equal(/[a-f0-9]{64}/i.test(copy), false);
}

assert.equal(PASSWORD_RESET_COPY.forgotSuccess, FORGOT_PASSWORD_SUCCESS_MESSAGE);
