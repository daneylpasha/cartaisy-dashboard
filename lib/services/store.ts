import { connectToDatabase } from '@/lib/db';
import { Store } from '@/models/Store';
import { User } from '@/models/User';
import { CarouselItem } from '@/models/CarouselItem';
import { CategoryGrid } from '@/models/CategoryGrid';
import { PromoBanner } from '@/models/PromoBanner';
import { CalloutBanner } from '@/models/CalloutBanner';
import { CollectionDisplay } from '@/models/CollectionDisplay';
import { CollectionShowcase } from '@/models/CollectionShowcase';
import { CategoryCollectionGrid } from '@/models/CategoryCollectionGrid';
import { deleteStoreBrandAssets } from '@/lib/services/storeBrandAssets';

export interface StoreStats {
  teamMemberCount: number;
  pendingInvitationCount: number;
  carouselCount: number;
  promoBannerCount: number;
  calloutBannerCount: number;
  categoryGridCount: number;
  collectionDisplayCount: number;
  collectionShowcaseCount: number;
  categoryCollectionGridCount: number;
}

export interface UpdateStoreInput {
  name?: string;
  settings?: {
    timezone?: string;
    currency?: string;
  };
}

/**
 * Fields safe to send to the browser. Shopify tokens are not included,
 * even if an older document still has them in MongoDB.
 */
function publicShopify(shopify: {
  shop?: string;
  isConnected?: boolean;
  connectedAt?: Date;
  scope?: string;
} | null | undefined) {
  if (!shopify) {
    return undefined;
  }

  return {
    shop: shopify.shop,
    isConnected: Boolean(shopify.isConnected),
    connectedAt: shopify.connectedAt,
    scope: shopify.scope,
  };
}

/**
 * Get current store details
 */
export async function getStore(storeId: string): Promise<any> {
  await connectToDatabase();

  const store = await Store.findById(storeId);
  if (!store) {
    throw new Error('Store not found');
  }

  return {
    id: store._id.toString(),
    name: store.name,
    slug: store.slug,
    shopify: publicShopify(store.shopify),
    plan: store.plan,
    settings: store.settings,
    isActive: store.isActive,
    createdAt: store.createdAt,
    updatedAt: store.updatedAt,
  };
}

/**
 * Update store details
 */
export async function updateStore(
  storeId: string,
  input: UpdateStoreInput
): Promise<any> {
  await connectToDatabase();

  const store = await Store.findById(storeId);
  if (!store) {
    throw new Error('Store not found');
  }

  // Update name if provided
  if (input.name && input.name.trim()) {
    store.name = input.name.trim();
  }

  // Update settings if provided
  if (input.settings) {
    if (!store.settings) {
      store.settings = { timezone: 'UTC', currency: 'USD' };
    }

    if (input.settings.timezone) {
      store.settings.timezone = input.settings.timezone;
    }

    if (input.settings.currency) {
      store.settings.currency = input.settings.currency;
    }
  }

  await store.save();

  return {
    id: store._id.toString(),
    name: store.name,
    slug: store.slug,
    shopify: publicShopify(store.shopify),
    plan: store.plan,
    settings: store.settings,
    isActive: store.isActive,
    createdAt: store.createdAt,
    updatedAt: store.updatedAt,
  };
}

/**
 * Get store statistics
 */
export async function getStoreStats(storeId: string): Promise<StoreStats> {
  await connectToDatabase();

  // Count team members
  const teamMemberCount = await User.countDocuments({
    storeId,
    isActive: true,
  });

  // Count pending invitations
  const now = new Date();
  const pendingInvitationCount = await User.countDocuments({
    storeId,
    isActive: false,
    inviteToken: { $ne: null },
    inviteExpiresAt: { $gt: now },
  });

  // Count components
  const [
    carouselCount,
    categoryGridCount,
    promoBannerCount,
    calloutBannerCount,
    collectionDisplayCount,
    collectionShowcaseCount,
    categoryCollectionGridCount,
  ] = await Promise.all([
    CarouselItem.countDocuments({ storeId }),
    CategoryGrid.countDocuments({ storeId }),
    PromoBanner.countDocuments({ storeId }),
    CalloutBanner.countDocuments({ storeId }),
    CollectionDisplay.countDocuments({ storeId }),
    CollectionShowcase.countDocuments({ storeId }),
    CategoryCollectionGrid.countDocuments({ storeId }),
  ]);

  return {
    teamMemberCount,
    pendingInvitationCount,
    carouselCount,
    promoBannerCount,
    calloutBannerCount,
    categoryGridCount,
    collectionDisplayCount,
    collectionShowcaseCount,
    categoryCollectionGridCount,
  };
}

/**
 * Delete store and all associated data
 * WARNING: This is permanent and cannot be undone
 */
export async function deleteStore(storeId: string): Promise<void> {
  await connectToDatabase();

  // Delete store
  const store = await Store.findByIdAndDelete(storeId);
  if (!store) {
    throw new Error('Store not found');
  }

  // Delete all users associated with store
  await User.deleteMany({ storeId });
  await deleteStoreBrandAssets(storeId);

  // TODO: Delete AppConfig
  // TODO: Delete other store-related data
}
