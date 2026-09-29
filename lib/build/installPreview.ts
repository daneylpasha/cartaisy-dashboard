import { merchantInstallHref, type BuildRequest, type PlatformKind, type PlatformStatus } from './contract.ts';

export interface ReadyInstall {
  platform: PlatformKind;
  label: 'Android' | 'iOS';
  url: string;
}

export interface InstallPreviewModel {
  phase: 'loading' | 'ready' | 'unavailable';
  installs: ReadyInstall[];
}

const PLATFORM_LABEL: Record<PlatformKind, ReadyInstall['label']> = {
  android: 'Android',
  ios: 'iOS',
};

/**
 * Ready platforms with a public https install URL.
 * List order wins per platform, then Android is shown before iOS.
 * Building, missing, and unsafe URLs are omitted. Nothing is invented.
 */
export function readyInstallsFromList(requests: BuildRequest[]): ReadyInstall[] {
  const found = new Map<PlatformKind, string>();
  for (const request of requests) {
    for (const platform of ['android', 'ios'] as const) {
      if (found.has(platform)) continue;
      const progress = request.platforms[platform];
      const href = merchantInstallHref(progress.status, progress.installUrl);
      if (href) found.set(platform, href);
    }
  }
  const installs: ReadyInstall[] = [];
  for (const platform of ['android', 'ios'] as const) {
    const url = found.get(platform);
    if (url) installs.push({ platform, label: PLATFORM_LABEL[platform], url });
  }
  return installs;
}

export function readyInstallsFromRequest(request: BuildRequest | null): ReadyInstall[] {
  if (!request) return [];
  return readyInstallsFromList([request]);
}

export interface InstallQrSlot {
  platform: PlatformKind;
  label: 'Android' | 'iOS';
  /** Public https install URL. Null while this platform is still waiting for one. */
  url: string | null;
}

/** Shown above the progress cards until a public install URL exists. No code is drawn. */
export const INSTALL_QR_WAIT_COPY =
  'A scannable install code will appear here when the preview is ready.';

const INSTALL_QR_WAIT_STATUSES = new Set<PlatformStatus | 'unknown'>([
  'queued',
  'building',
  'ready',
  'unknown',
]);

/**
 * One slot per platform that is queued, building, ready, or unrecognized.
 * A public https URL fills the slot. Anything else in those states keeps the
 * slot empty so the code can replace it in place. Failed, skipped, and
 * waiting-on-merchant platforms stay on the progress cards only.
 */
export function installQrSlots(request: BuildRequest | null): InstallQrSlot[] {
  if (!request) return [];
  const slots: InstallQrSlot[] = [];
  for (const platform of ['android', 'ios'] as const) {
    const progress = request.platforms[platform];
    const url = merchantInstallHref(progress.status, progress.installUrl);
    if (url) {
      slots.push({ platform, label: PLATFORM_LABEL[platform], url });
      continue;
    }
    if (INSTALL_QR_WAIT_STATUSES.has(progress.status)) {
      slots.push({ platform, label: PLATFORM_LABEL[platform], url: null });
    }
  }
  return slots;
}

/**
 * Phone mock is the wait state: no model yet (tests and callers that have not
 * loaded), a failed list, or a loaded list with no ready install URL.
 * Loading hides the phone so a finished install is not covered by the mock.
 */
export function showsBrandMock(model: InstallPreviewModel | undefined): boolean {
  if (!model) return true;
  if (model.phase === 'loading') return false;
  if (model.phase === 'unavailable') return true;
  return model.installs.length === 0;
}

export function installPreviewMode(model: InstallPreviewModel | undefined): 'mock' | 'loading' | 'install' {
  if (showsBrandMock(model)) return 'mock';
  if (model?.phase === 'loading') return 'loading';
  return 'install';
}

/** Keep a known install on screen while a refresh is in flight. Otherwise do not show the phone. */
export function installPreviewWhileLoading(current: InstallPreviewModel): InstallPreviewModel {
  if (current.installs.length > 0) return { phase: 'ready', installs: current.installs };
  return { phase: 'loading', installs: [] };
}

export function installPreviewFromList(
  current: InstallPreviewModel,
  result: { kind: 'ok'; requests: BuildRequest[] } | { kind: 'error' }
): InstallPreviewModel {
  if (result.kind !== 'ok') {
    if (current.installs.length > 0) return { phase: 'ready', installs: current.installs };
    return { phase: 'unavailable', installs: [] };
  }
  return { phase: 'ready', installs: readyInstallsFromList(result.requests) };
}

export function brandStepLead(model: InstallPreviewModel | undefined): string {
  if (model?.phase === 'loading') {
    return 'We filled this in from your store where we could. Shopify details stay locked.';
  }
  if (model && model.phase === 'ready' && model.installs.length > 0) {
    return 'We filled this in from your store where we could. Scan the code to open the app on your phone. Shopify details stay locked.';
  }
  return 'We filled this in from your store where we could. The phone uses this draft and updates as you edit. Shopify details stay locked.';
}

export function settingsBrandLead(model: InstallPreviewModel | undefined): string {
  if (model?.phase === 'loading') {
    return 'Replace the home screen icon and the image shoppers see when the app opens.';
  }
  if (model && model.phase === 'ready' && model.installs.length > 0) {
    return 'Replace the home screen icon and the image shoppers see when the app opens. Scan the code to install the app. The next build uses these images.';
  }
  return 'Replace the home screen icon and the image shoppers see when the app opens. The preview updates as soon as you choose a file. The icon is the home-screen mark under the phone. The splash is the opening screen.';
}

export function previewStepLead(model: InstallPreviewModel | undefined): string {
  if (model?.phase === 'loading') {
    return 'Checking whether an installable build is ready.';
  }
  if (model && model.phase === 'ready' && model.installs.length > 0) {
    return 'The installable app is ready. Scan the code, or open Build to install it.';
  }
  return 'These screens follow the shopper app. Opening is the splash. Home is the default home until you publish a layout. Product and cart use the same chrome.';
}
