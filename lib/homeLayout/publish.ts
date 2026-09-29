/**
 * Draft vs published home layout.
 *
 * The editor works on a draft. Publish copies that draft into `sections`,
 * which is the list the installed app can read. A draft save does not
 * overwrite `sections`. Unpublish clears `sections` and `publishedAt` and
 * leaves the draft. A document that already has sections but no
 * `publishedAt` was live under the old save-writes-sections model and stays
 * published until unpublish. A saved draft with an empty live snapshot is
 * Draft. Only a store with no saved sections and no saved draft is
 * "not published yet".
 */

export type HomePublishStatus = 'not_published' | 'published' | 'draft';

export interface HomeLayoutSectionSnapshot {
  type: string;
  isVisible: boolean;
  position: number;
}

export const HOME_PUBLISH_COPY = {
  notPublished: {
    label: 'Not published yet',
    detail:
      'Nothing is saved as the section order yet. Publish home writes the order the installed app reads under its header.',
  },
  published: {
    label: 'Published',
    detail: 'The installed app reads this section order under the home header.',
  },
  publishedEmpty: {
    label: 'Published',
    detail:
      'No modules are visible in the saved section order, so the installed app keeps the default home under its header.',
  },
  draft: {
    label: 'Draft',
    detail:
      'These edits are not in the section order the installed app reads. It still uses the last published layout.',
  },
  draftOffline: {
    label: 'Draft',
    detail:
      'Your draft is still here. The installed app uses the smart default until you publish again.',
  },
  success:
    'Published. The installed app reads this section order under the home header. A later draft does not replace it until you publish again.',
  successEmpty:
    'Published. No modules are visible, so the installed app keeps the default home under its header.',
  action: 'Publish home',
  publishing: 'Publishing...',
  saveDraft: 'Save draft',
  draftSaved: 'Draft saved. This does not change the section order the installed app reads.',
  unpublish: 'Unpublish home',
  unpublishing: 'Unpublishing...',
  unpublishConfirm:
    'The installed app will show the smart default home until you publish again. Your draft stays in the editor.',
  unpublishCancel: 'Keep it published',
  reorderLive:
    'Drag to reorder the draft. The installed app keeps reading the last published section order until you publish again.',
  reorderOffline:
    'Drag to reorder the draft. The installed app uses the smart default until you publish again.',
} as const;

export function normalizeLayoutSections(
  sections: readonly HomeLayoutSectionSnapshot[]
): HomeLayoutSectionSnapshot[] {
  return sections.map((section, index) => ({
    type: section.type,
    isVisible: section.isVisible !== false,
    position: index,
  }));
}

export function layoutsEqual(
  left: readonly HomeLayoutSectionSnapshot[],
  right: readonly HomeLayoutSectionSnapshot[]
): boolean {
  const a = normalizeLayoutSections(left);
  const b = normalizeLayoutSections(right);
  if (a.length !== b.length) return false;
  return a.every((section, index) => {
    const other = b[index];
    return (
      section.type === other.type &&
      section.isVisible === other.isVisible &&
      section.position === other.position
    );
  });
}

function sortByPosition(
  sections: readonly HomeLayoutSectionSnapshot[] | null | undefined
): HomeLayoutSectionSnapshot[] {
  return [...(sections ?? [])].sort((a, b) => a.position - b.position);
}

export function isPublishedAt(value: string | Date | null | undefined): boolean {
  if (value == null) return false;
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  return value.trim().length > 0;
}

/**
 * A non-empty `sections` list with no `publishedAt` was already the live
 * order under the old model. It stays published. An empty list with no
 * `publishedAt` is not live, including after unpublish.
 */
export function homeLayoutIsLive(
  publishedAt: string | Date | null | undefined,
  storedSections: readonly HomeLayoutSectionSnapshot[] | null | undefined
): boolean {
  if (isPublishedAt(publishedAt)) return true;
  return sortByPosition(storedSections).length > 0;
}

/**
 * Same live check as `homeLayoutIsLive`, for a JSON payload whose section
 * list may not be a typed snapshot. A missing list counts as empty.
 */
export function publishedSnapshotIsLive(publishedAt: unknown, publishedSections: unknown): boolean {
  const at = typeof publishedAt === 'string' || publishedAt instanceof Date ? publishedAt : null;
  const count = Array.isArray(publishedSections) ? publishedSections.length : 0;
  if (isPublishedAt(at)) return true;
  return count > 0;
}

/**
 * Draft to write when clearing the live snapshot.
 * Null leaves `draftSections` unchanged. A non-empty draft stays.
 * An empty draft takes the live list the editor was already showing.
 */
export function draftToKeepOnUnpublish(
  storedSections: readonly HomeLayoutSectionSnapshot[] | null | undefined,
  draftSections: readonly HomeLayoutSectionSnapshot[] | null | undefined
): HomeLayoutSectionSnapshot[] | null {
  const draft = sortByPosition(draftSections);
  if (draft.length > 0) return null;
  const stored = sortByPosition(storedSections);
  if (stored.length === 0) return null;
  return normalizeLayoutSections(stored);
}

/** True when a one-time backfill should set `publishedAt` and leave `sections` alone. */
export function needsLegacyPublishBackfill(
  publishedAt: string | Date | null | undefined,
  storedSections: readonly HomeLayoutSectionSnapshot[] | null | undefined
): boolean {
  return !isPublishedAt(publishedAt) && sortByPosition(storedSections).length > 0;
}

