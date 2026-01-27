'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, CheckCircle2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cartaisy-backend-production.up.railway.app/api/v1';

interface StoreLogoUploadProps {
  currentLogo?: string | null;
  storeName?: string;
  onLogoChange?: (logoUrl: string | null) => void;
}

export function StoreLogoUpload({ currentLogo, storeName = 'Store', onLogoChange }: StoreLogoUploadProps) {
  const { data: session } = useSession();
  const { getToken } = useAuth();
  const [logo, setLogo] = useState<string | null>(currentLogo || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storeId = session?.user?.storeId;
  const storeInitial = storeName.charAt(0).toUpperCase();

  // Fetch current branding on mount
  useEffect(() => {
    const fetchBranding = async () => {
      if (!storeId) {
        setIsLoading(false);
        return;
      }

      try {
        const token = getToken();
        const response = await fetch(`${API_URL}/admin/stores/${storeId}/branding`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.data?.logoUrl) {
            setLogo(data.data.logoUrl);
          }
        }
      } catch (err) {
        console.error('Failed to fetch branding:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranding();
  }, [storeId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    if (!storeId) {
      setError('Store not found');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsUploading(true);

    try {
      const token = getToken();
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch(`${API_URL}/admin/stores/${storeId}/branding/logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const logoUrl = data.data?.logoUrl;
        setLogo(logoUrl);
        onLogoChange?.(logoUrl);
        setSuccess('Logo uploaded successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo. Please try again.');
      setLogo(currentLogo || null);
    } finally {
      setIsUploading(false);
      // Reset file input
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

    setError(null);
    setSuccess(null);
    setIsUploading(true);

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/admin/stores/${storeId}/branding/logo`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setLogo(null);
        onLogoChange?.(null);
        setSuccess('Logo removed successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove logo');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove logo');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
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
        {/* Logo Preview */}
        <div className="shrink-0">
          <div className="relative group">
            {logo ? (
              <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-50">
                <img
                  src={logo}
                  alt="Store logo"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-400">{storeInitial}</span>
              </div>
            )}

            {/* Remove button overlay */}
            {logo && !isUploading && (
              <button
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Loading overlay */}
            {isUploading && (
              <div className="absolute inset-0 rounded-xl bg-white/80 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
              </div>
            )}
          </div>
        </div>

        {/* Info and Upload Button */}
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
              {logo ? 'Change Logo' : 'Upload Logo'}
            </Button>

            {logo && (
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

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Success message */}
          {success && (
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <p className="text-xs text-emerald-600">{success}</p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="text-xs text-red-600 mt-2">{error}</p>
          )}

          {/* File requirements */}
          <p className="text-xs text-slate-400 mt-2">
            JPG, PNG or WebP. Max 2MB.
          </p>
        </div>
      </div>
    </div>
  );
}
