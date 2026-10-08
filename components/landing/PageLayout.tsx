'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { marketingTypeClass } from '@/lib/fonts/manrope';
import { inkBackLinkClass } from '@/lib/marketing/publicInk';
import LandingNavbar from './LandingNavbar';
import LandingFooter from './LandingFooter';

interface PageLayoutProps {
  children: React.ReactNode;
  showBackLink?: boolean;
  backHref?: string;
  backLabel?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl' | '6xl';
  /** Opt-in homepage ink. The default stays the purple marketing gradient. */
  surface?: 'gradient' | 'ink';
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
  surface = 'gradient',
}: PageLayoutProps) {
  const ink = surface === 'ink';
  return (
    <div className={`${marketingTypeClass} min-h-screen flex flex-col ${ink ? 'bg-[#111210]' : 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'} relative`}>
      <div className="relative z-10 min-h-screen flex flex-col">
        <LandingNavbar />
        <main className="flex-1 pt-24 pb-16">
          <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4`}>
            {showBackLink && (
              <Link
                href={backHref}
                className={ink ? inkBackLinkClass : 'inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8 transition-colors'}
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
