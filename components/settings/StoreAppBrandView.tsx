'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { HomeScreenLauncherMock } from '@/components/onboarding/HomeScreenLauncherMock';
import { SplashBootMock } from '@/components/onboarding/SplashBootMock';
import { SmartHomePreview } from '@/components/onboarding/SmartHomePreview';
import { HEX_COLOR_REGEX, validateBrandImage } from '@/lib/onboarding/branding';
import { displayBrandImageUrl } from '@/lib/onboarding/brandAssets';
import type { BrandingDraft, LockedCatalog, SyncGate } from '@/lib/onboarding/types';

export interface SettingsBrandProps {
  appName: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

/** Blob previews and https images only. Token-shaped and other URLs are dropped. */
export function settingsBrandImageUrl(value: string | null): string | null {
  const url = displayBrandImageUrl(value);
  if (!url) return null;
  if (url.startsWith('blob:')) return url;
  if (url.startsWith('https:')) return url;
  return null;
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
  if (
    next.primaryColor !== prev.primaryColor &&
    next.primaryColor &&
    HEX_COLOR_REGEX.test(next.primaryColor)
  ) {
    patch.primaryColor = next.primaryColor;
  }
  if (next.secondaryColor !== prev.secondaryColor) {
    patch.secondaryColor =
      next.secondaryColor && HEX_COLOR_REGEX.test(next.secondaryColor) ? next.secondaryColor : '';
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
}

export function StoreAppBrandView({
  draft,
  catalog,
  sync,
  loadError,
  fieldError,
  iconUploading,
  splashUploading,
  retrying,
  onRetry,
  onIconFile,
  onSplashFile,
  onImageError,
}: StoreAppBrandViewProps) {
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
          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
            Replace the home screen icon and the image shoppers see when the app opens. The preview updates as soon as you choose a file. The icon is the home-screen mark under the phone. The splash is the opening screen.
          </p>
        </div>

        <div className="mt-8 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:mt-0 lg:self-start">
          <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            Live preview
          </p>
          <SmartHomePreview draft={shown} catalog={catalog} sync={sync} />
          <HomeScreenLauncherMock appName={shown.appName} iconUrl={shown.iconUrl} />
          <SplashBootMock appName={shown.appName} splashUrl={shown.splashUrl} />
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
              imageUrl={shown.iconUrl}
              hint={iconUploading ? 'Uploading...' : 'Home screen icon'}
              shape="icon"
              busy={iconUploading}
              onFile={(file) => acceptImage(file, onImageError, onIconFile)}
            />
            <ImageField
              id="settings-brand-splash"
              label="Splash"
              imageUrl={shown.splashUrl}
              hint={splashUploading ? 'Uploading...' : 'Opening screen'}
              busy={splashUploading}
              onFile={(file) => acceptImage(file, onImageError, onSplashFile)}
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

function acceptImage(file: File, onImageError: (message: string | null) => void, onFile: (file: File) => void) {
  const check = validateBrandImage(file);
  if (!check.ok) {
    onImageError(check.message);
    return;
  }
  onImageError(null);
  onFile(file);
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
  const safeUrl = settingsBrandImageUrl(imageUrl);
  const [brokenFor, setBrokenFor] = useState<string | null>(null);
  const broken = Boolean(safeUrl) && brokenFor === safeUrl;
  const showImage = Boolean(safeUrl) && !broken;

  return (
    <div className="relative min-w-0">
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
          if (file) onFile(file);
          event.target.value = '';
        }}
      />
      <p className="mt-2 text-xs leading-5 text-slate-500">{broken ? 'Add a new image.' : hint}</p>
    </div>
  );
}
