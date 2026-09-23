'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, ShieldX, Clock } from 'lucide-react';

interface TokenData {
  email: string;
  storeName?: string;
  expiresAt: string;
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
      } catch (err) {
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

  const isPasswordStrong = Object.values(passwordStrength).filter(Boolean).length >= 3;
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
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating token
  if (isValidatingToken) {
    return (
      <div className="w-full">
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-slate-600">Validating your signup link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No token or invalid token - show access denied
  if (!tokenValid) {
    return (
      <div className="w-full">
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-6 text-center">
              {tokenError === 'no_token' ? (
                <>
                  <div className="p-4 bg-amber-100 rounded-full">
                    <ShieldX className="w-12 h-12 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Required</h2>
                    <p className="text-slate-600 max-w-sm">
                      Signup is invite-only. You need a valid onboarding link to create an account.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 max-w-sm">
                    <p className="text-sm text-slate-600">
                      If you're a store owner and would like to use Cartaisy, please contact us to get your onboarding link.
                    </p>
                  </div>
                </>
              ) : tokenError.includes('expired') ? (
                <>
                  <div className="p-4 bg-red-100 rounded-full">
                    <Clock className="w-12 h-12 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Link Expired</h2>
                    <p className="text-slate-600 max-w-sm">
                      This signup link has expired. Please contact us to get a new onboarding link.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-red-100 rounded-full">
                    <ShieldX className="w-12 h-12 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Invalid Link</h2>
                    <p className="text-slate-600 max-w-sm">
                      {tokenError === 'Token has already been used'
                        ? 'This signup link has already been used.'
                        : 'This signup link is invalid or has been revoked.'}
                    </p>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    Go to Login
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid token - show signup form
  return (
    <div className="w-full">
      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-1">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Valid onboarding link
            </div>
            <CardTitle className="text-3xl font-bold">Create Your Account</CardTitle>
            <CardDescription>
              Complete your signup to get started with Cartaisy
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName" className="text-sm font-medium">
                Store Name
              </Label>
              <Input
                id="storeName"
                type="text"
                placeholder="e.g., Nike Official Store"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                disabled={isLoading || !!tokenData?.storeName}
                className="h-10"
                required
              />
              {tokenData?.storeName && (
                <p className="text-xs text-slate-500">Store name pre-filled from your invitation</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || !!tokenData?.email}
                className="h-10"
                required
              />
              {tokenData?.email && (
                <p className="text-xs text-slate-500">Email pre-filled from your invitation</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {password && (
                <div className="space-y-2 mt-3 p-3 bg-slate-50 rounded-lg">
                  <div className="text-xs font-semibold text-slate-600">Password strength:</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {passwordStrength.hasMinLength ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300" />
                      )}
                      <span className="text-xs text-slate-600">At least 6 characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordStrength.hasUpperCase ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300" />
                      )}
                      <span className="text-xs text-slate-600">Uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordStrength.hasLowerCase ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300" />
                      )}
                      <span className="text-xs text-slate-600">Lowercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordStrength.hasNumber ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300" />
                      )}
                      <span className="text-xs text-slate-600">Number</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {confirmPassword && (
                <div className="flex items-center gap-2 mt-2">
                  {passwordsMatch ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-xs text-red-600 font-medium">Passwords don't match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10 bg-blue-600 hover:bg-blue-700"
              disabled={isLoading || !passwordsMatch || storeName.length < 2}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Already have an account?</span>
              </div>
            </div>
          </form>

          <div className="mt-6 space-y-4">
            <p className="text-center text-sm text-slate-600">
              <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                Sign in instead
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full">
          <Card className="border-0 shadow-lg">
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-slate-600">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
