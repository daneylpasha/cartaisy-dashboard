'use client';

import { useEffect, useState } from 'react';
import { HomescreenPreviewData } from '@/types';
import {
  MobileFrame,
  CarouselPreview,
  CategoryGridPreview,
  CalloutBannersPreview,
  CollectionDisplayPreview,
  CategoryCollectionGridPreview,
  PromoBannerPreview,
  CollectionShowcasePreview,
} from '@/components/app-builder/preview';
import { ComponentOrderSidebar } from '@/components/app-builder/preview/ComponentOrderSidebar';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, RefreshCw, Smartphone } from 'lucide-react';

export default function HomescreenPreviewPage() {
  const [data, setData] = useState<HomescreenPreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPreview = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError('');

      const response = await fetch('/api/preview/homescreen');

      if (!response.ok) {
        throw new Error('Failed to fetch preview data');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, []);

  const handleRefresh = () => {
    fetchPreview(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
          <p className="text-slate-600 mt-4">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{error || 'Failed to load preview data'}</p>
          </div>
        </div>
        <Button onClick={() => fetchPreview()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Smartphone className="w-8 h-8 text-blue-600" />
            Homescreen Preview
          </h1>
          <p className="text-slate-600 mt-1">
            Module order for a published home. Splash, the home header, product, and cart are the shopper phone on Brand and Preview.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Preview Container */}
      <div className="flex gap-8 items-start">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 sticky top-6">
          <ComponentOrderSidebar data={data} />
        </div>

        {/* Mobile Preview */}
        <div className="flex-1 flex justify-center py-4">
          <MobileFrame>
            <div className="space-y-0">
              {/* Carousel - Always at top */}
              <CarouselPreview items={data.carousel} />

              {/* Category Grid */}
              <CategoryGridPreview items={data.categoryGrid} />

              {/* Callout Banners */}
              <CalloutBannersPreview items={data.calloutBanners} />

              {/* Collection Displays */}
              <CollectionDisplayPreview items={data.collectionDisplays} />

              {/* Category Collection Grids */}
              <CategoryCollectionGridPreview items={data.categoryCollectionGrids} />

              {/* Promo Banners */}
              <PromoBannerPreview items={data.promoBanners} />

              {/* Collection Showcases */}
              <CollectionShowcasePreview items={data.collectionShowcases} />

              {/* Empty State */}
              {data.metadata.activeComponents === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Smartphone className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">
                    No Active Components
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add components in the App Builder to see them here
                  </p>
                </div>
              )}

              {/* Bottom Padding */}
              <div className="h-8" />
            </div>
          </MobileFrame>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900">Preview Stats</h3>
            <p className="text-sm text-blue-700 mt-1">
              {data.metadata.activeComponents} active components out of {data.metadata.totalComponents} total
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-blue-600">Last updated</p>
            <p className="text-sm font-medium text-blue-900">
              {new Date(data.metadata.lastUpdated).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
