import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  tags: string[];
  category?: string;
  author: string;
  status: 'draft' | 'published';
  publishedAt?: Date;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BlogPostSchema = new Schema<IBlogPost>(
  {
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      required: true,
      maxlength: 300,
    },
    featuredImage: {
      type: String,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      default: null,
    },
    author: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    metaTitle: {
      type: String,
      maxlength: 70,
      default: null,
    },
    metaDescription: {
      type: String,
      maxlength: 160,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index for fetching published posts ordered by date
BlogPostSchema.index({ status: 1, publishedAt: -1 });

// Index for tag-based queries
BlogPostSchema.index({ tags: 1, status: 1 });

export const BlogPost: Model<IBlogPost> =
  mongoose.models.BlogPost || mongoose.model<IBlogPost>('BlogPost', BlogPostSchema);
