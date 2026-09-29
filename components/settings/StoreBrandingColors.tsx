'use client';

import { useState } from 'react';
import { useSession, useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { BrandColorControl } from '@/components/brand/BrandColorControl';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import {
  HEX_COLOR_REGEX,
  brandColorPatch,
  displayPrimaryColor,
  displaySecondaryColor,
  saveBrandColors,
} from '@/lib/onboarding/branding';

interface StoreBrandingColorsProps {
  primaryExplicit?: string | null;
  secondaryExplicit?: string | null;
  loading?: boolean;
  loadError?: string | null;
  onRetry?: () => void;
  onColorsChange?: (colors: { primaryColor: string | null; secondaryColor: string | null }) => void;
}

export function StoreBrandingColors({
  primaryExplicit: primaryFromDraft = null,
  secondaryExplicit: secondaryFromDraft = null,
  loading = false,
  loadError = null,
  onRetry,
  onColorsChange,
}: StoreBrandingColorsProps) {
  const { data: session } = useSession();
  const { getToken } = useAuth();

  // Undefined means "show the shared draft". A string or null is an unsaved edit.
  const [primaryEdit, setPrimaryEdit] = useState<string | null | undefined>(undefined);
  const [secondaryEdit, setSecondaryEdit] = useState<string | null | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // ColorPicker reports validity only through onChange once the text is a
  // hex. While the field shows invalid text, the last committed color stays
  // valid. Save stays off until the visible field is valid too.
  const [isPrimaryPickerValid, setIsPrimaryPickerValid] = useState(true);
  const [isSecondaryPickerValid, setIsSecondaryPickerValid] = useState(true);

  const storeId = session?.user?.storeId;
  const savedPrimary = primaryFromDraft;
  const savedSecondary = secondaryFromDraft;
  const primaryExplicit = primaryEdit === undefined ? savedPrimary : primaryEdit;
  const secondaryExplicit = secondaryEdit === undefined ? savedSecondary : secondaryEdit;

  const primaryDisplay = displayPrimaryColor(primaryExplicit);
  const secondaryDisplay = displaySecondaryColor(secondaryExplicit);
  const isPrimaryValid = primaryExplicit === null || HEX_COLOR_REGEX.test(primaryExplicit);
  const isSecondaryValid = secondaryExplicit === null || HEX_COLOR_REGEX.test(secondaryExplicit);
  const hasChanges = primaryExplicit !== savedPrimary || secondaryExplicit !== savedSecondary;
  const canWrite = !isSaving && !loadError;
  const colorLoadMessage = loadError
    ? 'Failed to load current branding colors. Refresh or retry before saving, so changes are not based on the wrong starting colors.'
    : null;

  const persist = async (
    patch: { primaryColor?: string | null; secondaryColor?: string | null },
    successMessage: string
  ) => {
    if (!storeId) {
      setError('Store not found');
      return;
    }
    if (loadError) {
      setError('Current branding colors could not be confirmed. Retry loading before saving.');
      return;
    }

    const token = getToken();
    if (!token) {
      setError('Sign in again to save your colors.');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const result = await saveBrandColors(storeId, token, patch);
      if (!result.ok || !result.draft) {
        setError(result.error ?? 'We could not save your colors.');
        return;
      }
      const nextPrimary = result.draft.primaryExplicit ?? null;
      const nextSecondary = result.draft.secondaryExplicit ?? null;
      if ('primaryColor' in patch) setPrimaryEdit(undefined);
      if ('secondaryColor' in patch) setSecondaryEdit(undefined);
      onColorsChange?.({
        primaryColor: 'primaryColor' in patch ? nextPrimary : savedPrimary,
        secondaryColor: 'secondaryColor' in patch ? nextSecondary : savedSecondary,
      });
      setSuccess(successMessage);
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('We could not save your colors.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!isPrimaryValid) {
      setError('Primary color must be a valid hex color (e.g., #FF6B6B)');
      return;
    }
    if (!isSecondaryValid) {
      setError('Secondary color must be a valid hex color (e.g., #4ECDC4)');
      return;
    }
    if (!isPrimaryPickerValid || !isSecondaryPickerValid) {
      setError('Fix the highlighted color field before saving.');
      return;
    }

    const patch = brandColorPatch(
      { primary: primaryExplicit, secondary: secondaryExplicit },
      { primary: savedPrimary, secondary: savedSecondary }
    );
    if (Object.keys(patch).length === 0) return;
    await persist(patch, 'Brand colors saved.');
  };

  const handleClear = async (field: 'primary' | 'secondary') => {
    if (field === 'primary' && primaryExplicit === null) return;
    if (field === 'secondary' && secondaryExplicit === null) return;
    const patch = field === 'primary' ? { primaryColor: null } : { secondaryColor: null };
    const message =
      field === 'primary'
        ? 'Primary color is using the platform default.'
        : 'Secondary color is using the platform default.';
    await persist(patch, message);
  };

  if (loading) {
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
        Choose a primary and secondary color. Clear either one to use the platform default.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <BrandColorControl
          value={primaryDisplay}
          onChange={setPrimaryEdit}
          onValidityChange={setIsPrimaryPickerValid}
          label="Primary Color"
          usingDefault={!loadError && primaryExplicit === null}
          onClear={() => void handleClear('primary')}
          clearDisabled={!canWrite}
        />
        <BrandColorControl
          value={secondaryDisplay}
          onChange={setSecondaryEdit}
          onValidityChange={setIsSecondaryPickerValid}
          label="Secondary Color"
          usingDefault={!loadError && secondaryExplicit === null}
          onClear={() => void handleClear('secondary')}
          clearDisabled={!canWrite}
        />
      </div>

      <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
        <p className="text-xs text-slate-600 mb-3">Preview</p>
        <div
          className="rounded-lg px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: primaryDisplay }}
        >
          <span className="text-sm font-semibold text-white">Your Store</span>
          <span
            className="text-xs font-medium px-3 py-1.5 rounded-md"
            style={{
              backgroundColor: secondaryDisplay,
              color: primaryDisplay,
            }}
          >
            Shop Now
          </span>
        </div>
      </div>

      {loadError && (
        <div className="flex items-start justify-between gap-2 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">{colorLoadMessage}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRetry?.()}
            disabled={loading}
            className="flex-shrink-0 h-7 px-2 text-xs"
          >
            Retry
          </Button>
        </div>
      )}

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
          onClick={() => void handleSave()}
          disabled={
            isSaving ||
            !hasChanges ||
            !isPrimaryValid ||
            !isSecondaryValid ||
            !isPrimaryPickerValid ||
            !isSecondaryPickerValid ||
            !!loadError
          }
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
