import { getServerSession, authConfig } from '@/lib/auth/server';
import { NextResponse } from 'next/server';
import * as homeLayoutService from '@/lib/services/homeLayout';
import { logActivityFromRequest } from '@/lib/utils/activityLogger';

/**
 * POST /api/home-layout/unpublish
 * Clear this store's live home snapshot. The editor draft stays.
 */
export async function POST() {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id || !session.user.storeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const layout = await homeLayoutService.unpublishHomeLayout(session.user.storeId);

    await logActivityFromRequest({
      action: 'update',
      resourceType: 'home_layout',
      resourceId: 'home_layout',
      resourceName: 'Home Screen Layout',
      changes: { after: { publishedAt: null, sections: [] } },
    });

    return NextResponse.json({
      success: true,
      data: layout,
      message: 'Home layout unpublished',
    });
  } catch (error) {
    console.error('Home layout unpublish error:', error);
    return NextResponse.json({ error: 'Failed to unpublish home layout' }, { status: 500 });
  }
}
