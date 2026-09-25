'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColorPicker } from '@/components/ui/color-picker';
import { LockedShopifyDetails } from '@/components/onboarding/LockedShopifyDetails';
import { SmartHomePreview } from '@/components/onboarding/SmartHomePreview';
import { SetupNotice, WizardFooter } from '@/components/onboarding/WizardChrome';
import { validateBrandImage } from '@/lib/onboarding/branding';
import { safeImageUrl } from '@/lib/onboarding/normalizers';
import type { BrandingDraft, LockedCatalog, ShopifyConnectionSnapshot, SyncGate } from '@/lib/onboarding/types';

const COLOR_PRESETS = ['#111111', '#1F2937', '#0F766E', '#1D4ED8', '#9A3412', '#F5F5F4'];

interface BrandingStepProps {
  draft: BrandingDraft;
  connection: ShopifyConnectionSnapshot;
  catalog: LockedCatalog;
  sync: SyncGate;
  pending?: boolean;
  warning: string | null;
  loadError: string | null;
  fieldError: string | null;
  saving: boolean;
  logoUploading: boolean;
  iconUploading: boolean;
  splashUploading: boolean;
  primaryValid: boolean;
  secondaryValid: boolean;
  onDraftChange: (draft: BrandingDraft) => void;
  onPrimaryValidity: (valid: boolean) => void;
  onSecondaryValidity: (valid: boolean) => void;
  onLogoFile: (file: File) => void;
  onSplashFile: (file: File) => void;
  onIconFile: (file: File) => void;
  onImageError: (message: string | null) => void;
  onBack: () => void;
  onContinue: () => void;
  onRetry: () => void;
}

export function BrandingStep({
  draft,
  connection,
  catalog,
  sync,
  pending = false,
  warning,
  loadError,
  fieldError,
  saving,
  logoUploading,
  iconUploading,
  splashUploading,
  primaryValid,
  secondaryValid,
  onDraftChange,
  onPrimaryValidity,
  onSecondaryValidity,
  onLogoFile,
  onSplashFile,
  onIconFile,
  onImageError,
  onBack,
  onContinue,
  onRetry,
}: BrandingStepProps) {
  const nameReady = draft.appName.trim().length >= 2;
  const blocked =
    Boolean(loadError) || !nameReady || !primaryValid || !secondaryValid || logoUploading || iconUploading || splashUploading;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white px-5 py-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-10 sm:py-10">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start lg:gap-x-12">
        <div className="min-w-0 lg:col-start-1">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Step 2</p>
          <h1 className="font-heading mt-3 text-[1.75rem] font-semibold tracking-tight text-slate-950">
            Confirm your brand
          </h1>
          <p className="mt-3 max-w-lg text-[15px] leading-7 text-slate-600">
            We filled this in from your store where we could. The phone uses this draft and updates as you edit. Shopify details stay locked.
          </p>
          {warning && (
            <div className="mt-8">
              <SetupNotice>{warning}</SetupNotice>
            </div>
          )}
        </div>

        <div className="mt-8 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:mt-0 lg:self-start">
          <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            Live preview
          </p>
          <SmartHomePreview draft={draft} catalog={catalog} sync={sync} pending={pending} />
        </div>

        <div className="min-w-0 lg:col-start-1">
          {loadError ? (
            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-700">{loadError}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 text-sm font-medium text-slate-950 underline-offset-4 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="mt-8 space-y-8">
              <div className="space-y-2">
                <Label htmlFor="app-name">App name</Label>
                <Input
                  id="app-name"
                  value={draft.appName}
                  onChange={(event) => onDraftChange({ ...draft, appName: event.target.value })}
                  className="h-11"
                  maxLength={80}
                  autoComplete="organization"
                />
                <p className="text-xs text-slate-500">
                  {draft.appName.trim().length < 2
                    ? 'Enter at least 2 characters. This is the name shoppers see.'
                    : 'This is the name shoppers see on the app.'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <ImageField
                  id="brand-logo"
                  label="Logo"
                  imageUrl={draft.logoUrl}
                  hint={logoUploading ? 'Uploading...' : 'Shown in the app header'}
                  fit="contain"
                  busy={logoUploading}
                  onFile={(file) => {
                    const check = validateBrandImage(file);
                    if (!check.ok) {
                      onImageError(check.message);
                      return;
                    }
                    onImageError(null);
                    onLogoFile(file);
                  }}
                />
                <ImageField
                  id="brand-icon"
                  label="App icon"
                  imageUrl={draft.iconUrl}
                  hint={iconUploading ? 'Uploading...' : 'Home screen icon'}
                  shape="icon"
                  busy={iconUploading}
                  onFile={(file) => {
                    const check = validateBrandImage(file);
                    if (!check.ok) {
                      onImageError(check.message);
                      return;
                    }
                    onImageError(null);
                    onIconFile(file);
                  }}
                />
                <ImageField
                  id="brand-splash"
                  label="Splash"
                  imageUrl={draft.splashUrl}
                  hint={splashUploading ? 'Uploading...' : 'Opening screen'}
                  busy={splashUploading}
                  onFile={(file) => {
                    const check = validateBrandImage(file);
                    if (!check.ok) {
                      onImageError(check.message);
                      return;
                    }
                    onImageError(null);
                    onSplashFile(file);
                  }}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <ColorPicker
                  label="Primary color"
                  value={draft.primaryColor}
                  presets={COLOR_PRESETS}
                  onChange={(primaryColor) => onDraftChange({ ...draft, primaryColor })}
                  onValidityChange={onPrimaryValidity}
                />
                <ColorPicker
                  label="Secondary color"
                  value={draft.secondaryColor || '#FFFFFF'}
                  presets={COLOR_PRESETS}
                  onChange={(secondaryColor) => onDraftChange({ ...draft, secondaryColor })}
                  onValidityChange={onSecondaryValidity}
                />
              </div>
            </div>
          )}

          {fieldError && (
            <p className="mt-4 text-sm text-red-700" role="alert">
              {fieldError}
            </p>
          )}

          <LockedShopifyDetails connection={connection} catalog={catalog} />

          <WizardFooter
            onBack={onBack}
            primaryLabel="Continue"
            onPrimary={onContinue}
            primaryDisabled={blocked}
            pending={saving}
          />
        </div>
      </div>
    </section>
  );
}

