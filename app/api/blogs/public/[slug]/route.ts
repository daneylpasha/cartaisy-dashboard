import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getBlogBySlug, getRelatedPosts } from '@/lib/services/blog';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/blogs/public/[slug] - Get a single published blog by slug
 * No authentication required
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();

    const { slug } = await params;

    const blog = await getBlogBySlug(slug);

    // Only return published posts for public access
    if (blog.status !== 'published') {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Get related posts
    const relatedPosts = await getRelatedPosts(slug, 3);

    return NextResponse.json({
      success: true,
      data: blog,
      relatedPosts,
    });
  } catch (error) {
    console.error('Get public blog error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch blog';

    if (message === 'Blog post not found') {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
