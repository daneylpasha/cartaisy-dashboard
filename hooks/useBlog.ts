'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from '@/lib/auth';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string | null;
  tags: string[];
  category: string | null;
  author: string;
  status: 'draft' | 'published';
  publishedAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlogFilters {
  status?: 'draft' | 'published' | 'all';
  search?: string;
  sortBy?: 'createdAt' | 'publishedAt' | 'title';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UseBlogsReturn {
  blogs: BlogPost[];
  loading: boolean;
  error: string | null;
  pagination: Pagination | null;
  refetch: () => Promise<void>;
}

export interface UseBlogReturn {
  blog: BlogPost | null;
  loading: boolean;
  error: string | null;
}

export interface BlogStats {
  total: number;
  published: number;
  drafts: number;
}

export interface UseBlogStatsReturn {
  stats: BlogStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch list of blogs with filtering and pagination
 */
export function useBlogs(filters: BlogFilters = {}): UseBlogsReturn {
  const { data: session } = useSession();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const fetchBlogs = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.order) params.set('order', filters.order);
      if (filters.page) params.set('page', filters.page.toString());
      if (filters.limit) params.set('limit', filters.limit.toString());

      const response = await fetch(`/api/blogs?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch blogs');
      }

      if (data.success) {
        setBlogs(data.data);
        setPagination(data.pagination);
      } else {
        throw new Error(data.error || 'Failed to fetch blogs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blogs');
      setBlogs([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, filters.status, filters.search, filters.sortBy, filters.order, filters.page, filters.limit]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  return {
    blogs,
    loading,
    error,
    pagination,
    refetch: fetchBlogs,
  };
}

/**
 * Hook to fetch a single blog by ID
 */
export function useBlog(id: string | null): UseBlogReturn {
  const { data: session } = useSession();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      if (!session?.user?.id || !id || id === 'new') {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/blogs/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch blog');
        }

        if (data.success) {
          setBlog(data.data);
        } else {
          throw new Error(data.error || 'Failed to fetch blog');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch blog');
        setBlog(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [session?.user?.id, id]);

  return {
    blog,
    loading,
    error,
  };
}

/**
 * Hook to fetch blog stats
 */
export function useBlogStats(): UseBlogStatsReturn {
  const { data: session } = useSession();
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/blogs?stats=true');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

/**
 * Create a new blog post
 */
export async function createBlogPost(data: Partial<BlogPost>): Promise<BlogPost> {
  const response = await fetch('/api/blogs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to create blog post');
  }

  return result.data;
}

/**
 * Update a blog post
 */
export async function updateBlogPost(id: string, data: Partial<BlogPost>): Promise<BlogPost> {
  const response = await fetch(`/api/blogs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to update blog post');
  }

  return result.data;
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(id: string): Promise<void> {
  const response = await fetch(`/api/blogs/${id}`, {
    method: 'DELETE',
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to delete blog post');
  }
}
