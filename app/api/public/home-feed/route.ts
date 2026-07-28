import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { HomeLayout, DEFAULT_SECTIONS } from '@/models/HomeLayout';
import { CarouselItem } from '@/models/CarouselItem';
import { PromoBanner } from '@/models/PromoBanner';
import { CalloutBanner } from '@/models/CalloutBanner';
import { CategoryGrid } from '@/models/CategoryGrid';
import { CollectionDisplay } from '@/models/CollectionDisplay';
import { CollectionShowcase } from '@/models/CollectionShowcase';
import { CategoryCollectionGrid } from '@/models/CategoryCollectionGrid';

/**
 * GET /api/public/home-feed?storeId=xxx
 * Public API for mobile app to fetch home screen data in correct order
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Get home layout order
    const layout = await HomeLayout.findOne({ storeId });
    const sections = layout?.sections || DEFAULT_SECTIONS;

    // Sort sections by position
    const sortedSections = [...sections].sort((a, b) => a.position - b.position);

    // Fetch all component data in parallel
    const [
      carousels,
      promoBanners,
      calloutBanners,
      categoryGrids,
      collectionDisplays,
      collectionShowcases,
      categoryCollectionGrids,
    ] = await Promise.all([
      CarouselItem.find({ storeId, isActive: true }).sort({ position: 1 }).lean(),
      PromoBanner.find({ storeId, isActive: true }).sort({ position: 1 }).lean(),
      CalloutBanner.find({ storeId, isActive: true }).sort({ position: 1 }).lean(),
      CategoryGrid.find({ storeId, isActive: true }).sort({ position: 1 }).lean(),
      CollectionDisplay.find({ storeId, isActive: true }).sort({ order: 1 }).lean(),
      CollectionShowcase.find({ storeId, isActive: true }).sort({ position: 1 }).lean(),
      CategoryCollectionGrid.find({ storeId, isActive: true }).sort({ position: 1 }).lean(),
    ]);

    // Debug log
    console.log('=== Collection Displays Debug ===');
    console.log('StoreId:', storeId);
    console.log('Found:', collectionDisplays.length, 'collection displays');
    collectionDisplays.forEach((cd: any) => {
      console.log('  -', cd.title, '| order:', cd.order, '| isActive:', cd.isActive);
    });

    // Map section types to data
    const dataMap: Record<string, any[]> = {
      carousel: carousels.map(formatItem),
      promo_banners: promoBanners.map(formatItem),
      callout_banners: calloutBanners.map(formatItem),
      category_grid: categoryGrids.map(formatItem),
      collection_displays: collectionDisplays.map(formatItem),
      collection_showcases: collectionShowcases.map(formatItem),
      category_collection_grid: categoryCollectionGrids.map(formatItem),
    };

    // Build response in correct order
    const homeFeed = sortedSections
      .filter((section) => section.isVisible)
      .map((section) => ({
        type: section.type,
        position: section.position,
        data: dataMap[section.type] || [],
      }))
      .filter((section) => section.data.length > 0); // Only include sections with data

    return NextResponse.json({
      success: true,
      data: {
        sections: homeFeed,
        layout: sortedSections,
      },
    });
  } catch (error) {
    console.error('Home feed error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch home feed' },
      { status: 500 }
    );
  }
}

function formatItem(item: any) {
  const formatted: any = { ...item };
  if (formatted._id) {
    formatted.id = formatted._id.toString();
    delete formatted._id;
  }
  delete formatted.__v;
  return formatted;
}
