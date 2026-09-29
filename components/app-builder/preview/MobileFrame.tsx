'use client';

import { ReactNode } from 'react';

interface MobileFrameProps {
  children: ReactNode;
}

/** Mobile-width scroll panel for the module stack. Width only, not a device. */
export function MobileFrame({ children }: MobileFrameProps) {
  return (
    <div className="mx-auto w-[375px] max-h-[calc(100dvh-12rem)] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 shadow-sm scrollbar-hide">
      {children}
    </div>
  );
}
