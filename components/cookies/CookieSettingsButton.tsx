'use client';

import { Cookie } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCookieConsent } from './CookieConsentProvider';

interface CookieSettingsButtonProps {
  className?: string;
}

export default function CookieSettingsButton({ className = '' }: CookieSettingsButtonProps) {
  const { openSettings } = useCookieConsent();

  return (
    <button
      onClick={openSettings}
      className={cn('inline-flex items-center gap-2 text-slate-400 transition-colors hover:text-purple-400', className)}
    >
      <Cookie size={16} />
      <span>Cookie Settings</span>
    </button>
  );
}
