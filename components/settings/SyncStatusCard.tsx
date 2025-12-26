'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw, CheckCircle, AlertCircle, Clock, Package, Users, ShoppingCart, Boxes, Play } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { tokenStorage } from '@/lib/api/mutator/custom-instance';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://cartaisy-backend-production.up.railway.app/api/v1';

export function SyncStatusCard() {
  const { syncStatus, isLoading, isRefetching, error, refetch } = useSyncStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  const handleTriggerSync = async () => {
    const token = tokenStorage.getToken();

    if (!token) {
      setSyncError('Not authenticated');
      return;
    }

    try {
      setIsSyncing(true);
      setSyncError(null);
      setSyncSuccess(null);

      const response = await fetch(`${API_URL}/shopify/sync/full`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to trigger sync');
      }

      // Show success message with counts
      const results = data.data?.results || data.results || {};
      setSyncSuccess(
        `Sync completed! Products: ${results.products?.synced || 0}, Customers: ${results.customers?.synced || 0}, Orders: ${results.orders?.synced || 0}`
      );

      // Refresh status after sync
      setTimeout(() => refetch(), 1000);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Failed to trigger sync');
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus?.status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (syncStatus?.status) {
      case 'healthy':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Synced
          </Badge>
        );
      case 'syncing':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            Syncing
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
            <Clock className="w-3 h-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  const getStatusText = () => {
    switch (syncStatus?.status) {
      case 'healthy':
        return 'All systems synced';
      case 'syncing':
        return 'Sync in progress...';
      case 'error':
        return 'Sync issues detected';
      default:
        return 'Unknown status';
    }
  };

  const formatLastSync = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Shopify Sync Status</span>
          </CardTitle>
          <CardDescription>Monitor your store data synchronization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="h-16 bg-slate-200 rounded"></div>
              <div className="h-16 bg-slate-200 rounded"></div>
              <div className="h-16 bg-slate-200 rounded"></div>
              <div className="h-16 bg-slate-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Shopify Sync Status</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
          <CardDescription>Monitor your store data synchronization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900">Failed to load sync status</p>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Shopify Sync Status</span>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="h-8 w-8 p-0"
              title="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>Monitor your store data synchronization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <p className="text-sm font-medium text-slate-900">{getStatusText()}</p>
            <p className="text-xs text-slate-500">
              Last synced: <span className="font-medium">{formatLastSync(syncStatus?.lastSync?.completedAt)}</span>
              {syncStatus?.lastSync?.type && (
                <span className="text-slate-400 ml-1">({syncStatus.lastSync.type})</span>
              )}
            </p>
          </div>
        </div>

        {/* Resource Counts */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {syncStatus?.resources?.products?.count?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-slate-500">Products</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {syncStatus?.resources?.customers?.count?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-slate-500">Customers</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {syncStatus?.resources?.orders?.count?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-slate-500">Orders</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Boxes className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {syncStatus?.resources?.inventory?.count?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-slate-500">Inventory Items</p>
            </div>
          </div>
        </div>

        {/* Sync Success Message */}
        {syncSuccess && (
          <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-700">{syncSuccess}</p>
          </div>
        )}

        {/* Sync Error Message */}
        {syncError && (
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-sm text-red-700">{syncError}</p>
          </div>
        )}

        {/* Sync Now Button */}
        <div className="pt-4 border-t flex items-center justify-between">
          <div>
            {syncStatus?.nextScheduledSync && (
              <p className="text-xs text-slate-500">
                <Clock className="w-3 h-3 inline mr-1" />
                Next automatic sync: {formatLastSync(syncStatus.nextScheduledSync)}
              </p>
            )}
          </div>
          <Button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="gap-2"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Sync Now
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
