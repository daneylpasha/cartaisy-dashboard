import { getServerSession, authConfig } from '@/lib/auth/server';

import { NextRequest, NextResponse } from 'next/server';
import * as storeService from '@/lib/services/store';
import {
  BrandAssetInputError,
  getStoreBrandAssets,
  saveStoreBrandAssets,
} from '@/lib/services/storeBrandAssets';
import { canManageSettings } from '@/lib/utils/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id || !session.user.storeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [store, brandAssets] = await Promise.all([
      storeService.getStore(session.user.storeId),
      getStoreBrandAssets(session.user.storeId),
    ]);

    return NextResponse.json({
      success: true,
      data: { ...store, brandAssets },
    });
  } catch (error) {
    console.error('Store GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id || !session.user.storeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super_admin
    if (!canManageSettings(session.user.role)) {
      return NextResponse.json(
        { error: 'Only super admins can update store settings' },
        { status: 403 }
      );
    }

    const input = (await request.json()) as unknown;
    const record =
      input && typeof input === 'object' && !Array.isArray(input)
        ? (input as Record<string, unknown>)
        : null;
    if (!record) {
      return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
    }

    let brandAssets = await getStoreBrandAssets(session.user.storeId);
    if ('brandAssets' in record) {
      try {
        brandAssets = await saveStoreBrandAssets(session.user.storeId, record.brandAssets);
      } catch (error) {
        if (error instanceof BrandAssetInputError) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        throw error;
      }
    }

    const storeInput: { name?: string; settings?: { timezone?: string; currency?: string } } = {};
    if (typeof record.name === 'string') storeInput.name = record.name;
    if (record.settings && typeof record.settings === 'object' && !Array.isArray(record.settings)) {
      const settings = record.settings as Record<string, unknown>;
      storeInput.settings = {
        ...(typeof settings.timezone === 'string' ? { timezone: settings.timezone } : {}),
        ...(typeof settings.currency === 'string' ? { currency: settings.currency } : {}),
      };
    }

    const store =
      storeInput.name !== undefined || storeInput.settings
        ? await storeService.updateStore(session.user.storeId, storeInput)
        : await storeService.getStore(session.user.storeId);

    return NextResponse.json({
      success: true,
      data: { ...store, brandAssets },
      message: 'Store updated successfully',
    });
  } catch (error) {
    console.error('Store PATCH error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update store';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id || !session.user.storeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super_admin
    if (!canManageSettings(session.user.role)) {
      return NextResponse.json(
        { error: 'Only super admins can delete stores' },
        { status: 403 }
      );
    }

    await storeService.deleteStore(session.user.storeId);

    return NextResponse.json({
      success: true,
      message: 'Store deleted successfully',
    });
  } catch (error) {
    console.error('Store DELETE error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete store';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
