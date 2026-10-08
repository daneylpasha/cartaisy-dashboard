'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  PASSWORD_RESET_COPY,
  forgotFailureCopy,
  requestPasswordReset,
} from '@/lib/auth/passwordReset';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    setIsLoading(true);
    try {
      const result = await requestPasswordReset(email);
      if (result.ok) {
        setSent(true);
        return;
      }
      setError(forgotFailureCopy(result.reason));
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
            {sent ? 'Check your email' : 'Reset your password'}
          </h1>
          <CardDescription className="text-sm leading-6">
            {sent
              ? PASSWORD_RESET_COPY.forgotSuccess
              : 'Enter the email on your Cartaisy account. If it has a password, we will send a reset link.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-5">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-6 text-slate-700">
                {PASSWORD_RESET_COPY.googleHint}
              </div>
              <Button asChild className="h-11 w-full">
                <Link href="/login">Back to sign in</Link>
              </Button>
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setError('');
                }}
                className="w-full text-center text-sm text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
                >
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  autoComplete="email"
                  spellCheck={false}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <p className="text-sm leading-6 text-slate-600">{PASSWORD_RESET_COPY.googleHint}</p>

              <Button
                type="submit"
                className="h-11 w-full rounded-[4px] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-700 disabled:opacity-100"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Sending link...
                  </>
                ) : (
                  'Send reset link'
                )}
              </Button>
            </form>
          )}

          {!sent && (
            <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">
              Remember your password?{' '}
              <Link href="/login" className="font-medium text-slate-950 underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          )}
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
