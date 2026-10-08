'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrandInstallPreview } from '@/components/onboarding/BrandInstallPreview';
import { LockedShopifyDetails } from '@/components/onboarding/LockedShopifyDetails';
import { brandStepLead, type InstallPreviewModel } from '@/lib/build/installPreview';
import { SetupNotice, WizardFooter } from '@/components/onboarding/WizardChrome';
import { APP_NAME_WORDMARK_MESSAGE, isPlatformWordmark } from '@/lib/onboarding/appName';
import {
  BRAND_IMAGE_SIZE_GUIDE,
  DEFAULT_PRIMARY_COLOR,
  acceptBrandImageFile,
  brandColorUsesPlatformDefault,
  type BrandImageKind,
} from '@/lib/onboarding/branding';
import { BrandColorControl } from '@/components/brand/BrandColorControl';
import { useCopyLogoAsIcon, useCopyLogoAsSplash } from '@/components/brand/useCopyLogoAsIcon';
import { drawableBrandImageUrl } from '@/lib/onboarding/brandAssets';
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
  /** Build list for this store. Omitted shows how to get the first build. */
  installPreview?: InstallPreviewModel;
  /** Public /demo only. The signed-in wizard keeps this title as the page heading. */
  tourMode?: boolean;
  onPublishHome?: () => void;
  onGoLive?: () => void;
  onBuildMyApp?: () => void;
}

