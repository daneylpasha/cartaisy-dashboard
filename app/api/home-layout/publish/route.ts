import { getServerSession, authConfig } from '@/lib/auth/server';
import { NextRequest, NextResponse } from 'next/server';
import * as homeLayoutService from '@/lib/services/homeLayout';
import { logActivityFromRequest } from '@/lib/utils/activityLogger';

/**
 * POST /api/home-layout/publish
 * Copy the editor layout into the published snapshot for this store.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id || !session.user.storeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sections } = await request.json();

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json({ error: 'Sections array is required' }, { status: 400 });
    }

    const layout = await homeLayoutService.publishHomeLayout(session.user.storeId, sections);

    await logActivityFromRequest({
      action: 'update',
      resourceType: 'home_layout',
      resourceId: 'home_layout',
      resourceName: 'Home Screen Layout',
      changes: { after: { publishedAt: layout.publishedAt, sections: layout.publishedSections } },
    });

    return NextResponse.json({
      success: true,
      data: layout,
      message: 'Home layout published',
    });
  } catch (error) {
    console.error('Home layout publish error:', error);
    return NextResponse.json({ error: 'Failed to publish home layout' }, { status: 500 });
  }
}
