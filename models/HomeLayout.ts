import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHomeLayoutSection {
  type: 'carousel' | 'promo_banners' | 'callout_banners' | 'category_grid' | 'collection_displays' | 'collection_showcases' | 'category_collection_grid';
  isVisible: boolean;
  position: number;
}

export interface IHomeLayout extends Document {
  storeId: string;
  /** Published snapshot. Empty until the merchant publishes. Readers that share this document should treat this list as live. */
  sections: IHomeLayoutSection[];
  /** Saved editor draft. Order and visibility changes land here until publish. */
  draftSections: IHomeLayoutSection[];
  /** Set only by an explicit publish. Absent or null means the layout is not published. */
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const HomeLayoutSectionSchema = new Schema<IHomeLayoutSection>(
  {
    type: {
      type: String,
      enum: ['carousel', 'promo_banners', 'callout_banners', 'category_grid', 'collection_displays', 'collection_showcases', 'category_collection_grid'],
      required: true,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    position: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const HomeLayoutSchema = new Schema<IHomeLayout>(
  {
    storeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sections: {
      type: [HomeLayoutSectionSchema],
      default: [],
    },
    draftSections: {
      type: [HomeLayoutSectionSchema],
      default: [],
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Default sections order
export const DEFAULT_SECTIONS: IHomeLayoutSection[] = [
  { type: 'carousel', isVisible: true, position: 0 },
  { type: 'promo_banners', isVisible: true, position: 1 },
  { type: 'callout_banners', isVisible: true, position: 2 },
  { type: 'category_grid', isVisible: true, position: 3 },
  { type: 'collection_displays', isVisible: true, position: 4 },
  { type: 'collection_showcases', isVisible: true, position: 5 },
  { type: 'category_collection_grid', isVisible: true, position: 6 },
];

export const HomeLayout: Model<IHomeLayout> = mongoose.models.HomeLayout || mongoose.model<IHomeLayout>('HomeLayout', HomeLayoutSchema);
