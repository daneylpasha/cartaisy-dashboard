'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { ShopifyCollection } from '@/types';

interface CollectionSelectorProps {
  value?: string;
  onChange: (collectionId: string) => void;
  label?: string;
  disabled?: boolean;
}

export function CollectionSelector({
  value,
  onChange,
  label = 'Shopify Collection',
  disabled = false,
}: CollectionSelectorProps) {
  const { data: session } = useSession();
  const [collections, setCollections] = useState<ShopifyCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setIsLoading(true);
        setError('');

        const response = await fetch('/api/shopify/collections');
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message =
            typeof data.error === 'string'
              ? data.error
              : "We couldn't load your collections. Try again.";
          setError(message);
          setCollections([]);
          return;
        }

        setCollections(data.data?.collections || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "We couldn't load your collections. Try again."
        );
        setCollections([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchCollections();
    }
  }, [session?.user?.id]);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-700">{error}</p>
        </div>
      )}

      {isLoading && !error ? (
        <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
          <p className="text-sm text-slate-600">Loading collections...</p>
        </div>
      ) : collections.length === 0 && !error ? (
        <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600">No collections available</p>
        </div>
      ) : (
        <Select value={value} onValueChange={onChange} disabled={disabled || isLoading || error !== ''}>
          <SelectTrigger>
            <SelectValue placeholder="Select a collection" />
          </SelectTrigger>
          <SelectContent>
            {collections.map((collection) => (
              <SelectItem key={collection.id} value={collection.id}>
                {collection.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <p className="text-xs text-slate-500">
        Select which Shopify collection this carousel links to
      </p>
    </div>
  );
}
