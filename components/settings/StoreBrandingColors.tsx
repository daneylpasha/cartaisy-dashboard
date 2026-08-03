'use client';

import { useEffect, useState } from 'react';
import { useSession, useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cartaisy-backend-production.up.railway.app/api/v1';

// Mirrors the backend's own regex exactly (storeBrandingController.ts) so
// client-side feedback matches what the server will accept, without the
// two ever drifting apart. The backend remains the source of truth — this
// is just an instant local check before the round-trip, not a replacement
// for server-side validation.
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

// The backend's own fallback when a store has never set a primaryColor
// (storeBrandingController.ts, both GET and PATCH responses).
const DEFAULT_PRIMARY_COLOR = '#FF6B6B';

interface StoreBrandingColorsProps {
  currentPrimaryColor?: string | null;
  currentSecondaryColor?: string | null;
  onColorsChange?: (colors: { primaryColor: string; secondaryColor: string | null }) => void;
}

export function StoreBrandingColors({
  currentPrimaryColor,
  currentSecondaryColor,
  onColorsChange,
}: StoreBrandingColorsProps) {
  const { data: session } = useSession();
  const { getToken } = useAuth();

  const [primaryColor, setPrimaryColor] = useState(currentPrimaryColor || DEFAULT_PRIMARY_COLOR);
  const [secondaryColor, setSecondaryColor] = useState(currentSecondaryColor || '');
  const [savedPrimaryColor, setSavedPrimaryColor] = useState(currentPrimaryColor || DEFAULT_PRIMARY_COLOR);
  const [savedSecondaryColor, setSavedSecondaryColor] = useState(currentSecondaryColor || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const storeId = session?.user?.storeId;

  // Fetch current branding on mount — same endpoint StoreLogoUpload already
  // fetches on its own mount, called independently rather than lifted into
  // a shared parent fetch. See the PR description for why: sharing one GET
  // would mean touching StoreLogoUpload's own fetch effect, which felt like
  // more risk to an already-shipped, unrelated component than one extra
  // lightweight admin GET call is worth for this ticket.
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
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          const fetchedPrimary = data.data?.primaryColor || DEFAULT_PRIMARY_COLOR;
          const fetchedSecondary = data.data?.secondaryColor || '';
          setPrimaryColor(fetchedPrimary);
          setSecondaryColor(fetchedSecondary);
          setSavedPrimaryColor(fetchedPrimary);
          setSavedSecondaryColor(fetchedSecondary);
        }
      } catch (err) {
        console.error('Failed to fetch branding colors:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranding();
  }, [storeId]);

  const isPrimaryValid = HEX_COLOR_REGEX.test(primaryColor);
  const isSecondaryValid = secondaryColor === '' || HEX_COLOR_REGEX.test(secondaryColor);
  const hasChanges = primaryColor !== savedPrimaryColor || secondaryColor !== savedSecondaryColor;

  const handleSave = async () => {
    if (!storeId) {
      setError('Store not found');
      return;
    }

    // Instant local check mirroring the backend's regex (see above). The
    // ColorPicker inputs below already refuse to bubble up an invalid
    // value via onChange, so in practice this only guards the empty-string
    // "secondary not set" case and defends against ColorPicker's own
    // behavior changing later — the actual save call below is still what
    // determines correctness, not this check.
    if (!isPrimaryValid) {
      setError('Primary color must be a valid hex color (e.g., #FF6B6B)');
      return;
    }
    if (!isSecondaryValid) {
      setError('Secondary color must be a valid hex color (e.g., #4ECDC4)');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const token = getToken();

      // Only send fields that actually changed, matching the backend's own
      // "updates only the fields provided" partial-update contract.
      const body: Record<string, string> = {};
      if (primaryColor !== savedPrimaryColor) body.primaryColor = primaryColor;
      if (secondaryColor !== savedSecondaryColor && secondaryColor) body.secondaryColor = secondaryColor;

      const response = await fetch(`${API_URL}/admin/stores/${storeId}/branding`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        const updatedPrimary = data.data?.primaryColor || DEFAULT_PRIMARY_COLOR;
        const updatedSecondary = data.data?.secondaryColor || '';
        setPrimaryColor(updatedPrimary);
        setSecondaryColor(updatedSecondary);
        setSavedPrimaryColor(updatedPrimary);
        setSavedSecondaryColor(updatedSecondary);
        onColorsChange?.({
          primaryColor: updatedPrimary,
          secondaryColor: updatedSecondary || null,
        });
        setSuccess('Brand colors updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        // Surface the backend's actual validation message (e.g. "Primary
        // color must be a valid hex color (e.g., #FF6B6B)") rather than a
        // generic one — the backend remains the source of truth even
        // though client-side validation above should already catch most
        // cases before this round-trip happens.
        throw new Error(data.error || 'Failed to update store branding');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update store branding');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 mt-4">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 mt-4">
      <h3 className="text-sm font-medium text-slate-900 mb-1">Brand Colors</h3>
      <p className="text-xs text-slate-500 mb-4">
        Choose the primary and secondary colors used across your storefront and mobile app.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <ColorPicker value={primaryColor} onChange={setPrimaryColor} label="Primary Color" />
        <ColorPicker
          value={secondaryColor || '#FFFFFF'}
          onChange={setSecondaryColor}
          label="Secondary Color (optional)"
        />
      </div>

      {/* Simple live preview — a mock header/button snippet using the
          currently-selected colors, not a full app mockup (out of scope
          per the ticket). Enough for a merchant to sanity-check their
          picks before saving. */}
      <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
        <p className="text-xs text-slate-600 mb-3">Preview</p>
        <div
          className="rounded-lg px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: primaryColor }}
        >
          <span className="text-sm font-semibold text-white">Your Store</span>
          <span
            className="text-xs font-medium px-3 py-1.5 rounded-md"
            style={{
              backgroundColor: secondaryColor || '#FFFFFF',
              color: primaryColor,
            }}
          >
            Shop Now
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 mt-3">
          <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 mt-3">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <p className="text-xs text-emerald-600">{success}</p>
        </div>
      )}

      <div className="flex justify-end mt-4">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || !hasChanges || !isPrimaryValid || !isSecondaryValid}
          className="gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Colors'
          )}
        </Button>
      </div>
    </div>
  );
}
