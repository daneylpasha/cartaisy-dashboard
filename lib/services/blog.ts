import { connectToDatabase } from '@/lib/db';
import { BlogPost, IBlogPost } from '@/models/BlogPost';
import { generateSlug } from '@/lib/utils/slug';

export interface CreateBlogInput {
  title: string;
  slug?: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  tags?: string[];
  category?: string;
  author: string;
  status?: 'draft' | 'published';
  metaTitle?: string;
  metaDescription?: string;
}

export interface UpdateBlogInput extends Partial<CreateBlogInput> {}

export interface BlogFilters {
  status?: 'draft' | 'published' | 'all';
  search?: string;
  tag?: string;
  category?: string;
  sortBy?: 'createdAt' | 'publishedAt' | 'title';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get all blogs with filtering, pagination, and sorting
 */
export async function getAllBlogs(filters: BlogFilters = {}): Promise<PaginatedResult<any>> {
  await connectToDatabase();

  const {
    status = 'all',
    search,
    tag,
    category,
    sortBy = 'createdAt',
    order = 'desc',
    page = 1,
    limit = 10,
  } = filters;

  // Build query
  const query: any = {};

  if (status !== 'all') {
    query.status = status;
  }

  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }

  if (tag) {
    query.tags = tag;
  }

  if (category) {
    query.category = category;
  }

  // Get total count
  const total = await BlogPost.countDocuments(query);

  // Build sort
  const sortOrder = order === 'asc' ? 1 : -1;
  const sort: any = { [sortBy]: sortOrder };

  // Fetch paginated results
  const skip = (page - 1) * limit;
  const blogs = await BlogPost.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    data: blogs.map(formatBlogPost),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single blog by ID
 */
export async function getBlogById(id: string): Promise<any> {
  await connectToDatabase();

  const blog = await BlogPost.findById(id).lean();
  if (!blog) {
    throw new Error('Blog post not found');
  }

  return formatBlogPost(blog);
}

/**
 * Get a single blog by slug
 */
export async function getBlogBySlug(slug: string): Promise<any> {
  await connectToDatabase();

  const blog = await BlogPost.findOne({ slug }).lean();
  if (!blog) {
    throw new Error('Blog post not found');
  }

  return formatBlogPost(blog);
}

/**
 * Create a new blog post
 */
export async function createBlog(data: CreateBlogInput): Promise<any> {
  await connectToDatabase();

  // Generate slug from title if not provided
  let slug = data.slug || generateSlug(data.title);

  // Check if slug exists and make it unique
  const existingBlog = await BlogPost.findOne({ slug });
  if (existingBlog) {
    const timestamp = Date.now().toString(36);
    slug = `${slug}-${timestamp}`;
  }

  const blogData: any = {
    ...data,
    slug,
    tags: data.tags || [],
    status: data.status || 'draft',
  };

  // Set publishedAt if publishing
  if (data.status === 'published') {
    blogData.publishedAt = new Date();
  }

  const blog = new BlogPost(blogData);
  await blog.save();

  return formatBlogPost(blog.toObject());
}

/**
 * Update a blog post
 */
export async function updateBlog(id: string, data: UpdateBlogInput): Promise<any> {
  await connectToDatabase();

  const blog = await BlogPost.findById(id);
  if (!blog) {
    throw new Error('Blog post not found');
  }

  // Update fields
  if (data.title !== undefined) blog.title = data.title;
  if (data.slug !== undefined) {
    // Check if new slug is unique (excluding current blog)
    const existingBlog = await BlogPost.findOne({ slug: data.slug, _id: { $ne: id } });
    if (existingBlog) {
      throw new Error('A blog with this slug already exists');
    }
    blog.slug = data.slug;
  }
  if (data.content !== undefined) blog.content = data.content;
  if (data.excerpt !== undefined) blog.excerpt = data.excerpt;
  if (data.featuredImage !== undefined) blog.featuredImage = data.featuredImage;
  if (data.tags !== undefined) blog.tags = data.tags;
  if (data.category !== undefined) blog.category = data.category;
  if (data.metaTitle !== undefined) blog.metaTitle = data.metaTitle;
  if (data.metaDescription !== undefined) blog.metaDescription = data.metaDescription;

  // Handle status change
  if (data.status !== undefined) {
    const wasPublished = blog.status === 'published';
    blog.status = data.status;

    // Set publishedAt when first publishing
    if (data.status === 'published' && !wasPublished && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }
  }

  await blog.save();

  return formatBlogPost(blog.toObject());
}

/**
 * Delete a blog post
 */
export async function deleteBlog(id: string): Promise<void> {
  await connectToDatabase();

  const blog = await BlogPost.findById(id);
  if (!blog) {
    throw new Error('Blog post not found');
  }

  await BlogPost.deleteOne({ _id: id });
}

/**
 * Get published blogs for public display
 */
export async function getPublishedBlogs(
  page: number = 1,
  limit: number = 9,
  tag?: string,
  category?: string
): Promise<PaginatedResult<any>> {
  await connectToDatabase();

  const query: any = { status: 'published' };

  if (tag) {
    query.tags = tag;
  }

  if (category) {
    query.category = category;
  }

  const total = await BlogPost.countDocuments(query);
  const skip = (page - 1) * limit;

  const blogs = await BlogPost.find(query)
    .select('-content')
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    data: blogs.map(formatBlogPost),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get blog stats (total, published, drafts)
 */
export async function getBlogStats(): Promise<{ total: number; published: number; drafts: number }> {
  await connectToDatabase();

  const [total, published, drafts] = await Promise.all([
    BlogPost.countDocuments(),
    BlogPost.countDocuments({ status: 'published' }),
    BlogPost.countDocuments({ status: 'draft' }),
  ]);

  return { total, published, drafts };
}

/**
 * Get all unique tags
 */
export async function getAllTags(): Promise<string[]> {
  await connectToDatabase();

  const result = await BlogPost.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags' } },
    { $sort: { _id: 1 } },
  ]);

