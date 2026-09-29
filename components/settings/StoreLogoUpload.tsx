'use client';

import { useState, useRef } from 'react';
import { useSession, useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { clearLogo, uploadLogo, validateBrandImage } from '@/lib/onboarding/branding';
import { Upload, X, Loader2, CheckCircle2 } from 'lucide-react';

interface StoreLogoUploadProps {
  logoUrl?: string | null;
  storeName?: string;
  loading?: boolean;
  onLogoChange?: (logoUrl: string | null) => void;
}

export function StoreLogoUpload({
  logoUrl = null,
  storeName = 'Store',
  loading = false,
  onLogoChange,
}: StoreLogoUploadProps) {
  const { data: session } = useSession();
  const { getToken } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storeId = session?.user?.storeId;
  const storeInitial = storeName.charAt(0).toUpperCase();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const check = validateBrandImage(file);
    if (!check.ok) {
      setError(check.message ?? 'Please upload a JPG, PNG, or WebP image');
      return;
    }

    if (!storeId) {
      setError('Store not found');
      return;
    }

    const token = getToken();
    if (!token) {
      setError('Sign in again to upload your logo.');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsUploading(true);

    try {
      const result = await uploadLogo(storeId, token, file);
      if (!result.ok || !result.logoUrl) {
        setError(result.error ?? 'Failed to upload logo. Please try again.');
        return;
      }
      onLogoChange?.(result.logoUrl);
      setSuccess('Logo uploaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to upload logo. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!storeId) {
      setError('Store not found');
      return;
    }

    const token = getToken();
    if (!token) {
      setError('Sign in again to remove your logo.');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsUploading(true);

    try {
      const result = await clearLogo(storeId, token);
      if (!result.ok) {
        setError(result.error ?? 'Failed to remove logo');
        return;
      }
      onLogoChange?.(null);
      setSuccess('Logo removed successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to remove logo');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col sm:flex-row sm:items-start gap-5">
        <div className="shrink-0">
          <div className="relative group">
            {logoUrl ? (
              <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-50">
                <img
                  src={logoUrl}
                  alt="Store logo"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-400">{storeInitial}</span>
              </div>
            )}

            {logoUrl && !isUploading && (
              <button
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {isUploading && (
              <div className="absolute inset-0 rounded-xl bg-white/80 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-medium text-slate-900 mb-1">Store Logo</h3>
          <p className="text-xs text-slate-500 mb-3">
            Upload your store logo. This will appear in the sidebar and app header.
            Recommended: Square image, at least 200x200 pixels.
          </p>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              {logoUrl ? 'Change Logo' : 'Upload Logo'}
            </Button>

            {logoUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveLogo}
                disabled={isUploading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Remove
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          {success && (
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <p className="text-xs text-emerald-600">{success}</p>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600 mt-2">{error}</p>
          )}

          <p className="text-xs text-slate-400 mt-2">
            JPG, PNG or WebP. Max 2MB.
          </p>
        </div>
      </div>
    </div>
  );
}
