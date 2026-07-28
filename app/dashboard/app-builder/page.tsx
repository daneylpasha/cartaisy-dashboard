'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Image as ImageIcon,
  Zap,
  LayoutGrid,
  Smartphone,
  GripVertical,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Layers,
  Monitor,
  Tag,
  Grid3X3,
  Megaphone,
  CircleDot,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  MeasuringStrategy,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
// Type-only import. `models/HomeLayout` instantiates a Mongoose model at module
// scope, so this must never become a value import from a client component —
// `import type` is erased at compile time and keeps mongoose out of the bundle.
// `IHomeLayoutSection` is the shape this page's data actually has: /api/home-layout
// returns it via lib/services/homeLayout.
import type { IHomeLayoutSection } from '@/models/HomeLayout';

interface ComponentStats {
  carouselCount: number;
  promoBannerCount: number;
  calloutBannerCount: number;
  categoryGridCount: number;
  collectionDisplayCount: number;
  collectionShowcaseCount: number;
  categoryCollectionGridCount: number;
}

// Keyed by the same closed union as `IHomeLayoutSection['type']`, so adding a
// section type to models/HomeLayout.ts without adding its config here is a
// compile error rather than a silent `undefined` lookup at runtime.
const componentConfig: Record<IHomeLayoutSection['type'], {
  title: string;
  description: string;
  icon: any;
  path: string;
  statsKey: keyof ComponentStats;
  color: string;
  bgColor: string;
}> = {
  carousel: {
    title: 'Hero Carousel',
    description: 'Full-width banners with promotions and CTAs',
    icon: ImageIcon,
    path: '/dashboard/app-builder/carousel',
    statsKey: 'carouselCount',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  promo_banners: {
    title: 'Promo Banners',
    description: 'Eye-catching promotional displays',
    icon: Tag,
    path: '/dashboard/app-builder/promo-banners',
    statsKey: 'promoBannerCount',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  callout_banners: {
    title: 'Callout Banners',
    description: 'Attention-grabbing call-to-action sections',
    icon: Megaphone,
    path: '/dashboard/app-builder/callout-banners',
    statsKey: 'calloutBannerCount',
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
  },
  category_grid: {
    title: 'Category Grid',
    description: 'Visual category navigation tiles',
    icon: Grid3X3,
    path: '/dashboard/app-builder/category-grid',
    statsKey: 'categoryGridCount',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  collection_displays: {
    title: 'Collection Displays',
    description: 'Showcase Shopify product collections',
    icon: LayoutGrid,
    path: '/dashboard/app-builder/collection-displays',
    statsKey: 'collectionDisplayCount',
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
  },
  collection_showcases: {
    title: 'Collection Showcases',
    description: 'Featured collection highlights',
    icon: CircleDot,
    path: '/dashboard/app-builder/collection-showcases',
    statsKey: 'collectionShowcaseCount',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
  },
  category_collection_grid: {
    title: 'Category Collection Grid',
    description: 'Combined category and collection layout',
    icon: Layers,
    path: '/dashboard/app-builder/category-collection-grids',
    statsKey: 'categoryCollectionGridCount',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
  },
};

interface SortableItemProps {
  section: IHomeLayoutSection;
  stats: ComponentStats | null;
  onToggleVisibility: (type: string) => void;
  isDragOverlay?: boolean;
  index: number;
}

function SortableItem({ section, stats, onToggleVisibility, isDragOverlay = false, index }: SortableItemProps) {
  // `useSortable` must run on every render. Guarding before it would make this
  // component call one hook on some renders and none on others, breaking React's
  // hook-order guarantee. The hook depends only on `section`, never on `config`,
  // so it is safe to call first and guard afterwards.
  //
  // The `config` lookup below is now exhaustively typed, so TypeScript believes
  // it always resolves. The guard stays anyway: types are not enforced against
  // what is actually stored in MongoDB, and a document written before a value
  // was added to — or after one was removed from — the enum can still carry a
  // type this file does not map.
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.type,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragOverlay ? 1000 : undefined,
  };

  const config = componentConfig[section.type];

  // An unmapped type is only reachable through legacy data or a direct database
  // edit, since `componentConfig` is keyed by the same closed union the model
  // enforces. It still has to render something: the section stays in
  // `SortableContext` and in the saved payload either way, so returning null
  // would leave the merchant holding a position in their layout that they can
  // neither see nor reorder. This row is deliberately draggable for that reason.
  if (!config) {
    return (
      <div
        ref={!isDragOverlay ? setNodeRef : undefined}
        style={!isDragOverlay ? style : undefined}
        className={`group relative rounded-xl border border-dashed transition-all duration-200 ${
          isDragOverlay
            ? 'shadow-2xl border-amber-400 ring-2 ring-amber-200 bg-white'
            : 'bg-amber-50/40 border-amber-300'
        }`}
      >
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold bg-amber-500 text-white">
          {index + 1}
        </div>

        <div className="p-3 pl-5">
          <div className="flex items-center gap-3">
            <button
              {...(!isDragOverlay ? attributes : {})}
              {...(!isDragOverlay ? listeners : {})}
              className={`p-1.5 rounded-md text-amber-500 hover:text-amber-700 hover:bg-amber-100 transition-colors ${
                isDragOverlay ? 'cursor-grabbing' : 'cursor-grab active:cursor-grabbing'
              }`}
              aria-label="Reorder unsupported section"
            >
              <GripVertical className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-900">Unsupported module</h3>
              <p className="text-xs text-slate-500 truncate">
                This dashboard has no editor for <code className="font-mono">{section.type}</code>. It still occupies
                position {index + 1} in the saved layout. Reorder it here, or contact support to have it removed.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const Icon = config.icon;
  const count = stats ? stats[config.statsKey] : 0;

  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      style={!isDragOverlay ? style : undefined}
      className={`group relative rounded-xl border transition-all duration-200 ${
        isDragOverlay
          ? 'shadow-2xl border-blue-400 ring-2 ring-blue-200 bg-white'
          : section.isVisible
            ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
            : 'bg-slate-50/50 border-slate-100 opacity-70'
      }`}
    >
      {/* Position indicator */}
      <div className={`absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${
        section.isVisible ? 'bg-slate-900 text-white' : 'bg-slate-300 text-slate-600'
      }`}>
        {index + 1}
      </div>

      <div className="p-3 pl-5">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <button
            {...(!isDragOverlay ? attributes : {})}
            {...(!isDragOverlay ? listeners : {})}
            className={`p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ${
              isDragOverlay ? 'cursor-grabbing' : 'cursor-grab active:cursor-grabbing'
            }`}
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {/* Icon */}
          <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-slate-900">{config.title}</h3>
              {section.isVisible ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  <Eye className="w-2.5 h-2.5" />
                  Visible
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                  <EyeOff className="w-2.5 h-2.5" />
                  Hidden
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{config.description}</p>
          </div>

          {/* Count Badge */}
          <div className="flex flex-col items-center px-3">
            <span className="text-lg font-semibold text-slate-900">{count}</span>
            <span className="text-xs text-slate-500">{count === 1 ? 'item' : 'items'}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {/* Visibility Toggle */}
            <button
              onClick={() => onToggleVisibility(section.type)}
              className={`p-2 rounded-md transition-all ${
                section.isVisible
                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
              }`}
              title={section.isVisible ? 'Hide from app' : 'Show in app'}
            >
              {section.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            {/* Manage Link */}
            <Link
              href={config.path}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-xs font-medium"
            >
              Manage
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppBuilderPage() {
  const [stats, setStats] = useState<ComponentStats | null>(null);
  const [sections, setSections] = useState<IHomeLayoutSection[]>([]);
  const [originalSections, setOriginalSections] = useState<IHomeLayoutSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  // Calculate totals
  const totalComponents = useMemo(() => {
    if (!stats) return 0;
    return Object.values(stats).reduce((sum, count) => sum + count, 0);
  }, [stats]);

  const visibleSections = useMemo(() => {
    return sections.filter(s => s.isVisible).length;
  }, [sections]);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    if (sections.length !== originalSections.length) return true;
    return sections.some((section, index) => {
      const original = originalSections[index];
      return section.type !== original?.type ||
             section.isVisible !== original?.isVisible ||
             section.position !== original?.position;
    });
  }, [sections, originalSections]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, layoutRes] = await Promise.all([
          fetch('/api/store/stats'),
          fetch('/api/home-layout'),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        }

        if (layoutRes.ok) {
          const layoutData = await layoutRes.json();
          const loadedSections = layoutData.data.sections;
          setSections(loadedSections);
          setOriginalSections(loadedSections);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const saveLayout = useCallback(async () => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);
    try {
      const response = await fetch('/api/home-layout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections }),
      });

      if (!response.ok) {
        throw new Error('Failed to save layout');
      }

      setOriginalSections(sections);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save layout');
    } finally {
      setIsSaving(false);
    }
  }, [sections]);

  const handleDiscardChanges = useCallback(() => {
    setSections(originalSections);
  }, [originalSections]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.type === active.id);
        const newIndex = items.findIndex((item) => item.type === over.id);
        return arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          position: index,
        }));
      });
    }
  }, []);

  const handleToggleVisibility = useCallback((type: string) => {
    setSections((items) =>
      items.map((item) =>
        item.type === type ? { ...item, isVisible: !item.isVisible } : item
      )
    );
  }, []);

  const activeSection = useMemo(() => {
    if (!activeId) return null;
    return sections.find((s) => s.type === activeId) || null;
  }, [activeId, sections]);

  const activeIndex = useMemo(() => {
    if (!activeId) return -1;
    return sections.findIndex((s) => s.type === activeId);
  }, [activeId, sections]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading App Builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-1.5 text-blue-400 text-xs font-medium mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>App Builder</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
                Design Your App Experience
              </h1>
              <p className="text-slate-400 text-sm max-w-xl">
                Drag and drop to reorder components. Toggle visibility to control what your customers see.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-5">
              <div className="text-center">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-1.5">
                  <Layers className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-xl font-semibold text-white">{totalComponents}</p>
                <p className="text-xs font-medium text-slate-400">Total Items</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-1.5">
                  <Eye className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-xl font-semibold text-white">{visibleSections}</p>
                <p className="text-xs font-medium text-slate-400">Visible</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-1.5">
                  <EyeOff className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-xl font-semibold text-white">{sections.length - visibleSections}</p>
                <p className="text-xs font-medium text-slate-400">Hidden</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/app-builder/preview"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            <Monitor className="w-3.5 h-3.5" />
            Preview App
          </Link>
          <span className="text-xs text-slate-500">
            See how your app looks on mobile
          </span>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved successfully
            </div>
          )}
          {hasChanges && (
            <>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved changes
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDiscardChanges}
                disabled={isSaving}
                className="gap-1.5 h-8 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Discard
              </Button>
              <Button
                size="sm"
                onClick={saveLayout}
                disabled={isSaving}
                className="gap-1.5 h-8 text-xs bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-900">Error</p>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">Component Layout</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Drag to reorder how sections appear on your mobile app homescreen
          </p>
        </div>
      </div>

      {/* Sortable Component List */}
      {sections.length > 0 && (
        <div className="space-y-4 pl-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
            measuring={{
              droppable: {
                strategy: MeasuringStrategy.Always,
              },
            }}
          >
            <SortableContext
              items={sections.map((s) => s.type)}
              strategy={verticalListSortingStrategy}
            >
              {sections.map((section, index) => (
                <SortableItem
                  key={section.type}
                  section={section}
                  stats={stats}
                  onToggleVisibility={handleToggleVisibility}
                  index={index}
                />
              ))}
            </SortableContext>

            <DragOverlay dropAnimation={{
              duration: 200,
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}>
              {activeSection && (
                <SortableItem
                  section={activeSection}
                  stats={stats}
                  onToggleVisibility={() => {}}
                  isDragOverlay
                  index={activeIndex}
                />
              )}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* Help Card */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Pro Tips</h3>
            <ul className="text-xs text-slate-500 space-y-0.5">
              <li>• <span className="font-medium text-slate-700">Drag</span> the grip handle to reorder sections</li>
              <li>• <span className="font-medium text-slate-700">Toggle visibility</span> with the eye icon to show/hide sections</li>
              <li>• <span className="font-medium text-slate-700">Click "Manage"</span> to add or edit items within each section</li>
              <li>• <span className="font-medium text-slate-700">Preview</span> your changes before saving to see how they look on mobile</li>
            </ul>
          </div>
          <Link
            href="/dashboard/app-builder/preview"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Preview on Mobile
          </Link>
        </div>
      </div>
    </div>
  );
}
