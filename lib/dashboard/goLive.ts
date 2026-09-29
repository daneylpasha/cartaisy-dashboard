import { BUILD_MY_APP_HREF, type CredentialStatus } from '@/lib/storeCredentials/contract';
import { homeSubmitTitle, type HomeSubmitNotice } from '@/lib/storeSubmit/contract';
import { APP_BUILDER_PUBLISH_HREF, type HomeLayoutOverview } from '@/lib/homeLayout/publish';
import type { ShopifyCatalogBlockKind, SyncGateState } from '@/lib/onboarding/types';

const BRAND_STEP_HREF = '/dashboard/onboarding?step=brand';

/** Settings hosts the one catalog recovery control. */
export const CATALOG_SYNC_HREF = '/dashboard/settings#shopify-connection';

export type GoLivePreviewPhase = 'unknown' | 'ready' | 'building' | 'none';

export type GoLiveStepId = 'shopify' | 'catalog' | 'brand' | 'home' | 'preview' | 'accounts' | 'submit';

export type GoLiveTone = 'done' | 'current' | 'waiting' | 'quiet' | 'unknown';

export interface GoLiveBrandRead {
  /** False when branding GET failed. A failed read is not a missing name. */
  known: boolean;
  displayName: string | null;
  hasIcon: boolean;
}

export interface GoLiveAccountsRead {
  known: boolean;
  apple: CredentialStatus | null;
  google: CredentialStatus | null;
}

export interface GoLiveInput {
  catalogBlock: ShopifyCatalogBlockKind | null;
  syncState: SyncGateState;
  syncLabel: string;
  syncDetail: string | null;
  /** True only when the build-eligibility contract is met. Null when sync could not be read. */
  catalogEligible: boolean | null;
  brand: GoLiveBrandRead;
  homeLayout: HomeLayoutOverview | null;
  preview: GoLivePreviewPhase;
  /** Platform summary already shown on Home, such as a failed build. Not a success signal. */
  previewDetail: string | null;
  accounts: GoLiveAccountsRead;
  submitKnown: boolean;
  submitNotices: HomeSubmitNotice[];
}

export interface GoLiveStep {
  id: GoLiveStepId;
  title: string;
  status: string;
  detail: string | null;
  tone: GoLiveTone;
  optional: boolean;
  /** True when this step's read failed. It is not marked done. */
  uncertain: boolean;
}

export interface GoLiveCta {
  label: string;
  href: string;
}

export interface GoLiveModel {
  headline: string;
  support: string;
  readyCount: number;
  stepCount: number;
  steps: GoLiveStep[];
  cta: GoLiveCta | null;
}

interface DraftStep {
  id: GoLiveStepId;
  title: string;
  status: string;
  detail: string | null;
  optional: boolean;
  done: boolean;
  unknown: boolean;
}

function brandStatus(brand: GoLiveBrandRead): { done: boolean; unknown: boolean; status: string } {
  if (!brand.known) return { done: false, unknown: true, status: 'Could not check' };
  if (brand.displayName && brand.hasIcon) return { done: true, unknown: false, status: brand.displayName };
  if (!brand.displayName && !brand.hasIcon) return { done: false, unknown: false, status: 'Name and icon needed' };
  if (!brand.displayName) return { done: false, unknown: false, status: 'Name needed' };
  return { done: false, unknown: false, status: 'Icon needed' };
}

function accountStatus(accounts: GoLiveAccountsRead): { done: boolean; unknown: boolean; status: string; detail: string | null } {
  if (!accounts.known || !accounts.apple || !accounts.google) {
    return { done: false, unknown: true, status: 'Could not check', detail: null };
  }
  const apple = accounts.apple === 'connected';
  const google = accounts.google === 'connected';
  if (apple && google) return { done: true, unknown: false, status: 'Connected', detail: null };
  const attention = accounts.apple === 'needsAttention' || accounts.google === 'needsAttention';
  let status = 'Optional';
  if (apple && !google) status = 'Apple connected';
  else if (google && !apple) status = 'Google connected';
  else if (attention) status = 'Needs attention';
  return {
    done: false,
    unknown: false,
    status,
    detail: 'Optional. Preview and build stay available.',
  };
}

