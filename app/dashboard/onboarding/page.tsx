import { Suspense } from 'react';
import type { Metadata } from 'next';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export const metadata: Metadata = {
  title: 'Set up your app',
};

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f5f6] px-6 py-24 text-center text-sm text-slate-600">
          Loading setup...
        </div>
      }
    >
      <OnboardingWizard />
    </Suspense>
  );
}
