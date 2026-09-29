'use client';

import { useRef, useState } from 'react';
import {
  USE_LOGO_AS_ICON_ERROR,
  drawableBrandImageUrl,
  fileFromDrawableLogo,
} from '@/lib/onboarding/brandAssets';
import { validateBrandImage } from '@/lib/onboarding/branding';

/**
 * Copies a drawable logo onto the app icon through the existing file save.
 * A failed fetch reports a field error and does not set an icon URL.
 */
export function useCopyLogoAsIcon(
  logoUrl: string | null,
  uploadsBusy: boolean,
  onIconFile: (file: File) => void,
  onImageError: (message: string | null) => void
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
        onImageError(USE_LOGO_AS_ICON_ERROR);
        return;
      }
      const check = validateBrandImage(file);
      if (!check.ok) {
        onImageError(check.message);
        return;
      }
      onIconFile(file);
    } catch {
      if (request.current === id) onImageError(USE_LOGO_AS_ICON_ERROR);
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
