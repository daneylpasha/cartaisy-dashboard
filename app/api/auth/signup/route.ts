import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { Store } from '@/models/Store';
import { OnboardingToken, type IOnboardingToken } from '@/models/OnboardingToken';
import { googleAudience, verifyGoogleIdToken } from '@/lib/auth/googleIdToken';
import { resolveGoogleSignup } from '@/lib/auth/googleSignup';

async function createOwnerAccount(input: {
  email: string;
  password: string;
  storeName: string;
  onboardingToken: IOnboardingToken;
  authProvider: 'password' | 'google';
  googleSub?: string;
}) {
  const { email, password, storeName, onboardingToken, authProvider, googleSub } = input;

  const slug = storeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  let finalSlug = slug;
  const existingStore = await Store.findOne({ slug });
  if (existingStore) {
    finalSlug = `${slug}-${Date.now().toString(36)}`;
  }

  const store = await Store.create({
    name: storeName,
    slug: finalSlug,
    shopify: {
      isConnected: false,
    },
    plan: {
      type: 'free',
      maxMembers: 5,
    },
    settings: {
      timezone: 'UTC',
      currency: 'USD',
    },
    isActive: true,
  });

  const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

  // The User pre-save hook bcrypt-hashes `password`. Google accounts pass a
  // random secret here so the stored hash cannot be used to sign in.
  const user = await User.create({
    email: email.toLowerCase(),
    password,
    storeId: store._id.toString(),
    storeName,
    role: 'super_admin',
    name,
    isActive: true,
    authProvider,
    ...(googleSub ? { googleSub } : {}),
  });

  onboardingToken.status = 'used';
  onboardingToken.usedAt = new Date();
  onboardingToken.usedBy = new mongoose.Types.ObjectId(user._id);
  await onboardingToken.save();

  return {
    userId: user._id.toString(),
    storeId: store._id.toString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, storeName, token } = body as {
      email?: string;
      password?: string;
      storeName?: string;
      token?: string;
      googleIdToken?: string;
    };
    const googleIdToken = typeof body.googleIdToken === 'string' ? body.googleIdToken.trim() : '';
    const useGoogle = googleIdToken.length > 0;

    if (!storeName) {
      return NextResponse.json(
        { message: useGoogle ? 'Store name is required' : 'Email, password, and store name are required' },
        { status: 400 }
      );
    }

    if (storeName.length < 2) {
      return NextResponse.json(
        { message: 'Store name must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { message: 'Valid onboarding token is required to sign up' },
        { status: 403 }
      );
    }

    if (!useGoogle) {
      if (!email || !password) {
        return NextResponse.json(
          { message: 'Email, password, and store name are required' },
          { status: 400 }
        );
      }

      if (password.length < 6) {
        return NextResponse.json(
          { message: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }
    }

    await connectToDatabase();

    const onboardingToken = await OnboardingToken.findOne({ token });

    if (!onboardingToken) {
      return NextResponse.json(
        { message: 'Invalid onboarding token' },
        { status: 403 }
      );
    }

    if (new Date() > onboardingToken.expiresAt) {
      if (onboardingToken.status === 'pending') {
        onboardingToken.status = 'expired';
        await onboardingToken.save();
      }
      return NextResponse.json(
        { message: 'Onboarding token has expired' },
        { status: 403 }
      );
    }

    if (onboardingToken.status === 'used') {
      return NextResponse.json(
        { message: 'Onboarding token has already been used' },
        { status: 403 }
      );
    }

    if (onboardingToken.status === 'revoked') {
      return NextResponse.json(
        { message: 'Onboarding token has been revoked' },
        { status: 403 }
      );
    }

    let accountEmail = '';
    let accountPassword = '';
    let authProvider: 'password' | 'google' = 'password';
    let googleSub: string | undefined;

    if (useGoogle) {
      const audience = googleAudience();
      if (!audience) {
        return NextResponse.json(
          {
            message: 'Google sign-in is not available right now.',
            code: 'GOOGLE_NOT_CONFIGURED',
          },
          { status: 503 }
        );
      }

      const decision = await resolveGoogleSignup({
        idToken: googleIdToken,
        audience,
        inviteEmail: onboardingToken.email,
        verify: verifyGoogleIdToken,
        randomPassword: randomBytes(32).toString('base64url'),
      });

      if (!decision.ok) {
        return NextResponse.json(
          { message: decision.message, code: decision.code },
          { status: decision.status }
        );
      }

      accountEmail = decision.email;
      accountPassword = decision.password;
      authProvider = 'google';
      googleSub = decision.googleSub;
    } else {
      accountEmail = email!.toLowerCase();
      accountPassword = password!;

      if (onboardingToken.email && onboardingToken.email.toLowerCase() !== accountEmail) {
        return NextResponse.json(
          { message: 'Email does not match the onboarding invitation' },
          { status: 403 }
        );
      }
    }

    const existingUser = await User.findOne({ email: accountEmail });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const created = await createOwnerAccount({
      email: accountEmail,
      password: accountPassword,
      storeName,
      onboardingToken,
      authProvider,
      googleSub,
    });

    return NextResponse.json(
      {
        message: 'User and store created successfully',
        userId: created.userId,
        storeId: created.storeId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
