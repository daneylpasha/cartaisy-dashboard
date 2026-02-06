import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getPublishedBlogs, getAllTags, getAllCategories } from '@/lib/services/blog';

/**
 * GET /api/blogs/public - List published blogs for public display
 * No authentication required
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);

    // Check if tags or categories are requested
    if (searchParams.get('tags') === 'true') {
      const tags = await getAllTags();
      return NextResponse.json({
        success: true,
        data: tags,
      });
    }

    if (searchParams.get('categories') === 'true') {
      const categories = await getAllCategories();
      return NextResponse.json({
        success: true,
        data: categories,
      });
    }

    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 9;
    const tag = searchParams.get('tag') || undefined;
    const category = searchParams.get('category') || undefined;

    const result = await getPublishedBlogs(page, limit, tag, category);

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Get public blogs error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blogs' },
      { status: 500 }
    );
  }
}
