import { connectToDatabase } from '@/lib/db';
import { persistedBrandImageUrl, type StoredBrandAssets } from '@/lib/onboarding/brandAssets';
import { StoreBrandAssets } from '@/models/StoreBrandAssets';

const EMPTY: StoredBrandAssets = { iconUrl: null, splashUrl: null };

export class BrandAssetInputError extends Error {
  constructor() {
    super('Use an https image address.');
    this.name = 'BrandAssetInputError';
  }
}

function readStored(value: unknown): string | null {
  return persistedBrandImageUrl(value);
}

export async function getStoreBrandAssets(storeId: string): Promise<StoredBrandAssets> {
  await connectToDatabase();
  const doc = await StoreBrandAssets.findOne({ storeId }).lean<{
    iconUrl?: string | null;
    splashUrl?: string | null;
  } | null>();
  if (!doc) return EMPTY;
  return {
    iconUrl: readStored(doc.iconUrl),
    splashUrl: readStored(doc.splashUrl),
  };
}

export async function saveStoreBrandAssets(storeId: string, input: unknown): Promise<StoredBrandAssets> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new BrandAssetInputError();
  }

  const body = input as Record<string, unknown>;
  const patch: { iconUrl?: string | null; splashUrl?: string | null } = {};

  for (const key of ['iconUrl', 'splashUrl'] as const) {
    if (!(key in body)) continue;
    const value = body[key];
    if (value === null) {
      patch[key] = null;
      continue;
    }
    const url = persistedBrandImageUrl(value);
    if (!url) throw new BrandAssetInputError();
    patch[key] = url;
  }

  if (Object.keys(patch).length === 0) {
    throw new BrandAssetInputError();
  }

  await connectToDatabase();
  const doc = await StoreBrandAssets.findOneAndUpdate(
    { storeId },
    { $set: patch },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean<{ iconUrl?: string | null; splashUrl?: string | null } | null>();

  return {
    iconUrl: readStored(doc?.iconUrl),
    splashUrl: readStored(doc?.splashUrl),
  };
}

export async function deleteStoreBrandAssets(storeId: string): Promise<void> {
  await connectToDatabase();
  await StoreBrandAssets.deleteMany({ storeId });
}
