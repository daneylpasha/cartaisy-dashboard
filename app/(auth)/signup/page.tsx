'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, CheckCircle2, Circle, Loader2, ShieldX, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TokenData {
  email: string;
  storeName?: string;
  expiresAt: string;
}

const lockedFieldClass =
  'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-800 disabled:opacity-100';

function PasswordInput({
  id,
  value,
  onChange,
  shown,
  onToggle,
  placeholder,
  disabled,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  shown: boolean;
  onToggle: () => void;
  placeholder: string;
  disabled: boolean;
  autoComplete: string;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={shown ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoComplete={autoComplete}
        className="h-11 pr-11"
        required
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

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { login } = useAuth();

  // Token validation state
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [tokenData, setTokenData] = useState<TokenData | null>(null);

  // Form state
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidatingToken(false);
        setTokenValid(false);
        setTokenError('no_token');
        return;
      }

      try {
        const res = await fetch(`/api/auth/validate-token?token=${token}`);
        const data = await res.json();

        if (data.valid) {
          setTokenValid(true);
          setTokenData(data.data);
          // Pre-fill email and store name from token
          if (data.data.email) setEmail(data.data.email);
          if (data.data.storeName) setStoreName(data.data.storeName);
        } else {
          setTokenValid(false);
          setTokenError(data.error || 'Invalid token');
        }
      } catch {
        setTokenValid(false);
        setTokenError('Failed to validate token');
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const passwordStrength = {
    hasMinLength: password.length >= 6,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
  };

  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid signup link');
      return;
    }

    if (!storeName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (storeName.length < 2) {
      setError('Store name must be at least 2 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Create user and store in database with token
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, storeName, token }),
      });

      const signupData = await signupRes.json();

      if (!signupRes.ok) {
        setError(signupData.message || 'Sign up failed. Please try again.');
        return;
      }

      // Sign in after successful signup
      const result = await login({ email, password });

      if (result.success) {
        router.push('/dashboard/onboarding');
      } else {
        // Registration succeeded but login failed - redirect to login
        router.push('/login?registered=true');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidatingToken) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-10">
          <Loader2 className="size-6 animate-spin text-slate-700" />
          <p className="text-sm text-slate-600">Validating your signup link...</p>
        </CardContent>
      </Card>
    );
  }

  if (!tokenValid) {
    const expired = tokenError.includes('expired');
    const missing = tokenError === 'no_token';
    const Icon = expired ? Clock : ShieldX;

    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-5 py-2 text-center">
          <div
            className={cn(
              'flex size-12 items-center justify-center rounded-full',
              missing ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
            )}
          >
            <Icon className="size-6" aria-hidden />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-950">
              {missing ? 'Access required' : expired ? 'Link expired' : 'Invalid link'}
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              {missing
                ? 'Signup is invite-only. You need a valid onboarding link to create an account.'
                : expired
                  ? 'This signup link has expired. Contact us for a new onboarding link.'
                  : tokenError === 'Token has already been used'
                    ? 'This signup link has already been used.'
                    : 'This signup link is invalid or has been revoked.'}
            </p>
          </div>
          {missing && (
            <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm leading-6 text-slate-600">
              If you are a store owner and would like to use Cartaisy, contact us for an onboarding link.
            </div>
          )}
          <Button variant="outline" className="h-11 w-full" asChild>
            <Link href="/login">Go to login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const storeLocked = !!tokenData?.storeName;
  const emailLocked = !!tokenData?.email;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4">
        <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="size-3.5" aria-hidden />
          Valid onboarding link
        </div>
        <div className="space-y-1.5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-950">
            Create your account
          </h1>
          <CardDescription className="text-sm leading-6">
            Complete your signup to get started with Cartaisy
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="storeName">Store name</Label>
            <Input
              id="storeName"
              type="text"
              placeholder="e.g., Nike Official Store"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              disabled={isLoading || storeLocked}
              autoComplete="organization"
              aria-describedby={storeLocked ? 'storeName-hint' : undefined}
              className={cn('h-11', storeLocked && lockedFieldClass)}
              required
            />
            {storeLocked && (
              <p id="storeName-hint" className="text-xs leading-5 text-slate-500">
                Store name pre-filled from your invitation
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || emailLocked}
              autoComplete="email"
              aria-describedby={emailLocked ? 'email-hint' : undefined}
              className={cn('h-11', emailLocked && lockedFieldClass)}
              required
            />
            {emailLocked && (
              <p id="email-hint" className="text-xs leading-5 text-slate-500">
                Email pre-filled from your invitation
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={setPassword}
              shown={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
              placeholder="Create a strong password"
              disabled={isLoading}
              autoComplete="new-password"
            />
            {password && (
              <ul className="space-y-1.5 pt-1 text-xs">
                <Rule met={passwordStrength.hasMinLength} label="At least 6 characters" />
                <Rule met={passwordStrength.hasUpperCase} label="Uppercase letter" />
                <Rule met={passwordStrength.hasLowerCase} label="Lowercase letter" />
                <Rule met={passwordStrength.hasNumber} label="Number" />
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={setConfirmPassword}
              shown={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((current) => !current)}
              placeholder="Confirm your password"
              disabled={isLoading}
              autoComplete="new-password"
            />
            {confirmPassword && (
              <p
                className={cn(
                  'flex items-center gap-2 text-xs font-medium',
                  passwordsMatch ? 'text-emerald-700' : 'text-red-700'
                )}
              >
                {passwordsMatch ? (
                  <CheckCircle2 className="size-3.5" aria-hidden />
                ) : (
                  <Circle className="size-3.5" aria-hidden />
                )}
                {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
              </p>
            )}
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="h-11 w-full disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-700 disabled:opacity-100"
            disabled={isLoading || !passwordsMatch || storeName.length < 2}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </form>

        <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-slate-950 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-10">
            <Loader2 className="size-6 animate-spin text-slate-700" />
            <p className="text-sm text-slate-600">Loading...</p>
          </CardContent>
        </Card>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
