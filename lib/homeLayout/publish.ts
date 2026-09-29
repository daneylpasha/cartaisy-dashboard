/**
 * Draft vs published home layout.
 *
 * The editor works on a draft. Publish copies that draft into the stored
 * section list (`sections`), which is the snapshot a reader should treat as
 * live. Until `publishedAt` is set, the public home feed returns no layout
 * so the installed app can keep its default home.
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
      'The installed app keeps the default home under its header until you publish this layout.',
  },
  published: {
    label: 'Published',
    detail: 'This layout is what the installed app should show under the home header.',
  },
  publishedEmpty: {
    label: 'Published',
    detail:
      'No modules are visible, so the installed app keeps the default home under its header.',
  },
  draft: {
    label: 'Draft',
    detail:
      'These edits are not on the installed app. It should still show the last published layout.',
  },
  success:
    'Published. This layout is what the installed app should show under the home header. The default home stays until a layout is published.',
  successEmpty:
    'Published. No modules are visible, so the installed app keeps the default home under its header.',
  action: 'Publish home',
  publishing: 'Publishing...',
  saveDraft: 'Save draft',
  draftSaved: 'Draft saved. It is not on the installed app.',
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
 * Editor draft plus the snapshot that is allowed to go live.
 * A saved layout with no `publishedAt` stays a draft, including older
 * documents that were written before publish existed.
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
  const publishedAt = isPublishedAt(input.publishedAt);
  const published = publishedAt ? sortByPosition(input.storedSections) : [];
  const savedDraft = sortByPosition(input.draftSections);
  const stored = sortByPosition(input.storedSections);

  let draft: HomeLayoutSectionSnapshot[];
  if (savedDraft.length > 0) {
    draft = savedDraft;
  } else if (publishedAt) {
    draft = stored;
  } else if (stored.length > 0) {
    draft = stored;
  } else {
    draft = normalizeLayoutSections(input.fallback);
  }

  const status: HomePublishStatus = !isPublishedAt(input.publishedAt)
    ? 'not_published'
    : layoutsEqual(draft, published)
      ? 'published'
      : 'draft';

  return { draft, published, status };
}

/** Sections the public home feed may return. Empty until a layout is published. */
export function publishedFeedSections(
  publishedAt: string | Date | null | undefined,
  storedSections: readonly HomeLayoutSectionSnapshot[] | null | undefined
): HomeLayoutSectionSnapshot[] {
  if (!isPublishedAt(publishedAt)) return [];
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
  sections: readonly { isVisible: boolean }[]
): { label: string; detail: string } {
  if (status === 'not_published') return HOME_PUBLISH_COPY.notPublished;
  if (status === 'draft') return HOME_PUBLISH_COPY.draft;
  const visible = sections.some((section) => section.isVisible);
  return visible ? HOME_PUBLISH_COPY.published : HOME_PUBLISH_COPY.publishedEmpty;
}

export function publishSuccessCopy(sections: readonly { isVisible: boolean }[]): string {
  return sections.some((section) => section.isVisible)
    ? HOME_PUBLISH_COPY.success
    : HOME_PUBLISH_COPY.successEmpty;
}
