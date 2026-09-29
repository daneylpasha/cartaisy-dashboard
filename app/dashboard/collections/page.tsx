'use client';

import { useState } from 'react';
import { useShopifyCollections } from '@/hooks/useShopifyCollections';
import { useShopifyStatus } from '@/hooks/useShopifyStatus';
import { ShopifyCatalogBlockPanel } from '@/components/shopify/ShopifyCatalogBlockPanel';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  AlertCircle,
  FolderOpen,
  Link as LinkIcon,
  ExternalLink,
  Image as ImageIcon,
  Sparkles,
  Search,
  Grid3X3,
  List,
  Package,
  ArrowRight,
  Eye,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type ViewMode = 'grid' | 'list';

export default function CollectionsPage() {
  const { collections, isLoading, error, block, refetch } = useShopifyCollections();
  const { status: shopifyStatus, isLoading: statusLoading } = useShopifyStatus();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCollections = collections.filter(collection =>
    collection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collection.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Loading state
  if (isLoading || statusLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading collections...</p>
        </div>
      </div>
    );
  }

  // Not connected to Shopify
  if (!shopifyStatus?.isConnected) {
    return (
      <div className="space-y-8 pb-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
          <div className="absolute inset-0 bg-grid-white/[0.02]" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium mb-2">
              <FolderOpen className="w-4 h-4" />
              <span>Collections</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">
              Shopify Collections
            </h1>
            <p className="text-slate-400 text-sm">
              Browse and manage your product collections
            </p>
          </div>
        </div>

        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12">
          <div className="flex flex-col items-center text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center mb-6">
              <LinkIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              Connect Your Shopify Store
            </h3>
            <p className="text-xs text-slate-500 mb-8">
              To view and manage your collections, you need to connect your Shopify store first.
              Head to settings to get started.
            </p>
            <Link href="/dashboard/settings">
              <Button className="bg-slate-900 hover:bg-slate-800 gap-2">
                Go to Settings
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (block) {
    return (
      <div className="mx-auto w-full max-w-3xl pb-8">
        <h1 className="font-heading text-[1.75rem] font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
          Collections
        </h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
          From the Shopify store this app sells from.
        </p>
        <div className="mt-8">
          <ShopifyCatalogBlockPanel block={block} shop={shopifyStatus?.shop ?? null} />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-8 pb-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
          <div className="absolute inset-0 bg-grid-white/[0.02]" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium mb-2">
              <FolderOpen className="w-4 h-4" />
              <span>Collections</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">
              Shopify Collections
            </h1>
            <p className="text-slate-400 text-sm">
              Browse and manage your product collections
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-base font-semibold text-red-900 mb-2">
              Failed to Load Collections
            </h3>
            <p className="text-xs text-slate-500 mb-6 max-w-md">{error}</p>
            <Button onClick={refetch} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (collections.length === 0) {
    return (
      <div className="space-y-8 pb-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
          <div className="absolute inset-0 bg-grid-white/[0.02]" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium mb-2">
              <FolderOpen className="w-4 h-4" />
              <span>Collections</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">
              Shopify Collections
            </h1>
            <p className="text-slate-400 text-sm">
              Browse and manage your product collections
            </p>
          </div>
        </div>

        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12">
          <div className="flex flex-col items-center text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center mb-6">
              <FolderOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              No Collections Found
            </h3>
            <p className="text-xs text-slate-500 mb-8">
              Your Shopify store doesn't have any collections yet. Create collections in your
              Shopify admin to see them here.
            </p>
            <a
              href={`https://${shopifyStatus.shop}/admin/collections`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Create in Shopify
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Collections grid
  return (
    <div className="space-y-8 pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium mb-2">
                <FolderOpen className="w-4 h-4" />
                <span>Collections</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">
                Shopify Collections
              </h1>
              <p className="text-slate-400 text-sm max-w-xl">
                Browse and manage your product collections from Shopify.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-2">
                  <FolderOpen className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-xl font-semibold text-white">{collections.length}</p>
                <p className="text-xs font-medium text-slate-400">Collections</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-2">
                  <Package className="w-5 h-5 text-teal-400" />
                </div>
                <p className="text-xl font-semibold text-white">
                  {collections.reduce((acc, c) => acc + (c.productsCount || 0), 0)}
                </p>
                <p className="text-xs font-medium text-slate-400">Products</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-slate-200 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button onClick={refetch} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Results Count */}
      {searchQuery && (
        <p className="text-sm text-slate-500">
          Found {filteredCollections.length} collection{filteredCollections.length !== 1 ? 's' : ''} matching "{searchQuery}"
        </p>
      )}

      {/* Collections Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredCollections.map((collection) => (
            <div
              key={collection.id}
              className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-lg transition-all duration-300"
            >
              <div className="aspect-square relative bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
                {collection.image?.src ? (
                  <Image
                    src={collection.image.src}
                    alt={collection.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    </div>
                  </div>
                )}
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg font-medium text-sm">
                    <Eye className="w-4 h-4" />
                    View
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-slate-900 truncate group-hover:text-emerald-600 transition-colors" title={collection.title}>
                  {collection.title}
                </h3>
                <p className="text-xs text-slate-500 truncate mt-1">
                  {collection.handle}
                </p>
                {collection.productsCount !== undefined && (
                  <p className="text-xs text-slate-400 mt-2">
                    {collection.productsCount} product{collection.productsCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCollections.map((collection) => (
            <div
              key={collection.id}
              className="group flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-md transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden flex-shrink-0 relative">
                {collection.image?.src ? (
                  <Image
                    src={collection.image.src}
                    alt={collection.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-slate-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                  {collection.title}
                </h3>
                <p className="text-xs text-slate-500 truncate">
                  /{collection.handle}
                </p>
              </div>
              {collection.productsCount !== undefined && (
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{collection.productsCount}</p>
                  <p className="text-xs text-slate-500">products</p>
                </div>
              )}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="w-4 h-4" />
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty Search Results */}
      {searchQuery && filteredCollections.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-12 text-center">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-2">No collections found</h3>
          <p className="text-xs text-slate-500">
            Try adjusting your search terms or clear the filter
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setSearchQuery('')}
          >
            Clear Search
          </Button>
        </div>
      )}

      {/* Pro Tips */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Collection Tips</h3>
            <p className="text-xs text-slate-500">
              Collections are synced from your Shopify store. Use them in your App Builder to create
              collection displays and showcases for your mobile app customers.
            </p>
          </div>
          <Link href="/dashboard/app-builder">
            <Button className="bg-slate-900 hover:bg-slate-800 gap-2 whitespace-nowrap">
              Open App Builder
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
