'use client';

import { BrandInstallPreview } from '@/components/onboarding/BrandInstallPreview';
import { WizardFooter } from '@/components/onboarding/WizardChrome';
import { previewStepLead, type InstallPreviewModel } from '@/lib/build/installPreview';
import type { BrandingDraft, LockedCatalog, SyncGate } from '@/lib/onboarding/types';

interface PreviewStepProps {
  draft: BrandingDraft;
  catalog: LockedCatalog;
  sync: SyncGate;
  pending?: boolean;
  onBack: () => void;
  onContinue: () => void;
  onRetry: () => void;
  /** Build list for this store. Omitted shows how to get the first build. */
  installPreview?: InstallPreviewModel;
}

export function PreviewStep({
  onBack,
  onContinue,
  installPreview,
}: PreviewStepProps) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white px-5 py-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-10 sm:py-10">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start lg:gap-x-12">
        <div className="min-w-0 lg:col-start-1">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Step 3</p>
          <h1 className="font-heading mt-3 text-[1.75rem] font-semibold tracking-tight text-slate-950">
            Preview your home
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-7 text-slate-600">{previewStepLead(installPreview)}</p>
        </div>
        <div className="mt-8 lg:col-start-2 lg:row-span-2 lg:mt-0 lg:self-start">
          <BrandInstallPreview model={installPreview} />
        </div>
        <div className="lg:col-start-1">
          <WizardFooter onBack={onBack} primaryLabel="Continue" onPrimary={onContinue} />
        </div>
      </div>
    </section>
  );
}