function submitStatus(input: GoLiveInput): { done: boolean; unknown: boolean; status: string } {
  if (!input.submitKnown) return { done: false, unknown: true, status: 'Could not check' };
  const title = homeSubmitTitle(input.submitNotices);
  if (!title) return { done: false, unknown: false, status: 'Not submitted' };
  const tones = new Set(input.submitNotices.map((notice) => notice.tone));
  if (tones.size === 1 && tones.has('submitted')) return { done: true, unknown: false, status: title };
  return { done: false, unknown: false, status: title };
}

function catalogDraft(input: GoLiveInput): DraftStep {
  if (input.catalogBlock) {
    return {
      id: 'catalog',
      title: 'Catalog',
      status: 'Blocked',
      detail: null,
      optional: false,
      done: false,
      unknown: false,
    };
  }
  if (input.catalogEligible == null || input.syncState === 'unavailable') {
    return {
      id: 'catalog',
      title: 'Catalog',
      status: 'Could not check',
      detail: null,
      optional: false,
      done: false,
      unknown: true,
    };
  }
  if (input.catalogEligible === true && input.syncState === 'succeeded') {
    return {
      id: 'catalog',
      title: 'Catalog',
      status: 'Synced',
      detail: input.syncDetail,
      optional: false,
      done: true,
      unknown: false,
    };
  }
  return {
    id: 'catalog',
    title: 'Catalog',
    status: input.syncLabel === 'Synced' ? 'Not ready for a build' : input.syncLabel,
    detail: input.syncDetail,
    optional: false,
    done: false,
    unknown: false,
  };
}

function draftSteps(input: GoLiveInput): DraftStep[] {
  const shopifyBlocked = input.catalogBlock != null;
  const brand = brandStatus(input.brand);
  const accounts = accountStatus(input.accounts);
  const submit = submitStatus(input);
  const home = input.homeLayout;

  return [
    {
      id: 'shopify',
      title: 'Shopify',
      status: input.catalogBlock === 'billing' ? 'Billing needs attention' : input.catalogBlock === 'reconnect' ? 'Reconnect needed' : 'Connected',
      detail: null,
      optional: false,
      done: !shopifyBlocked,
      unknown: false,
    },
    catalogDraft(input),
    {
      id: 'brand',
      title: 'Brand',
      status: brand.status,
      detail: brand.done || brand.unknown ? null : 'Add them in Brand or Settings.',
      optional: false,
      done: brand.done,
      unknown: brand.unknown,
    },
    {
      id: 'home',
      title: 'Home',
      status: home?.label ?? 'Could not check',
      detail: home?.detail ?? null,
      optional: false,
      done: home?.status === 'published',
      unknown: home == null,
    },
    {
      id: 'preview',
      title: 'Preview',
      status:
        input.preview === 'ready'
          ? 'Ready to install'
          : input.preview === 'building'
            ? 'Building'
            : input.preview === 'unknown'
              ? 'Could not check'
              : 'Not ready',
      detail:
        input.preview === 'building'
          ? 'Your preview is building. A scannable install code will appear there when it is ready.'
          : input.preview === 'none'
            ? input.previewDetail
            : null,
      optional: false,
      done: input.preview === 'ready',
      unknown: input.preview === 'unknown',
    },
    {
      id: 'accounts',
      title: 'Store accounts',
      status: accounts.status,
      detail: accounts.detail,
      optional: true,
      done: accounts.done,
      unknown: accounts.unknown,
    },
    {
      id: 'submit',
      title: 'Submit',
      status: submit.status,
      detail: null,
      optional: false,
      done: submit.done,
      unknown: submit.unknown,
    },
  ];
}

function assignTones(drafts: DraftStep[]): GoLiveStep[] {
  let currentChosen = false;
  return drafts.map((step) => {
    const uncertain = step.unknown;
    if (step.done) {
      return { ...step, tone: 'done' as const, uncertain: false };
    }
    if (step.optional) {
      return { ...step, tone: uncertain ? ('unknown' as const) : ('quiet' as const), uncertain };
    }
    if (!currentChosen) {
      currentChosen = true;
      return { ...step, tone: 'current' as const, uncertain };
    }
    return { ...step, tone: uncertain ? ('unknown' as const) : ('waiting' as const), uncertain };
  });
}

function submitNeedsRetry(notices: HomeSubmitNotice[]): boolean {
  return notices.length > 0 && notices.every((notice) => notice.tone === 'failed');
}

