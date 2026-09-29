'use client';

import { useState } from 'react';
import { useSession } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Copy, Loader2, Pencil, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { APP_NAME_WORDMARK_MESSAGE, isPlatformWordmark } from '@/lib/onboarding/appName';
import { canManageSettings } from '@/lib/utils/permissions';

interface StoreInfoCardProps {
  store: {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
  };
  onStoreUpdated: (store: any) => void;
}

export function StoreInfoCard({ store, onStoreUpdated }: StoreInfoCardProps) {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(store.name);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const canEdit = canManageSettings(session?.user?.role);
  const wordmarkName = isPlatformWordmark(editName);

  const handleSave = async () => {
    if (!editName.trim()) {
      setError('Store name cannot be empty');
      return;
    }
    if (isPlatformWordmark(editName)) {
      setError(APP_NAME_WORDMARK_MESSAGE);
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      const response = await fetch('/api/store', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update store name');
        return;
      }

      setIsEditing(false);
      onStoreUpdated(data.data);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, type: 'slug' | 'id') => {
    navigator.clipboard.writeText(text);
    if (type === 'slug') {
      setCopiedSlug(true);
      setTimeout(() => setCopiedSlug(false), 2000);
    } else {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Store Information</CardTitle>
        <CardDescription>Basic details about your store</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="storeName" className="text-sm font-medium">
                Store Name
              </Label>
              <Input
                id="storeName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isSaving}
                placeholder="Store name"
              />
              {wordmarkName ? (
                <p className="text-xs text-slate-500">{APP_NAME_WORDMARK_MESSAGE}</p>
              ) : null}
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditName(store.name);
                  setError('');
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving || editName === store.name || wordmarkName}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Store Name</label>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-base font-semibold text-slate-900">{store.name}</p>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Store Slug</label>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-slate-900 font-mono bg-slate-50 px-3 py-2 rounded flex-1">
                  {store.slug}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(store.slug, 'slug')}
                  className="h-9 w-9 p-0"
                >
                  {copiedSlug ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-1">URL-safe identifier for your store</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Store ID</label>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-slate-900 font-mono bg-slate-50 px-3 py-2 rounded flex-1 truncate">
                  {store.id}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(store.id, 'id')}
                  className="h-9 w-9 p-0"
                >
                  {copiedId ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-1">For API reference</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Created</label>
              <p className="text-sm text-slate-900 mt-1">{formatDate(new Date(store.createdAt))}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
