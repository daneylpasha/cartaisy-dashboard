'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  // Optional: fires whenever this picker's own live input validity changes,
  // independent of onChange (which only ever fires with an already-valid,
  // normalized value). Needed by callers that gate a Save/submit action on
  // "is this field currently valid" rather than "what was the last valid
  // value committed" — those aren't the same thing while the user is mid-
  // edit on invalid text (see StoreBrandingColors.tsx for a real case).
  // Purely additive; existing callers that don't pass it are unaffected.
  onValidityChange?: (isValid: boolean) => void;
  label?: string;
  presets?: string[];
}

// Validate hex color
function isValidHex(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

// Normalize hex to 6-digit format
function normalizeHex(hex: string): string {
  if (hex.length === 4) {
    return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  return hex;
}

export function ColorPicker({
  value,
  onChange,
  onValidityChange,
  label = 'Color',
  presets = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF'],
}: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value || '#000000');
  const [isValid, setIsValid] = useState(isValidHex(value || '#000000'));
  const inputRef = useRef<HTMLInputElement>(null);

  // Kept in a ref so the prop-sync effect below doesn't need
  // onValidityChange in its dependency array — callers commonly pass an
  // inline arrow function, which would otherwise re-run the effect (and
  // re-report the same validity) on every parent render.
  const onValidityChangeRef = useRef(onValidityChange);
  useEffect(() => {
    onValidityChangeRef.current = onValidityChange;
  });

  useEffect(() => {
    const valid = isValidHex(value || '#000000');
    setInputValue(value || '#000000');
    setIsValid(valid);
    onValidityChangeRef.current?.(valid);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    // Auto-add # if missing
    if (val && !val.startsWith('#')) {
      val = '#' + val;
    }

    setInputValue(val);

    // Validate and update
    if (isValidHex(val)) {
      setIsValid(true);
      onValidityChange?.(true);
      onChange(normalizeHex(val));
    } else {
      // Deliberately does NOT call onChange here — an invalid value should
      // never reach the parent's committed state. onValidityChange is the
      // only signal a parent gets that the visible input no longer matches
      // what it last committed; callers that skip it can't tell the two
      // have diverged (see StoreBrandingColors.tsx).
      setIsValid(false);
      onValidityChange?.(false);
    }
  };

  const handlePresetClick = (color: string) => {
    setInputValue(color);
    setIsValid(true);
    onValidityChange?.(true);
    onChange(normalizeHex(color));
  };

  const handleNativeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setInputValue(color);
    setIsValid(true);
    onValidityChange?.(true);
    onChange(normalizeHex(color));
  };

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium">{label}</Label>}

      <div className="flex gap-2 items-end">
        {/* Native color picker */}
        <div className="flex-shrink-0">
          <input
            type="color"
            value={inputValue}
            onChange={handleNativeColorChange}
            className="w-12 h-10 rounded border border-slate-200 cursor-pointer"
            title="Click to pick color"
          />
        </div>

        {/* Text input */}
        <div className="flex-1">
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="#000000"
            className={`font-mono text-sm ${!isValid ? 'border-red-500' : ''}`}
          />
        </div>
      </div>

      {/* Validation error */}
      {!isValid && inputValue && (
        <div className="flex items-center gap-2 text-red-600 text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>Enter a valid hex color (e.g., #FF0000)</span>
        </div>
      )}

      {/* Presets */}
      {presets.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-slate-600">Presets</p>
          <div className="flex gap-2 flex-wrap">
            {presets.map((color) => (
              <button
                key={color}
                onClick={() => handlePresetClick(color)}
                className="w-8 h-8 rounded border-2 border-slate-200 hover:border-slate-400 transition-colors"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