function ctaFor(step: GoLiveStep | undefined, input: GoLiveInput): GoLiveCta | null {
  if (!step || step.tone !== 'current') return null;
  switch (step.id) {
    case 'shopify':
      return null;
    case 'catalog':
      return { label: 'Open catalog sync', href: CATALOG_SYNC_HREF };
    case 'brand':
      return { label: 'Open Brand', href: BRAND_STEP_HREF };
    case 'home':
      if (input.homeLayout?.needsPublish) {
        return { label: 'Publish home', href: APP_BUILDER_PUBLISH_HREF };
      }
      return { label: 'Open app builder', href: '/dashboard/app-builder' };
    case 'preview':
      return { label: 'Open Build', href: BUILD_MY_APP_HREF };
    case 'submit':
      return {
        label: submitNeedsRetry(input.submitNotices) ? 'Open Build to try again' : 'Open Build',
        href: BUILD_MY_APP_HREF,
      };
    default:
      return null;
  }
}

function focusStep(steps: GoLiveStep[]): GoLiveStep | undefined {
  return steps.find((step) => step.tone === 'current');
}

function headlineFor(step: GoLiveStep | undefined, input: GoLiveInput): string {
  if (!step) return 'Sent for review.';
  switch (step.id) {
    case 'shopify':
      return input.catalogBlock === 'billing' ? 'Shopify billing needs attention.' : 'Shopify needs to be reconnected.';
    case 'catalog':
      if (step.uncertain) return 'Catalog sync could not be checked.';
      if (input.syncState === 'in_progress') return 'The catalog is syncing.';
      if (input.syncState === 'failed') return 'The catalog sync did not finish.';
      return 'Sync the catalog next.';
    case 'brand':
      return step.uncertain ? 'Brand could not be checked.' : 'Add the app name and icon.';
    case 'home':
      if (step.uncertain) return 'Home publish status could not be checked.';
      return input.homeLayout?.status === 'draft' ? 'Publish the latest home.' : 'Publish the home.';
    case 'preview':
      if (step.uncertain) return 'Preview status could not be checked.';
      return input.preview === 'building' ? 'Your preview is building.' : 'Request a preview build.';
    case 'accounts':
      return 'Store accounts are optional.';
    case 'submit':
      if (step.uncertain) return 'Submit status could not be checked.';
      if (submitNeedsRetry(input.submitNotices)) return 'A submit needs another try.';
      if (input.submitNotices.some((notice) => notice.tone === 'progress')) return 'A submit is in progress.';
      return 'Submit from Build when you are ready.';
    default:
      return 'Sent for review.';
  }
}

function supportFor(step: GoLiveStep | undefined, input: GoLiveInput): string {
  if (!step) return 'The store may still be reviewing it. Build has the full note.';
  switch (step.id) {
    case 'shopify':
      return input.catalogBlock === 'billing'
        ? 'Products stay blocked until the Shopify plan is active. Syncing again will not change that.'
        : 'Catalog sync stays blocked until Shopify is connected again.';
    case 'catalog':
      return 'Build uses the same catalog sync. This does not start a second sync.';
    case 'brand':
      return 'The app name and icon are what the installable app shows on the device.';
    case 'home':
      return step.uncertain
        ? 'Nothing here is marked published until the layout can be read.'
        : 'The installable app reads the published home.';
    case 'preview':
      return input.preview === 'building'
        ? 'Open Build to follow progress.'
        : 'Build is where the preview install is requested.';
    case 'submit':
      return 'Home does not start a submit. Build does.';
    default:
      return 'One step at a time.';
  }
}

/**
 * Connected Home readiness. Completed steps stay in the list.
 * The header count is those rows and how many of them are done.
 * The first required step that is not done owns the single call to action.
 * Store accounts are shown and never take that call to action.
 * A failed read stays on that step and is not treated as done.
 */
export function buildGoLive(input: GoLiveInput): GoLiveModel {
  const steps = assignTones(draftSteps(input));
  const focus = focusStep(steps);
  const readyCount = steps.filter((step) => step.tone === 'done').length;
  return {
    headline: headlineFor(focus, input),
    support: supportFor(focus, input),
    readyCount,
    stepCount: steps.length,
    steps,
    cta: ctaFor(focus, input),
  };
}
