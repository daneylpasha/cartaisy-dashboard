'use client';

import { useRef, useState } from 'react';
import {
  USE_LOGO_AS_ICON_ERROR,
  USE_LOGO_AS_SPLASH_ERROR,
  drawableBrandImageUrl,
  fileFromDrawableLogo,
} from '@/lib/onboarding/brandAssets';
import { validateBrandImageFile, type BrandImageKind } from '@/lib/onboarding/branding';

/**
 * Copies a drawable logo into a brand image through the existing file save.
 * A failed fetch reports a field error and does not set an image URL.
 */
function useCopyDrawableLogo(
  logoUrl: string | null,
  uploadsBusy: boolean,
  onFile: (file: File) => void,
  onImageError: (message: string | null) => void,
  failureMessage: string,
  kind: BrandImageKind
) {
  const [copying, setCopying] = useState(false);
  const request = useRef(0);
  const logo = drawableBrandImageUrl(logoUrl);

  async function onUseLogo() {
    if (!logo || copying || uploadsBusy) return;
    const id = request.current + 1;
    request.current = id;
    setCopying(true);
    onImageError(null);
    try {
      const file = await fileFromDrawableLogo(logo);
      if (request.current !== id) return;
      if (!file) {
        onImageError(failureMessage);
        return;
      }
      const check = await validateBrandImageFile(file, kind);
      if (request.current !== id) return;
      if (!check.ok) {
        onImageError(check.message);
        return;
      }
      onFile(file);
    } catch {
      if (request.current === id) onImageError(failureMessage);
    } finally {
      if (request.current === id) setCopying(false);
    }
  }

  return {
    offerUseLogo: Boolean(logo) && !uploadsBusy,
    copyingLogo: copying,
    onUseLogo,
  };
}

/** Copies a drawable logo onto the app icon through the existing file save. */
export function useCopyLogoAsIcon(
  logoUrl: string | null,
  uploadsBusy: boolean,
  onIconFile: (file: File) => void,
  onImageError: (message: string | null) => void
) {
  return useCopyDrawableLogo(logoUrl, uploadsBusy, onIconFile, onImageError, USE_LOGO_AS_ICON_ERROR, 'icon');
}

/** Copies a drawable logo onto the splash through the existing file save. */
export function useCopyLogoAsSplash(
  logoUrl: string | null,
  uploadsBusy: boolean,
  onSplashFile: (file: File) => void,
  onImageError: (message: string | null) => void
) {
  return useCopyDrawableLogo(logoUrl, uploadsBusy, onSplashFile, onImageError, USE_LOGO_AS_SPLASH_ERROR, 'splash');
}