function ImageField({
  id,
  label,
  imageUrl,
  hint,
  fit = 'cover',
  shape = 'fill',
  busy = false,
  onFile,
}: {
  id: string;
  label: string;
  imageUrl: string | null;
  hint: string;
  fit?: 'cover' | 'contain';
  shape?: 'fill' | 'icon';
  busy?: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const safeUrl = safeImageUrl(imageUrl);
  const [brokenFor, setBrokenFor] = useState<string | null>(null);
  const broken = Boolean(safeUrl) && brokenFor === safeUrl;
  const showImage = Boolean(safeUrl) && !broken;

  return (
    <div className="min-w-0">
      <Label htmlFor={id}>{label}</Label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label={showImage ? `Replace ${label}` : `Add ${label}`}
        aria-busy={busy}
        className="relative mt-2 flex h-24 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-slate-400 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 sm:h-28"
      >
        {showImage && safeUrl ? (
          // Blob previews and merchant image hosts are not in the Next image allowlist.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={safeUrl}
            alt=""
            onError={() => setBrokenFor(safeUrl)}
            className={
              shape === 'icon'
                ? 'h-16 w-16 rounded-[22%] object-cover ring-1 ring-black/10'
                : fit === 'contain'
                  ? 'h-full w-full object-contain p-2'
                  : 'h-full w-full object-cover'
            }
          />
        ) : (
          <span className="flex flex-col items-center gap-1 px-2 text-center text-slate-500">
            <ImagePlus className="h-4 w-4" aria-hidden />
            <span className="text-[11px] leading-4">{broken ? 'Add again' : 'Add image'}</span>
          </span>
        )}
        {busy ? (
          <span className="absolute inset-0 flex items-center justify-center bg-white/75">
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" aria-hidden />
            <span className="sr-only">Uploading</span>
          </span>
        ) : null}
      </button>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = '';
        }}
      />
      <p className="mt-2 text-[11px] leading-4 text-slate-500 sm:text-xs sm:leading-5">
        {broken ? 'Add a new image.' : hint}
      </p>
    </div>
  );
}
