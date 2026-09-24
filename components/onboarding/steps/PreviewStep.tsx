'use client';

import { SmartHomePreview } from '@/components/onboarding/SmartHomePreview';
import { WizardFooter } from '@/components/onboarding/WizardChrome';
import { previewShelf, previewStepDetail } from '@/lib/onboarding/normalizers';
import type { BrandingDraft, LockedCatalog, SyncGate } from '@/lib/onboarding/types';

interface PreviewStepProps {
  draft: BrandingDraft;
  catalog: LockedCatalog;
  sync: SyncGate;
  pending?: boolean;
  onBack: () => void;
  onContinue: () => void;
  onRetry: () => void;
}

export function PreviewStep({
  draft,
  catalog,
  sync,
  pending = false,
  onBack,
  onContinue,
  onRetry,
}: PreviewStepProps) {
  const shelf = previewShelf(sync, catalog.products, pending);
  const productLine = previewStepDetail(sync, catalog.products, pending);

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
            <li>{productLine}</li>
            <li>Collection names, when we have them, stay read only.</li>
          </ul>
          {shelf.kind !== 'products' ? (
            <button
              type="button"
              onClick={onRetry}
              disabled={pending}
              className="mt-4 text-sm font-medium text-slate-700 underline-offset-4 hover:underline disabled:cursor-wait disabled:text-slate-400"
            >
              {pending ? 'Checking...' : 'Check again'}
            </button>
          ) : null}
          <div className="mt-8 lg:hidden">
            <SmartHomePreview draft={draft} catalog={catalog} sync={sync} pending={pending} />
          </div>
          <WizardFooter onBack={onBack} primaryLabel="Continue" onPrimary={onContinue} />
        </div>
        <div className="hidden lg:block">
          <SmartHomePreview draft={draft} catalog={catalog} sync={sync} pending={pending} />
        </div>
      </div>
    </section>
  );
}
