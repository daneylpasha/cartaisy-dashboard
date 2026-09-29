'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { BrandInstallPreview } from '@/components/onboarding/BrandInstallPreview';
import { settingsBrandLead, type InstallPreviewModel } from '@/lib/build/installPreview';
import { useCopyLogoAsIcon, useCopyLogoAsSplash } from '@/components/brand/useCopyLogoAsIcon';
import {
  BRAND_IMAGE_SIZE_GUIDE,
  DEFAULT_PRIMARY_COLOR,
  HEX_COLOR_REGEX,
  acceptBrandImageFile,
  type BrandImageKind,
} from '@/lib/onboarding/branding';
import { drawableBrandImageUrl } from '@/lib/onboarding/brandAssets';
import type { BrandingDraft, LockedCatalog, SyncGate } from '@/lib/onboarding/types';

export interface SettingsBrandProps {
  appName: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

/** Blob previews and https images only. Token-shaped and other URLs are dropped. */
export function settingsBrandImageUrl(value: string | null): string | null {
  return drawableBrandImageUrl(value);
}

export function presentSettingsBrand(draft: BrandingDraft): BrandingDraft {
  return {
    ...draft,
    logoUrl: settingsBrandImageUrl(draft.logoUrl),
    iconUrl: settingsBrandImageUrl(draft.iconUrl),
    splashUrl: settingsBrandImageUrl(draft.splashUrl),
  };
}

/** Logo, colors, and app name from the rest of Settings. Icon and splash stay on the draft. */
export function applySettingsBrandProps(
  draft: BrandingDraft,
  prev: SettingsBrandProps,
  next: SettingsBrandProps
): BrandingDraft {
  const patch: Partial<BrandingDraft> = {};
  if (next.appName !== prev.appName && next.appName.trim()) patch.appName = next.appName.trim();
  if (next.logoUrl !== prev.logoUrl) patch.logoUrl = settingsBrandImageUrl(next.logoUrl);
  if (next.primaryColor !== prev.primaryColor) {
    if (next.primaryColor && HEX_COLOR_REGEX.test(next.primaryColor)) {
      patch.primaryColor = next.primaryColor;
      patch.primaryExplicit = next.primaryColor;
    } else if (next.primaryColor == null || next.primaryColor.trim() === '') {
      patch.primaryColor = DEFAULT_PRIMARY_COLOR;
      patch.primaryExplicit = null;
    }
  }
  if (next.secondaryColor !== prev.secondaryColor) {
    if (next.secondaryColor && HEX_COLOR_REGEX.test(next.secondaryColor)) {
      patch.secondaryColor = next.secondaryColor;
      patch.secondaryExplicit = next.secondaryColor;
    } else {
      patch.secondaryColor = '';
      patch.secondaryExplicit = null;
    }
  }
  if (Object.keys(patch).length === 0) return draft;
  return presentSettingsBrand({ ...draft, ...patch });
}

interface StoreAppBrandViewProps {
  draft: BrandingDraft | null;
  catalog: LockedCatalog;
  sync: SyncGate;
  loadError: string | null;
  fieldError: string | null;
  iconUploading: boolean;
  splashUploading: boolean;
  retrying: boolean;
  onRetry: () => void;
  onIconFile: (file: File) => void;
  onSplashFile: (file: File) => void;
  onImageError: (message: string | null) => void;
  /** Build list for this store. Omitted shows how to get the first build. */
  installPreview?: InstallPreviewModel;
}

export function StoreAppBrandView({
  draft,
  loadError,
  fieldError,
  iconUploading,
  splashUploading,
  retrying,
  onRetry,
  onIconFile,
  onSplashFile,
  onImageError,
  installPreview,
}: StoreAppBrandViewProps) {
  const uploadsBusy = iconUploading || splashUploading;
  const iconLogo = useCopyLogoAsIcon(draft?.logoUrl ?? null, uploadsBusy, onIconFile, onImageError);
  const splashLogo = useCopyLogoAsSplash(draft?.logoUrl ?? null, uploadsBusy, onSplashFile, onImageError);

  if (!draft) {
    return (
      <section className="mt-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-8">
        {loadError ? (
          <LoadError message={loadError} retrying={retrying} onRetry={onRetry} />
        ) : (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" aria-hidden />
            <span className="sr-only">Loading brand images</span>
          </div>
        )}
      </section>
    );
  }

  const shown = presentSettingsBrand(draft);

  return (
    <section className="mt-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-8 sm:py-10">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start lg:gap-x-12">
        <div className="min-w-0 lg:col-start-1">
          <h3 className="font-heading text-xl font-semibold tracking-tight text-slate-950">Icon and splash</h3>
          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">{settingsBrandLead(installPreview)}</p>
        </div>

        <div className="mt-8 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:mt-0 lg:self-start">
          <BrandInstallPreview model={installPreview} />
        </div>

        <div className="min-w-0 lg:col-start-1">
          {loadError ? (
            <div className="mt-8">
              <LoadError message={loadError} retrying={retrying} onRetry={onRetry} />
            </div>
          ) : null}

          <div className="mt-8 grid grid-cols-2 gap-4">
            <ImageField
              id="settings-brand-icon"
              label="App icon"
              kind="icon"
              imageUrl={shown.iconUrl}
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
              id="settings-brand-splash"
              label="Splash"
              kind="splash"
              imageUrl={shown.splashUrl}
              hint={splashUploading ? 'Uploading...' : 'Opening screen'}
              sizeGuide={BRAND_IMAGE_SIZE_GUIDE.splash}
              busy={splashUploading}
              useLogo={
                splashLogo.offerUseLogo
                  ? { copying: splashLogo.copyingLogo, onUse: () => void splashLogo.onUseLogo() }
                  : null
              }
              onImageError={onImageError}
              onFile={onSplashFile}
            />
          </div>

          {fieldError ? (
            <p className="mt-4 text-sm text-red-700" role="alert">
              {fieldError}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function LoadError({
  message,
  retrying,
  onRetry,
}: {
  message: string;
  retrying: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-sm text-slate-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="mt-3 text-sm font-medium text-slate-950 underline-offset-4 hover:underline disabled:opacity-60"
      >
        {retrying ? 'Trying again...' : 'Try again'}
      </button>
    </div>
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
  useLogo?: { copying: boolean; onUse: () => void } | null;
  onImageError: (message: string | null) => void;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pick = useRef(0);
  const safeUrl = settingsBrandImageUrl(imageUrl);
  const [brokenFor, setBrokenFor] = useState<string | null>(null);
  const broken = Boolean(safeUrl) && brokenFor === safeUrl;
  const showImage = Boolean(safeUrl) && !broken;
  const showUseLogo = Boolean(useLogo) && !showImage && !busy;

  return (
    <div className="relative min-w-0" data-brand-field={id}>
      <Label htmlFor={id}>{label}</Label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label={showImage ? `Replace ${label}` : `Add ${label}`}
        aria-busy={busy}
        className="relative mt-2 flex h-28 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-slate-400 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
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
      {/* top/left stay 0. sr-only is position:absolute with auto offsets, and
          those offsets follow the static position down the settings scrollport,
          which stretches the document onto the black html background. */}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only top-0 left-0"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          const id = ++pick.current;
          void acceptBrandImageFile(file, kind, onImageError, onFile, () => pick.current === id);
        }}
      />
      <p className="mt-2 text-xs leading-5 text-slate-500">{broken ? 'Add a new image.' : hint}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{sizeGuide}</p>
      {showUseLogo && useLogo ? (
        <button
          type="button"
          onClick={useLogo.onUse}
          disabled={useLogo.copying}
          className="mt-1 text-left text-xs font-medium text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline disabled:opacity-60"
        >
          {useLogo.copying ? 'Using logo...' : 'Use logo'}
        </button>
      ) : null}
    </div>
  );
}
