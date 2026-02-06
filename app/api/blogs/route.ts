import { getServerSession, authConfig } from '@/lib/auth/server';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getAllBlogs, createBlog, getBlogStats } from '@/lib/services/blog';

/**
 * GET /api/blogs - List all blogs with pagination and filtering
 * Requires super_admin role
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);

    // Check if stats are requested
    if (searchParams.get('stats') === 'true') {
      const stats = await getBlogStats();
      return NextResponse.json({
        success: true,
        stats,
      });
    }

    const filters = {
      status: searchParams.get('status') as 'draft' | 'published' | 'all' | undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') as 'createdAt' | 'publishedAt' | 'title' | undefined,
      order: searchParams.get('order') as 'asc' | 'desc' | undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
    };

    const result = await getAllBlogs(filters);

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blogs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/blogs - Create a new blog post
 * Requires super_admin role
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    // Validation
    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!body.content || !body.content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    if (!body.excerpt || !body.excerpt.trim()) {
      return NextResponse.json(
        { success: false, error: 'Excerpt is required' },
        { status: 400 }
      );
    }

    if (body.excerpt.length > 300) {
      return NextResponse.json(
        { success: false, error: 'Excerpt must be 300 characters or less' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const blogData = {
      title: body.title.trim(),
      slug: body.slug?.trim() || undefined,
      content: body.content.trim(),
      excerpt: body.excerpt.trim(),
      featuredImage: body.featuredImage || undefined,
      tags: Array.isArray(body.tags) ? body.tags : [],
      category: body.category?.trim() || undefined,
      author: session.user.email,
      status: body.status === 'published' ? 'published' : 'draft',
      metaTitle: body.metaTitle?.trim() || undefined,
      metaDescription: body.metaDescription?.trim() || undefined,
    };

    const blog = await createBlog(blogData as any);

    return NextResponse.json(
      {
        success: true,
        data: blog,
        message: 'Blog post created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create blog error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create blog post',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
