'use client';

import { ColorPicker } from '@/components/ui/color-picker';
import { PLATFORM_DEFAULT_COLOR_LABEL } from '@/lib/onboarding/branding';

interface BrandColorControlProps {
  label: string;
  /** Hex shown in the picker. May be the platform-default swatch. */
  value: string;
  usingDefault: boolean;
  presets?: string[];
  onChange: (value: string) => void;
  onValidityChange?: (isValid: boolean) => void;
  onClear: () => void;
  clearDisabled?: boolean;
}

export function BrandColorControl({
  label,
  value,
  usingDefault,
  presets,
  onChange,
  onValidityChange,
  onClear,
  clearDisabled = false,
}: BrandColorControlProps) {
  const clearLabel = `Clear ${label.toLowerCase()}`;

  return (
    <div className="space-y-2">
      <ColorPicker
        key={usingDefault ? 'platform-default' : 'custom'}
        label={label}
        value={value}
        presets={presets}
        onChange={onChange}
        onValidityChange={onValidityChange}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="min-h-5 text-xs leading-5 text-slate-500">
          {usingDefault ? PLATFORM_DEFAULT_COLOR_LABEL : ''}
        </p>
        <button
          type="button"
          onClick={onClear}
          disabled={clearDisabled || usingDefault}
          aria-label={clearLabel}
          className="rounded-sm text-xs font-medium text-slate-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-default disabled:text-slate-300 disabled:no-underline"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