  return result.map((r) => r._id);
}

/**
 * Get all unique categories
 */
export async function getAllCategories(): Promise<string[]> {
  await connectToDatabase();

  const categories = await BlogPost.distinct('category', { category: { $ne: null } });
  return categories.sort();
}

/**
 * Get related posts by matching tags or category
 */
export async function getRelatedPosts(
  slug: string,
  limit: number = 3
): Promise<any[]> {
  await connectToDatabase();

  const currentPost = await BlogPost.findOne({ slug }).lean();
  if (!currentPost) {
    return [];
  }

  const query: any = {
    _id: { $ne: currentPost._id },
    status: 'published',
    $or: [],
  };

  if (currentPost.tags && currentPost.tags.length > 0) {
    query.$or.push({ tags: { $in: currentPost.tags } });
  }

  if (currentPost.category) {
    query.$or.push({ category: currentPost.category });
  }

  // If no tags or category, just get recent posts
  if (query.$or.length === 0) {
    delete query.$or;
  }

  const relatedPosts = await BlogPost.find(query)
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

  return relatedPosts.map(formatBlogPost);
}

/**
 * Format blog post for API response
 */
function formatBlogPost(blog: any): any {
  return {
    id: blog._id.toString(),
    title: blog.title,
    slug: blog.slug,
    content: blog.content,
    excerpt: blog.excerpt,
    featuredImage: blog.featuredImage || null,
    tags: blog.tags || [],
    category: blog.category || null,
    author: blog.author,
    status: blog.status,
    publishedAt: blog.publishedAt ? new Date(blog.publishedAt).toISOString() : null,
    metaTitle: blog.metaTitle || null,
    metaDescription: blog.metaDescription || null,
    createdAt: new Date(blog.createdAt).toISOString(),
    updatedAt: new Date(blog.updatedAt).toISOString(),
  };
}
