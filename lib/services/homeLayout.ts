import { connectToDatabase } from '@/lib/db';
import { HomeLayout, IHomeLayoutSection, DEFAULT_SECTIONS } from '@/models/HomeLayout';
import {
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

/**
 * Editor view for a store. Does not create a document, so opening App Builder
 * does not write a layout the public feed or a shared reader could treat as live.
 */
export async function getHomeLayout(storeId: string): Promise<HomeLayoutResponse> {
  await connectToDatabase();
  const layout = await HomeLayout.findOne({ storeId }).lean();
  return toResponse(layout);
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

  const layout = await HomeLayout.findOneAndUpdate(
    { storeId },
    { $set: { draftSections } },
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
