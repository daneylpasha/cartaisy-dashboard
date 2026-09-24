/**
 * Store Types
 */
export interface Store {
  _id?: string;
  name: string;
  slug: string;
  shopify?: {
    shop?: string;
    isConnected: boolean;
    connectedAt?: Date;
    scope?: string;
  };
  plan?: {
    type: 'free' | 'starter' | 'pro' | 'enterprise';
    maxMembers: number;
  };
  settings?: {
    timezone: string;
    currency: string;
  };
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * User Types
 */
export interface User {
  id: string;
  email: string;
  storeId: string;
  storeName?: string;
  role: 'super_admin' | 'admin';
  name?: string;
  invitedBy?: string;
  inviteToken?: string;
  inviteExpiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Component Types
 */
export interface Component {
  id: string;
  type: string;
  title: string;
  position: number;
  isActive: boolean;
}

/**
 * App Configuration Types
 */
export interface AppConfig {
  _id?: string;
  storeId: string;
  components: Component[];
  updatedAt?: Date;
  createdAt?: Date;
}

/**
 * Shopify Types - Legacy (keeping for compatibility)
 */

/**
 * Team Types
 */
export interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  role: 'super_admin' | 'admin';
  isActive: boolean;
  invitedBy: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface Invitation {
  id: string;
  email: string;
  role: 'super_admin' | 'admin';
  inviteToken: string;
  inviteExpiresAt: string;
  invitedBy: {
    id: string;
    email: string;
  };
}

/**
 * Store Types
 */
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
 * Carousel Types
 */
export interface CarouselItem {
  id: string;
  storeId: string;
  imageUrl: string;
  label: string;
  title: string;
  subtitle: string;
  ctaText: string;
  collectionId: string;
  endsAt: string | null;
  promoTag: {
    text?: string;
    imageUrl?: string;
    backgroundColor?: string;
    textColor?: string;
  } | null;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCarouselInput {
  imageUrl: string;
  label: string;
  title: string;
  subtitle: string;
  ctaText?: string;
  collectionId: string;
  endsAt?: string;
  promoTag?: {
    text?: string;
    imageUrl?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  isActive?: boolean;
}

export interface UpdateCarouselInput extends Partial<CreateCarouselInput> {
  position?: number;
}

/**
 * Category Grid Types
 */
export interface CategoryGridItem {
  id: string;
  storeId: string;
  imageUrl: string;
  title: string;
  collectionId: string;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryGridInput {
  imageUrl: string;
  title: string;
  collectionId: string;
  isActive?: boolean;
}

export interface UpdateCategoryGridInput extends Partial<CreateCategoryGridInput> {
  position?: number;
}

/**
 * Shopify Types
 */
export interface ShopifyStatus {
  isConnected: boolean;
  shop: string | null;
  connectedAt: string | null;
  scope: string | null;
  status?: 'connected' | 'disconnected';
  lastSyncAt?: string | null;
  webhookRegistrationError?: string | null;
}

export interface ShopifyCollection {
  id: string;
  numericId?: number;
  title: string;
  handle: string;
  description?: string | null;
  image: { src: string } | null;
  productsCount?: number;
}

/**
 * API Response Types
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Callout Banner Types
 */
export interface CalloutBannerItem {
  id: string;
  storeId: string;
  imageUrl: string;
  title: string;
  subTitle: string;
  buttonText: string;
  action: {
    type: 'collection' | 'navigation';
    collectionId?: string;
    navigateTo?: string;
  };
  position: number;
  isActive: boolean;
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalloutBannerInput {
  imageUrl: string;
  title: string;
  subTitle: string;
  buttonText: string;
  action: {
    type: 'collection' | 'navigation';
    collectionId?: string;
    navigateTo?: string;
  };
  isActive?: boolean;
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
}

export interface UpdateCalloutBannerInput extends Partial<CreateCalloutBannerInput> {
  position?: number;
}

/**
 * Collection Display Types
 */
export interface CollectionDisplayItem {
  id: string;
  storeId: string;
  type: 'large_row' | 'small_grid' | 'medium_row';
  collectionId: string;
  title?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollectionDisplayInput {
  type: 'large_row' | 'small_grid' | 'medium_row';
  collectionId: string;
  title?: string;
  isActive?: boolean;
}

export interface UpdateCollectionDisplayInput extends Partial<CreateCollectionDisplayInput> {
  order?: number;
}

/**
 * Promo Banner Types
 */
export interface PromoBannerItem {
  id: string;
  storeId: string;
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  collectionId: string;
  position: number;
  isActive: boolean;
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromoBannerInput {
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  collectionId: string;
  isActive?: boolean;
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
}

export interface UpdatePromoBannerInput extends Partial<CreatePromoBannerInput> {
  position?: number;
}

/**
 * Category Collection Grid Types
 */
export interface CollectionGridItem {
  image: string;
  title: string;
  collectionId: string;
}

export interface CategoryCollectionGridItem {
  id: string;
  storeId: string;
  title: string;
  subtitle: string;
  collections: CollectionGridItem[];
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryCollectionGridInput {
  title: string;
  subtitle: string;
  collections: CollectionGridItem[];
  isActive?: boolean;
}

export interface UpdateCategoryCollectionGridInput extends Partial<CreateCategoryCollectionGridInput> {
  position?: number;
}

/**
 * Collection Showcase Types
 */
export interface ShowcaseCollectionItem {
  image: string;
  title: string;
  collectionId: string;
}

export interface CollectionShowcaseItem {
  id: string;
  storeId: string;
  type: 'grid' | 'circular';
  title: string;
  icon?: string;
  collections: ShowcaseCollectionItem[];
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollectionShowcaseInput {
  type: 'grid' | 'circular';
  title: string;
  icon?: string;
  collections: ShowcaseCollectionItem[];
  isActive?: boolean;
}

export interface UpdateCollectionShowcaseInput extends Partial<CreateCollectionShowcaseInput> {
  position?: number;
}

/**
 * Homescreen Preview Types
 */
export interface HomescreenPreviewData {
  carousel: CarouselItem[];
  categoryGrid: CategoryGridItem[];
  calloutBanners: CalloutBannerItem[];
  collectionDisplays: CollectionDisplayItem[];
  categoryCollectionGrids: CategoryCollectionGridItem[];
  promoBanners: PromoBannerItem[];
  collectionShowcases: CollectionShowcaseItem[];
  metadata: {
    totalComponents: number;
    activeComponents: number;
    lastUpdated: string;
  };
}

/**
 * Activity Types
 */
export type ActivityAction = 'create' | 'update' | 'delete' | 'activate' | 'deactivate';

export type ActivityResourceType =
  | 'carousel'
  | 'category_grid'
  | 'callout_banner'
  | 'collection_display'
  | 'promo_banner'
  | 'category_collection_grid'
  | 'collection_showcase'
  | 'store_settings'
  | 'team_member'
  | 'shopify_connection';

export interface Activity {
  id: string;
  storeId: string;
  userId: string;
  user: {
    name: string | null;
    email: string;
  };
  action: ActivityAction;
  resourceType: ActivityResourceType;
  resourceId: string;
  resourceName: string | null;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface ActivityFilters {
  userId?: string;
  action?: ActivityAction;
  resourceType?: ActivityResourceType;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ActivityStats {
  totalChanges7Days: number;
  totalChanges24Hours: number;
  mostActiveUser: {
    userId: string;
    name: string | null;
    email: string;
    count: number;
  } | null;
  mostEditedType: {
    resourceType: string;
    count: number;
  } | null;
  actionBreakdown: {
    action: string;
    count: number;
  }[];
}