export function BrandingStep({
  draft,
  connection,
  catalog,
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
  installPreview,
  tourMode = false,
  onPublishHome,
  onGoLive,
  onBuildMyApp,
}: BrandingStepProps) {
  const trimmedName = draft.appName.trim();
  const nameReady = trimmedName.length >= 2 && !isPlatformWordmark(trimmedName);
  const uploadsBusy = logoUploading || iconUploading || splashUploading;
  const blocked =
    Boolean(loadError) || !nameReady || !primaryValid || !secondaryValid || uploadsBusy;
  const iconLogo = useCopyLogoAsIcon(draft.logoUrl, uploadsBusy, onIconFile, onImageError);
  const splashLogo = useCopyLogoAsSplash(draft.logoUrl, uploadsBusy, onSplashFile, onImageError);
  const TitleTag = tourMode ? 'h3' : 'h1';
  const tour = tourMode
    ? {
        onPublishHome: onPublishHome ?? (() => undefined),
        onGoLive: onGoLive ?? (() => undefined),
        onBuildMyApp: onBuildMyApp ?? (() => undefined),
      }
    : undefined;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white px-5 py-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-10 sm:py-10">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start lg:gap-x-12">
        <div className="min-w-0 lg:col-start-1">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Step 2</p>
          <TitleTag className="font-heading mt-3 text-[1.75rem] font-semibold tracking-tight text-slate-950">
            Confirm your brand
          </TitleTag>
          <p className="mt-3 max-w-lg text-[15px] leading-7 text-slate-600">{brandStepLead(installPreview)}</p>
          {warning && (
            <div className="mt-8">
              <SetupNotice>{warning}</SetupNotice>
            </div>
          )}
        </div>

        <div className="mt-8 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:mt-0 lg:self-start">
          <BrandInstallPreview model={installPreview} tour={tour} />
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
                  {isPlatformWordmark(draft.appName)
                    ? APP_NAME_WORDMARK_MESSAGE
                    : trimmedName.length < 2
                      ? 'Enter at least 2 characters. This is the name shoppers see.'
                      : 'This is the name shoppers see on the app.'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <ImageField
                  id="brand-logo"
                  label="Logo"
                  kind="logo"
                  imageUrl={draft.logoUrl}
                  hint={logoUploading ? 'Uploading...' : 'Shown in the app header'}
                  sizeGuide={BRAND_IMAGE_SIZE_GUIDE.logo}
                  fit="contain"
                  busy={logoUploading}
                  onImageError={onImageError}
                  onFile={onLogoFile}
                />
                <ImageField
                  id="brand-icon"
                  label="App icon"
                  kind="icon"
                  imageUrl={draft.iconUrl}
                  hint={iconUploading ? 'Uploading...' : 'Home screen icon'}
                  sizeGuide={BRAND_IMAGE_SIZE_GUIDE.icon}
                  shape="icon"
                  busy={iconUploading}
                  useLogo={
                    iconLogo.offerUseLogo
                      ? { copying: iconLogo.copyingLogo, onUse: () => void iconLogo.onUseLogo() }
                      : null
                  }
                  onImageError={onImageError}
                  onFile={onIconFile}
                />
                <ImageField
                  id="brand-splash"
                  label="Splash"
                  kind="splash"
                  imageUrl={draft.splashUrl}
                  hint={splashUploading ? 'Uploading...' : 'Opening screen'}
                  sizeGuide={BRAND_IMAGE_SIZE_GUIDE.splash}
                  busy={splashUploading}
                  drawable
                  useLogo={
                    splashLogo.offerUseLogo
                      ? { copying: splashLogo.copyingLogo, onUse: () => void splashLogo.onUseLogo() }
                      : null
                  }
                  onImageError={onImageError}
                  onFile={onSplashFile}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <BrandColorControl
                  label="Primary color"
                  value={draft.primaryColor}
                  presets={COLOR_PRESETS}
                  usingDefault={brandColorUsesPlatformDefault(
                    draft.primaryExplicit,
                    draft.primaryColor,
                    'primary'
                  )}
                  onChange={(primaryColor) =>
                    onDraftChange({ ...draft, primaryColor, primaryExplicit: primaryColor })
                  }
                  onValidityChange={onPrimaryValidity}
                  onClear={() =>
                    onDraftChange({
                      ...draft,
                      primaryColor: DEFAULT_PRIMARY_COLOR,
                      primaryExplicit: null,
                    })
                  }
                />
                <BrandColorControl
                  label="Secondary color"
                  value={draft.secondaryColor || '#FFFFFF'}
                  presets={COLOR_PRESETS}
                  usingDefault={brandColorUsesPlatformDefault(
                    draft.secondaryExplicit,
                    draft.secondaryColor,
                    'secondary'
                  )}
                  onChange={(secondaryColor) =>
                    onDraftChange({ ...draft, secondaryColor, secondaryExplicit: secondaryColor })
                  }
                  onValidityChange={onSecondaryValidity}
                  onClear={() =>
                    onDraftChange({
                      ...draft,
                      secondaryColor: '',
                      secondaryExplicit: null,
                    })
                  }
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
  kind,
  imageUrl,
  hint,
  sizeGuide,
  fit = 'cover',
  shape = 'fill',
  busy = false,
  drawable = false,
  useLogo = null,
  onImageError,
  onFile,
}: {
  id: string;
  label: string;
  kind: BrandImageKind;
  imageUrl: string | null;
  hint: string;
  sizeGuide: string;
  fit?: 'cover' | 'contain';
  shape?: 'fill' | 'icon';
  busy?: boolean;
  drawable?: boolean;
  useLogo?: { copying: boolean; onUse: () => void } | null;
  onImageError: (message: string | null) => void;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pick = useRef(0);
  const safeUrl =
    shape === 'icon' || drawable ? drawableBrandImageUrl(imageUrl) : safeImageUrl(imageUrl);
  const [brokenFor, setBrokenFor] = useState<string | null>(null);
  const broken = Boolean(safeUrl) && brokenFor === safeUrl;
  const showImage = Boolean(safeUrl) && !broken;
  const showUseLogo = Boolean(useLogo) && !showImage && !busy;

  return (
    <div className="min-w-0" data-brand-field={id}>
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
          event.target.value = '';
          if (!file) return;
          const id = ++pick.current;
          void acceptBrandImageFile(file, kind, onImageError, onFile, () => pick.current === id);
        }}
      />
      <p className="mt-2 text-[11px] leading-4 text-slate-500 sm:text-xs sm:leading-5">
        {broken ? 'Add a new image.' : hint}
      </p>
      <p className="mt-1 text-[11px] leading-4 text-slate-500 sm:text-xs sm:leading-5">{sizeGuide}</p>
      {showUseLogo && useLogo ? (
        <button
          type="button"
          onClick={useLogo.onUse}
          disabled={useLogo.copying}
          className="mt-1 text-left text-[11px] font-medium text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline disabled:opacity-60 sm:text-xs"
        >
          {useLogo.copying ? 'Using logo...' : 'Use logo'}
        </button>
      ) : null}
    </div>
  );
}
