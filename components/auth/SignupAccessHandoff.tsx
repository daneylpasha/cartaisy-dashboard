import Link from 'next/link';
import { Clock, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type SignupTokenCheck =
  | { ok: true }
  | { ok: false; tokenError: string };

/**
 * Same decision the signup page uses after reading the invite query.
 * A missing token never calls validation. Invalid and expired results stay
 * on the handoff card. This does not create an account.
 */
export function signupTokenFailure(input: {
  token: string | null;
  validation: { valid: boolean; error?: string } | null;
}): SignupTokenCheck {
  if (!input.token) return { ok: false, tokenError: 'no_token' };
  if (input.validation?.valid) return { ok: true };
  return { ok: false, tokenError: input.validation?.error || 'Invalid token' };
}

export function signupAccessCopy(tokenError: string): {
  title: string;
  body: string;
  showsSignupForm: false;
} {
  const expired = tokenError.includes('expired');
  const missing = tokenError === 'no_token';
  return {
    showsSignupForm: false,
    title: missing ? 'Access required' : expired ? 'Link expired' : 'Invalid link',
    body: missing
      ? 'Cartaisy accounts are invite-only. Check whether the offer fits your store, or request a walkthrough. We send a signup link if we proceed.'
      : expired
        ? 'This signup link has expired. Request a walkthrough and we can send a new link.'
        : tokenError === 'Token has already been used'
          ? 'This signup link has already been used. Sign in if this is your account.'
          : 'This signup link is invalid or has been revoked. Request a walkthrough if you still want to talk.',
  };
}

export function SignupAccessHandoff({ tokenError }: { tokenError: string }) {
  const expired = tokenError.includes('expired');
  const missing = tokenError === 'no_token';
  const copy = signupAccessCopy(tokenError);
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
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-950">{copy.title}</h1>
          <p className="text-sm leading-6 text-slate-600">{copy.body}</p>
        </div>
        <div className="flex w-full flex-col gap-2">
          <Button className="h-11 w-full" asChild>
            <Link href="/fit">Check if Cartaisy fits your store</Link>
          </Button>
          <Button variant="outline" className="h-11 w-full" asChild>
            <Link href="/schedule-demo">Request a walkthrough</Link>
          </Button>
          <Button variant="outline" className="h-11 w-full" asChild>
            <Link href="/login">Go to login</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
