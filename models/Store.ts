import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStore extends Document {
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
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema = new Schema<IStore>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Connection display fields only. The backend owns shopify.accessToken
    // for new connects. This schema has no token path, so Mongoose strict
    // mode drops a dashboard write of shopify.accessToken.
    shopify: {
      shop: String,
      isConnected: {
        type: Boolean,
        default: false,
      },
      connectedAt: Date,
      scope: String,
    },
    plan: {
      type: {
        type: String,
        enum: ['free', 'starter', 'pro', 'enterprise'],
        default: 'free',
      },
      maxMembers: {
        type: Number,
        default: 5,
      },
    },
    settings: {
      timezone: {
        type: String,
        default: 'UTC',
      },
      currency: {
        type: String,
        default: 'USD',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Index for queries
StoreSchema.index({ slug: 1, isActive: 1 });

export const Store: Model<IStore> = mongoose.models.Store || mongoose.model<IStore>('Store', StoreSchema);
