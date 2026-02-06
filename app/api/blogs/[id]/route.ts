import { getServerSession, authConfig } from '@/lib/auth/server';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getBlogById, updateBlog, deleteBlog } from '@/lib/services/blog';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/blogs/[id] - Get a single blog by ID
 * Requires super_admin role
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    await connectToDatabase();

    const blog = await getBlogById(id);

    return NextResponse.json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error('Get blog error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch blog';

    if (message === 'Blog post not found') {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * PUT /api/blogs/[id] - Update a blog post
 * Requires super_admin role
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validation
    if (body.title !== undefined && !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title cannot be empty' },
        { status: 400 }
      );
    }

    if (body.content !== undefined && !body.content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Content cannot be empty' },
        { status: 400 }
      );
    }

    if (body.excerpt !== undefined) {
      if (!body.excerpt.trim()) {
        return NextResponse.json(
          { success: false, error: 'Excerpt cannot be empty' },
          { status: 400 }
        );
      }
      if (body.excerpt.length > 300) {
        return NextResponse.json(
          { success: false, error: 'Excerpt must be 300 characters or less' },
          { status: 400 }
        );
      }
    }

    await connectToDatabase();

    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.slug !== undefined) updateData.slug = body.slug.trim();
    if (body.content !== undefined) updateData.content = body.content.trim();
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt.trim();
    if (body.featuredImage !== undefined) updateData.featuredImage = body.featuredImage;
    if (body.tags !== undefined) updateData.tags = Array.isArray(body.tags) ? body.tags : [];
    if (body.category !== undefined) updateData.category = body.category?.trim() || null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.metaTitle !== undefined) updateData.metaTitle = body.metaTitle?.trim() || null;
    if (body.metaDescription !== undefined) updateData.metaDescription = body.metaDescription?.trim() || null;

    const blog = await updateBlog(id, updateData);

    return NextResponse.json({
      success: true,
      data: blog,
      message: 'Blog post updated successfully',
    });
  } catch (error) {
    console.error('Update blog error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update blog';

    if (message === 'Blog post not found') {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }

    if (message === 'A blog with this slug already exists') {
      return NextResponse.json({ success: false, error: message }, { status: 409 });
    }

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/blogs/[id] - Delete a blog post
 * Requires super_admin role
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    await connectToDatabase();

    await deleteBlog(id);

    return NextResponse.json({
      success: true,
      message: 'Blog post deleted successfully',
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete blog';

    if (message === 'Blog post not found') {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