/** Prefer the document's last save time so the backfill is not "published just now". */
export function legacyPublishedAt(
  updatedAt: Date | string | null | undefined,
  now: Date = new Date()
): Date {
  if (updatedAt instanceof Date && !Number.isNaN(updatedAt.getTime())) return updatedAt;
  if (typeof updatedAt === 'string' && updatedAt.trim().length > 0) {
    const parsed = new Date(updatedAt);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return now;
}

/**
 * Editor draft plus the snapshot the installed app can read from `sections`.
 * Legacy documents with saved sections and no `publishedAt` count as published.
 * A saved draft with nothing live is Draft, so the editor does not say nothing is saved.
 */
export function resolveHomeLayoutView(input: {
  storedSections?: readonly HomeLayoutSectionSnapshot[] | null;
  draftSections?: readonly HomeLayoutSectionSnapshot[] | null;
  publishedAt?: string | Date | null;
  fallback: readonly HomeLayoutSectionSnapshot[];
}): {
  draft: HomeLayoutSectionSnapshot[];
  published: HomeLayoutSectionSnapshot[];
  status: HomePublishStatus;
} {
  const stored = sortByPosition(input.storedSections);
  const savedDraft = sortByPosition(input.draftSections);
  const live = homeLayoutIsLive(input.publishedAt, stored);
  const published = live ? stored : [];

  let draft: HomeLayoutSectionSnapshot[];
  if (savedDraft.length > 0) {
    draft = savedDraft;
  } else if (live) {
    draft = stored;
  } else {
    draft = normalizeLayoutSections(input.fallback);
  }

  const status: HomePublishStatus = !live
    ? savedDraft.length > 0
      ? 'draft'
      : 'not_published'
    : layoutsEqual(draft, published)
      ? 'published'
      : 'draft';

  return { draft, published, status };
}

/**
 * Sections the public home feed may return.
 * Empty only when nothing has been saved in `sections` and nothing is published.
 */
export function publishedFeedSections(
  publishedAt: string | Date | null | undefined,
  storedSections: readonly HomeLayoutSectionSnapshot[] | null | undefined
): HomeLayoutSectionSnapshot[] {
  if (!homeLayoutIsLive(publishedAt, storedSections)) return [];
  return sortByPosition(storedSections);
}

/**
 * Local unsaved edits are a draft. A store that has never published stays
 * "not published yet" even when the editor has unsaved changes.
 */
export function visiblePublishStatus(
  serverStatus: HomePublishStatus,
  hasUnsavedEdits: boolean
): HomePublishStatus {
  if (serverStatus === 'not_published') return 'not_published';
  if (hasUnsavedEdits || serverStatus === 'draft') return 'draft';
  return 'published';
}

export function publishStatusCopy(
  status: HomePublishStatus,
  sections: readonly { isVisible: boolean }[],
  live = true
): { label: string; detail: string } {
  if (status === 'not_published') return HOME_PUBLISH_COPY.notPublished;
  if (status === 'draft') return live ? HOME_PUBLISH_COPY.draft : HOME_PUBLISH_COPY.draftOffline;
  const visible = sections.some((section) => section.isVisible);
  return visible ? HOME_PUBLISH_COPY.published : HOME_PUBLISH_COPY.publishedEmpty;
}

export function publishSuccessCopy(sections: readonly { isVisible: boolean }[]): string {
  return sections.some((section) => section.isVisible)
    ? HOME_PUBLISH_COPY.success
    : HOME_PUBLISH_COPY.successEmpty;
}

/** App Builder with the Publish home control in view. */
export const APP_BUILDER_PUBLISH_HREF = '/dashboard/app-builder#publish-home';

export function isHomePublishStatus(value: unknown): value is HomePublishStatus {
  return value === 'not_published' || value === 'published' || value === 'draft';
}

export interface HomeLayoutOverview {
  status: HomePublishStatus;
  label: string;
  detail: string;
  /** True when the installable app is not yet showing this editor layout. */
  needsPublish: boolean;
}

function sectionVisibility(value: unknown): { isVisible: boolean }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const record = item as { isVisible?: unknown };
    return [{ isVisible: record.isVisible !== false }];
  });
}

/**
 * Read the same `GET /api/home-layout` body App Builder uses.
 * Null when the status is missing or unrecognized, so a failed read is not a status.
 */
export function homeLayoutOverviewFromPayload(payload: unknown): HomeLayoutOverview | null {
  if (!payload || typeof payload !== 'object') return null;
  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== 'object') return null;
  const record = data as {
    status?: unknown;
    sections?: unknown;
    publishedSections?: unknown;
    publishedAt?: unknown;
  };
  if (!isHomePublishStatus(record.status)) return null;

  const sections =
    record.status === 'published' && Array.isArray(record.publishedSections)
      ? sectionVisibility(record.publishedSections)
      : sectionVisibility(record.sections);
  const offlineDraft =
    record.status === 'draft' &&
    Array.isArray(record.publishedSections) &&
    !publishedSnapshotIsLive(record.publishedAt, record.publishedSections);
  const copy = publishStatusCopy(record.status, sections, !offlineDraft);

  return {
    status: record.status,
    label: copy.label,
    detail: copy.detail,
    needsPublish: record.status !== 'published',
  };
}
