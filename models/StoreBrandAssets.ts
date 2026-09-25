import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStoreBrandAssets extends Document {
  storeId: string;
  iconUrl?: string | null;
  splashUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const StoreBrandAssetsSchema = new Schema<IStoreBrandAssets>(
  {
    storeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    iconUrl: {
      type: String,
      default: null,
    },
    splashUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const StoreBrandAssets: Model<IStoreBrandAssets> =
  mongoose.models.StoreBrandAssets ||
  mongoose.model<IStoreBrandAssets>('StoreBrandAssets', StoreBrandAssetsSchema);
