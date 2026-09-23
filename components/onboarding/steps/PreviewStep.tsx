'use client';

import { SmartHomePreview } from '@/components/onboarding/SmartHomePreview';
import { WizardFooter } from '@/components/onboarding/WizardChrome';
import type { BrandingDraft, LockedCatalog } from '@/lib/onboarding/types';

interface PreviewStepProps {
  draft: BrandingDraft;
  catalog: LockedCatalog;
  onBack: () => void;
  onContinue: () => void;
}

export function PreviewStep({ draft, catalog, onBack, onContinue }: PreviewStepProps) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white px-6 py-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-10 sm:py-10">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Step 3</p>
          <h1 className="font-heading mt-3 text-[1.75rem] font-semibold tracking-tight text-slate-950">
            Preview your home
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-7 text-slate-600">
            This is a starting home. You do not need to build it. You can adjust the layout later.
          </p>
          <ul className="mt-6 space-y-2 text-sm leading-6 text-slate-600">
            <li>Your app name, colors, and images are applied.</li>
            <li>Featured products are placeholders until sync finishes.</li>
            <li>Collection names, when we have them, stay read only.</li>
          </ul>
          <div className="mt-8 lg:hidden">
            <SmartHomePreview draft={draft} catalog={catalog} />
          </div>
          <WizardFooter onBack={onBack} primaryLabel="Continue" onPrimary={onContinue} />
        </div>
        <div className="hidden lg:block">
          <SmartHomePreview draft={draft} catalog={catalog} />
        </div>
      </div>
    </section>
  );
}
