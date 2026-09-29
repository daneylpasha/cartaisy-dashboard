import { connectToDatabase } from '@/lib/db';
import { HomeLayout, IHomeLayoutSection, DEFAULT_SECTIONS } from '@/models/HomeLayout';
import {
  draftToKeepOnUnpublish,
  legacyPublishedAt,
  needsLegacyPublishBackfill,
  normalizeLayoutSections,
  resolveHomeLayoutView,
  type HomePublishStatus,
} from '@/lib/homeLayout/publish';

export interface HomeLayoutResponse {
  sections: IHomeLayoutSection[];
  publishedSections: IHomeLayoutSection[];
  publishedAt: string | null;
  status: HomePublishStatus;
}

function asSections(value: unknown): IHomeLayoutSection[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((section) => {
    if (!section || typeof section !== 'object') return [];
    const candidate = section as { type?: unknown; isVisible?: unknown; position?: unknown };
    if (typeof candidate.type !== 'string' || candidate.type.length === 0) return [];
    return [
      {
        type: candidate.type as IHomeLayoutSection['type'],
        isVisible: candidate.isVisible !== false,
        position: typeof candidate.position === 'number' ? candidate.position : 0,
      },
    ];
  });
}

function toResponse(doc: {
  sections?: unknown;
  draftSections?: unknown;
  publishedAt?: Date | null;
} | null): HomeLayoutResponse {
  const view = resolveHomeLayoutView({
    storedSections: asSections(doc?.sections),
    draftSections: asSections(doc?.draftSections),
    publishedAt: doc?.publishedAt ?? null,
    fallback: DEFAULT_SECTIONS,
  });

  return {
    sections: view.draft as IHomeLayoutSection[],
    publishedSections: view.published as IHomeLayoutSection[],
    publishedAt: doc?.publishedAt ? new Date(doc.publishedAt).toISOString() : null,
    status: view.status,
  };
}

type LayoutDoc = {
  sections?: unknown;
  draftSections?: unknown;
  publishedAt?: Date | null;
  updatedAt?: Date | null;
} | null;

/**
 * One-time backfill for layouts saved before publish existed.
 * Sets `publishedAt` from `updatedAt` and does not write `sections`.
 */
async function backfillLegacyPublishedAt(storeId: string, layout: LayoutDoc): Promise<LayoutDoc> {
  if (!layout || !needsLegacyPublishBackfill(layout.publishedAt, asSections(layout.sections))) {
    return layout;
  }

  const publishedAt = legacyPublishedAt(layout.updatedAt);
  const updated = await HomeLayout.findOneAndUpdate(
    { storeId, publishedAt: null, 'sections.0': { $exists: true } },
    { $set: { publishedAt } },
    { new: true }
  ).lean();

  return updated ?? layout;
}

/**
 * Editor view for a store. Does not create a document. A legacy saved
 * `sections` list is marked published without being cleared.
 */
export async function getHomeLayout(storeId: string): Promise<HomeLayoutResponse> {
  await connectToDatabase();
  const layout = await HomeLayout.findOne({ storeId }).lean();
  return toResponse(await backfillLegacyPublishedAt(storeId, layout));
}

/**
 * Persist the editor draft. Does not set publishedAt and does not replace the
 * published section snapshot.
 */
export async function updateHomeLayout(
  storeId: string,
  sections: IHomeLayoutSection[]
): Promise<HomeLayoutResponse> {
  await connectToDatabase();
  const draftSections = normalizeLayoutSections(asSections(sections));
  const existing = await HomeLayout.findOne({ storeId }).lean();
  const set: { draftSections: ReturnType<typeof normalizeLayoutSections>; publishedAt?: Date } = {
    draftSections,
  };

  if (existing && needsLegacyPublishBackfill(existing.publishedAt, asSections(existing.sections))) {
    set.publishedAt = legacyPublishedAt(existing.updatedAt);
  }

  const layout = await HomeLayout.findOneAndUpdate(
    { storeId },
    { $set: set },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  if (!layout) {
    throw new Error('Failed to save home layout draft');
  }

  return toResponse(layout);
}

/**
 * Copy the current editor sections into the published snapshot.
 */
export async function publishHomeLayout(
  storeId: string,
  sections: IHomeLayoutSection[]
): Promise<HomeLayoutResponse> {
  await connectToDatabase();
  const published = normalizeLayoutSections(asSections(sections));
  const publishedAt = new Date();

  const layout = await HomeLayout.findOneAndUpdate(
    { storeId },
    {
      $set: {
        sections: published,
        draftSections: published,
        publishedAt,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  if (!layout) {
    throw new Error('Failed to publish home layout');
  }

  return toResponse(layout);
}

/**
 * Clear the live snapshot only. `draftSections` stays.
 * When the draft is empty, the live list the editor was showing is saved as the draft first.
 * Module documents are not deleted.
 */
export async function unpublishHomeLayout(storeId: string): Promise<HomeLayoutResponse> {
  await connectToDatabase();
  const existing = await HomeLayout.findOne({ storeId }).lean();
  if (!existing) {
    return toResponse(null);
  }

  const set: {
    sections: IHomeLayoutSection[];
    publishedAt: null;
    draftSections?: IHomeLayoutSection[];
  } = {
    sections: [],
    publishedAt: null,
  };
  const kept = draftToKeepOnUnpublish(asSections(existing.sections), asSections(existing.draftSections));
  if (kept) {
    set.draftSections = kept as IHomeLayoutSection[];
  }

  const layout = await HomeLayout.findOneAndUpdate(
    { storeId },
    { $set: set },
    { new: true }
  ).lean();

  if (!layout) {
    throw new Error('Failed to unpublish home layout');
  }

  return toResponse(layout);
}

/**
 * Toggle visibility on the saved draft only.
 */
export async function toggleSectionVisibility(
  storeId: string,
  sectionType: string,
  isVisible: boolean
): Promise<HomeLayoutResponse> {
  await connectToDatabase();
  const current = await getHomeLayout(storeId);
  const next = current.sections.map((section) =>
    section.type === sectionType ? { ...section, isVisible } : section
  );
  return updateHomeLayout(storeId, next);
}
