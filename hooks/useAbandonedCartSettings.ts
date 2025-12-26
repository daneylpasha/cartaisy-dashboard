'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from '@/lib/auth';
import { tokenStorage } from '@/lib/api/mutator/custom-instance';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://cartaisy-backend-production.up.railway.app/api/v1';

export interface AbandonedCartSettings {
  enabled: boolean;
  abandonmentThresholdMinutes: number;
  quietHoursStart: number;
  quietHoursEnd: number;
  maxNotificationsPerCart: number;
  templateId?: string;
  notificationTitle?: string;
  notificationBody?: string;
}

export interface UseAbandonedCartSettingsReturn {
  settings: AbandonedCartSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateSettings: (settings: Partial<AbandonedCartSettings>) => Promise<boolean>;
}

const DEFAULT_SETTINGS: AbandonedCartSettings = {
  enabled: true,
  abandonmentThresholdMinutes: 120,
  quietHoursStart: 22,
  quietHoursEnd: 8,
  maxNotificationsPerCart: 1,
};

export function useAbandonedCartSettings(): UseAbandonedCartSettingsReturn {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<AbandonedCartSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token || !user?.storeId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/admin/stores/${user.storeId}/settings/abandoned-cart`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        // If endpoint returns 404, use default settings
        if (response.status === 404) {
          setSettings(DEFAULT_SETTINGS);
          return;
        }
        throw new Error('Failed to fetch abandoned cart settings');
      }

      const data = await response.json();
      setSettings(data.data || data || DEFAULT_SETTINGS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<AbandonedCartSettings>): Promise<boolean> => {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token || !user?.storeId) {
      setError('Not authenticated');
      return false;
    }

    try {
      setIsSaving(true);
      setError(null);

      console.log('=== API REQUEST DEBUG ===');
      console.log('Sending to API:', newSettings);

      const response = await fetch(
        `${API_URL}/admin/stores/${user.storeId}/settings/abandoned-cart`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newSettings),
        }
      );

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update settings');
      }

      // Merge sent settings with current settings to preserve user's input
      // This prevents toggle reset if API response doesn't include updated values
      setSettings(prev => ({
        ...(prev || DEFAULT_SETTINGS),
        ...newSettings,
      }));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchSettings();
    }
  }, [session?.user?.id, fetchSettings]);

  return {
    settings,
    isLoading,
    isSaving,
    error,
    refetch: fetchSettings,
    updateSettings,
  };
}
