'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Circle, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  PASSWORD_RESET_COPY,
  isAcceptableNewPassword,
  passwordsMatch,
  readResetToken,
  resetFailureCopy,
  submitPasswordReset,
} from '@/lib/auth/passwordReset';

function stripResetTokenFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('token')) return;
  url.searchParams.delete('token');
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, '', next);
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  shown,
  onToggle,
  autoComplete,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  shown: boolean;
  onToggle: () => void;
  autoComplete: string;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={id}
          type={shown ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required
          disabled={disabled}
          className="h-11 pr-11"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 hover:text-slate-900 disabled:opacity-50"
          disabled={disabled}
          aria-label={shown ? 'Hide password' : 'Show password'}
        >
          {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

function Rule({ met, label }: { met: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {met ? (
        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
      ) : (
        <Circle className="size-3.5 shrink-0 text-slate-300" aria-hidden />
      )}
      <span className={met ? 'text-slate-700' : 'text-slate-500'}>{label}</span>
    </li>
  );
}

function InvalidLinkCard() {
  return (
    <div>
      <Card>
        <CardHeader className="flex flex-col gap-1.5">
          <div className="mb-1 flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-700">
            <KeyRound className="size-5" aria-hidden />
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-950">
            {PASSWORD_RESET_COPY.invalidLink}
          </h1>
          <CardDescription className="text-sm leading-6">{PASSWORD_RESET_COPY.invalidLinkDetail}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild className="h-11 w-full">
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
      <p className="mt-6 text-center">
        <Link
          href="/"
          className="text-sm text-slate-500 underline-offset-4 hover:text-slate-950 hover:underline"
        >
          Back to home
        </Link>
      </p>
    </div>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithSessionTokens, isLoading: authLoading } = useAuth();
  const [token] = useState(() => readResetToken(searchParams.get('token')));
  const [linkDead, setLinkDead] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!token || linkDead) {
    return <InvalidLinkCard />;
  }

  const rules = {
    length: password.length >= 6 && password.length <= 128,
    letter: /[A-Za-z]/.test(password),
    number: /\d/.test(password),
  };
  const matches = passwordsMatch(password, confirmPassword);
  const busy = isLoading || authLoading;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!passwordsMatch(password, confirmPassword)) {
      setError(PASSWORD_RESET_COPY.mismatch);
      return;
    }
    if (!isAcceptableNewPassword(password)) {
      setError(PASSWORD_RESET_COPY.passwordRules);
      return;
    }

    setIsLoading(true);
    try {
      const result = await submitPasswordReset(token, password);

      if (!result.ok) {
        if (result.reason === 'invalid_token') {
          stripResetTokenFromUrl();
          setPassword('');
          setConfirmPassword('');
          setLinkDead(true);
          return;
        }
        if (result.reason === 'sign_in') {
          stripResetTokenFromUrl();
          setPassword('');
          setConfirmPassword('');
          router.replace('/login?reset=success');
          return;
        }
        setError(resetFailureCopy(result.reason));
        return;
      }

      stripResetTokenFromUrl();
      setPassword('');
      setConfirmPassword('');
      const session = await signInWithSessionTokens(result.token, result.refreshToken);
      if (session.success) {
        router.replace('/dashboard');
        return;
      }
      if (session.error === 'Dashboard access requires admin privileges') {
        setError(session.error);
        return;
      }
      router.replace('/login?reset=success');
    } catch {
      setError(PASSWORD_RESET_COPY.generic);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-col gap-1.5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-950">
            Choose a new password
          </h1>
          <CardDescription className="text-sm leading-6">
            Use 6 to 128 characters, with a letter and a number. You will stay signed in after it saves.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            <PasswordField
              id="password"
              label="New password"
              value={password}
              onChange={setPassword}
              shown={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
              autoComplete="new-password"
              disabled={busy}
            />

            {password && (
              <ul className="space-y-1.5 text-xs">
                <Rule met={rules.length} label="6 to 128 characters" />
                <Rule met={rules.letter} label="A letter" />
                <Rule met={rules.number} label="A number" />
              </ul>
            )}

            <PasswordField
              id="confirmPassword"
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              shown={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((current) => !current)}
              autoComplete="new-password"
              disabled={busy}
            />

            {confirmPassword && (
              <p
                className={`flex items-center gap-2 text-xs font-medium ${
                  matches ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {matches ? (
                  <CheckCircle2 className="size-3.5" aria-hidden />
                ) : (
                  <Circle className="size-3.5" aria-hidden />
                )}
                {matches ? 'Passwords match' : PASSWORD_RESET_COPY.mismatch}
              </p>
            )}

            <Button
              type="submit"
              className="h-11 w-full disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-700 disabled:opacity-100"
              disabled={busy}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Saving password...
                </>
              ) : (
                'Save password'
              )}
            </Button>
          </form>

          <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">
            <Link href="/login" className="font-medium text-slate-950 underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
