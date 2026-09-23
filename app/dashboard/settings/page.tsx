'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useSession } from '@/lib/auth';
import { ConnectShopify } from '@/components/shopify/ConnectShopify';
import { StoreInfoCard } from '@/components/settings/StoreInfoCard';
import { PlanUsageCard } from '@/components/settings/PlanUsageCard';
import { StoreSettingsForm } from '@/components/settings/StoreSettingsForm';
import { DeleteStoreDialog } from '@/components/settings/DeleteStoreDialog';
import { SyncStatusCard } from '@/components/settings/SyncStatusCard';
import { StoreLogoUpload } from '@/components/settings/StoreLogoUpload';
import { StoreBrandingColors } from '@/components/settings/StoreBrandingColors';
import { Button } from '@/components/ui/button';
import { useShopifyStatus } from '@/hooks/useShopifyStatus';
import {
  AlertCircle,
  CheckCircle2,
  Settings,
  Trash2,
  RefreshCw,
  Sparkles,
  Store,
  CreditCard,
  Link,
  Shield,
  AlertTriangle,
  ChevronRight,
  FileText,
  ImageIcon,
} from 'lucide-react';
import { canManageSettings } from '@/lib/utils/permissions';
import { useStoreStats } from '@/hooks/useStoreStats';
import { shopifyReturnCopy } from '@/lib/shopify/merchantCopy';

function SettingsContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { stats, isLoading: statsLoading } = useStoreStats();
  const { status: shopifyStatus } = useShopifyStatus();

  const [store, setStore] = useState<any>(null);
  const [isLoadingStore, setIsLoadingStore] = useState(true);
  const [storeError, setStoreError] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const returnCopy = shopifyReturnCopy(
    searchParams?.get('shopify') ?? null,
    searchParams?.get('reason') ?? searchParams?.get('error')
  );

  const canManage = canManageSettings(session?.user?.role);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await fetch('/api/store');
        if (response.ok) {
          const data = await response.json();
          setStore(data.data);
        } else {
          setStoreError('Failed to load store');
        }
      } catch (err) {
        setStoreError('Failed to load store');
      } finally {
        setIsLoadingStore(false);
      }
    };

    if (session?.user?.id) {
      fetchStore();
    }
  }, [session?.user?.id]);

  if (isLoadingStore) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-slate-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-zinc-500/20 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-2">
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">
                Store Settings
              </h1>
              <p className="text-slate-400 text-sm max-w-xl">
                Manage your store configuration, connections, and preferences.
              </p>
            </div>

            {/* Quick Info */}
            {store && (
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-2">
                    <Store className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-base font-semibold text-white truncate max-w-[120px]">{store.name}</p>
                  <p className="text-xs font-medium text-slate-400">Store Name</p>
                </div>
                <div className="w-px bg-white/10" />
                <div className="text-center">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-2">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-base font-semibold text-white capitalize">{store.plan?.type || 'Free'}</p>
                  <p className="text-xs font-medium text-slate-400">Plan</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {returnCopy && (
        <div
          role="status"
          className={`flex items-center gap-3 rounded-xl border p-4 ${
            returnCopy.tone === 'success'
              ? 'border-slate-200 bg-white'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
            {returnCopy.tone === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-slate-700" />
            ) : (
              <AlertCircle className="h-4 w-4 text-slate-700" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{returnCopy.title}</p>
            <p className="text-sm text-slate-600">{returnCopy.body}</p>
          </div>
        </div>
      )}

      {/* Store Error */}
      {storeError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{storeError}</p>
        </div>
      )}

      {/* Store Information Section */}
      {store && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Store className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-semibold tracking-tight text-slate-900">Store Information</h2>
          </div>
          <StoreInfoCard
            store={store}
            onStoreUpdated={(updatedStore) => setStore(updatedStore)}
          />
        </div>
      )}

      {/* Store Branding Section - Only show when Shopify is connected */}
      {shopifyStatus?.isConnected && store && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-semibold tracking-tight text-slate-900">Store Branding</h2>
          </div>
          <StoreLogoUpload
            currentLogo={store?.logo}
            storeName={store?.name || session?.user?.storeName || 'Store'}
            onLogoChange={(logoUrl) => {
              // Functional update (not `{ ...store, ... }` against the
              // render-captured `store`): a logo save and a color save can
              // resolve close together, and spreading a stale closure would
              // let whichever callback runs second silently discard the
              // other's fields. Caught in review on PR #13 for the new
              // onColorsChange callback below; applied here too so both
              // updates in this section compose safely instead of racing.
              setStore((currentStore: typeof store) => ({ ...currentStore, logo: logoUrl }));
            }}
          />
          <StoreBrandingColors
            currentPrimaryColor={store?.primaryColor}
            currentSecondaryColor={store?.secondaryColor}
            onColorsChange={(colors) => {
              setStore((currentStore: typeof store) => ({
                ...currentStore,
                primaryColor: colors.primaryColor,
                secondaryColor: colors.secondaryColor,
              }));
            }}
          />
        </div>
      )}

      {/* Shopify Connection Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Link className="w-4 h-4 text-slate-600" />
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">Shopify Connection</h2>
        </div>
        <ConnectShopify />
      </div>

      {/* Sync Status Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="w-4 h-4 text-slate-600" />
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">Sync Status</h2>
        </div>
        <SyncStatusCard />
      </div>

      {/* Plan & Usage Section */}
      {stats && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-semibold tracking-tight text-slate-900">Plan & Usage</h2>
          </div>
          <PlanUsageCard
            planType={store?.plan?.type}
            teamMemberCount={stats.teamMemberCount}
            pendingInvitationCount={stats.pendingInvitationCount}
          />
        </div>
      )}

      {/* Store Settings Section */}
      {store && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-semibold tracking-tight text-slate-900">App Settings</h2>
          </div>
          <StoreSettingsForm
            store={store}
            onSettingsSaved={() => {
              fetch('/api/store').then((res) => {
                if (res.ok) {
                  res.json().then((data) => setStore(data.data));
                }
              });
            }}
          />
        </div>
      )}

      {/* Compliance & Privacy Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-slate-600" />
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">Privacy & Compliance</h2>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-900">GDPR Compliance Settings</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Manage data retention policies, export customer data, and configure privacy settings
                  to ensure compliance with GDPR and other data protection regulations.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard/settings/compliance'}
              className="gap-2 whitespace-nowrap"
            >
              Manage Compliance
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Pro Tips */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-zinc-50 p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-slate-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Settings Guide</h3>
            <p className="text-xs text-slate-500">
              Configure your store settings to customize your mobile app experience. Connect your
              Shopify store to sync products and collections automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      {canManage && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h2 className="text-sm font-semibold tracking-tight text-red-900">Danger Zone</h2>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-sm font-semibold text-red-900 mb-1">Delete Store</h3>
                <p className="text-xs text-red-700">
                  Permanently delete your store, including all data, team members, and configurations.
                  This action cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="gap-2 whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4" />
                Delete Store
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Store Dialog */}
      {store && (
        <DeleteStoreDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          storeName={store.name}
        />
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading settings...</p>
          </div>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
