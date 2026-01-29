'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LandingNavbar from './LandingNavbar';
import LandingFooter from './LandingFooter';
import LottieAnimation from '@/components/ui/LottieAnimation';
import flowAnimation from '@/public/lottie/ai animation Flow 1.json';

interface PageLayoutProps {
  children: React.ReactNode;
  showBackLink?: boolean;
  backHref?: string;
  backLabel?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl' | '6xl';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
};

export default function PageLayout({
  children,
  showBackLink = true,
  backHref = '/',
  backLabel = 'Back to Home',
  maxWidth = '4xl',
}: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      {/* Flow Animation Background */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <LottieAnimation
          animationData={flowAnimation}
          className="w-[1000px] h-[1000px] opacity-[0.06]"
          loop={true}
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        <LandingNavbar />
        <main className="flex-1 pt-24 pb-16">
          <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4`}>
            {showBackLink && (
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8 transition-colors"
              >
                <ArrowLeft size={16} />
                {backLabel}
              </Link>
            )}
            {children}
          </div>
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}
