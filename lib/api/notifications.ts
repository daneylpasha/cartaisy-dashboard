/**
 * Push Notifications API Client
 *
 * Client-side API functions for managing push notifications
 * Calls backend API directly for broadcast, uses Next.js routes for read operations
 */

import { tokenStorage } from '@/lib/api/mutator/custom-instance';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cartaisy-backend-production.up.railway.app/api/v1';

export interface NotificationSegment {
  id: string;
  name: string;
  description: string;
  count: number;
}

export interface NotificationStats {
  totalCustomersWithDevices: number;
  totalActiveDevices: number;
  platformBreakdown: {
    ios: number;
    android: number;
  };
  pushEnabledCustomers: number;
  firebaseEnabled: boolean;
  topic: string;
}

export interface SendNotificationPayload {
  title: string;
  body: string;
  segment?: string;
  imageUrl?: string;
  data?: Record<string, string>;
  scheduledFor?: string;
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  segment: string;
  data?: Record<string, string>;
  status: 'scheduled' | 'cancelled';
  scheduledFor: string;
  createdAt: string;
  sentByEmail?: string;
}

export interface ScheduledNotificationsResponse {
  notifications: ScheduledNotification[];
  total: number;
}

export interface NotificationRecipient {
  id: string;
  name: string;
  email: string;
  deviceCount: number;
  platforms: string[];
}

export interface RecipientsResponse {
  recipients: NotificationRecipient[];
  total: number;
  page: number;
  limit: number;
}

// History types
export type NotificationStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'partial' | 'failed';

export interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  segment: string;
  status: NotificationStatus;
  targetCount: number;
  successCount: number;
  failureCount: number;
  deliveryRate: number;
  sentAt?: string;
  scheduledFor?: string;
  sentByEmail?: string;
  createdAt: string;
}

export interface NotificationHistoryResponse {
  notifications: NotificationHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NotificationDetail extends NotificationHistoryItem {
  data?: Record<string, string>;
  imageUrl?: string;
  failedTokens?: Array<{
    token: string;
    error: string;
    errorCode?: string;
  }>;
}

export interface HistoryFilters {
  page?: number;
  limit?: number;
  status?: string;
  segment?: string;
  startDate?: string;
  endDate?: string;
}

// Template types
export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  image?: string;
  segment: string;
  data?: Record<string, string>;
  usageCount: number;
  lastUsedAt?: string;
  isActive: boolean;
  createdByEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplatePayload {
  name: string;
  title: string;
  body: string;
  image?: string;
  segment?: string;
  data?: Record<string, string>;
}

export interface UpdateTemplatePayload {
  name?: string;
  title?: string;
  body?: string;
  image?: string;
  segment?: string;
  data?: Record<string, string>;
}

// Image types
export interface ImageUsage {
  used: number;
  limit: number;
  remaining: number;
  tier: string;
  totalSize: number;
  images: StoredImage[];
}

export interface StoredImage {
  id: string;
  publicId: string;
  url: string;
  size: number;
  usedIn: string;
  createdAt: string;
}

export interface UploadSignature {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  canUpload: boolean;
  remaining: number;
}

export const notificationApi = {
  /**
   * Get available segments with counts
   */
  async getSegments(): Promise<NotificationSegment[]> {
    const response = await fetch('/api/notifications/segments');
    if (!response.ok) {
      throw new Error('Failed to fetch segments');
    }
    const data = await response.json();
    console.log('[Notifications] Segments response:', data);
    // Handle different response formats
    const rawSegments = data.data?.segments || data.segments || [];
    // Map backend response to expected format (estimatedCount -> count)
    const segments = rawSegments.map((seg: { id: string; name: string; description?: string; count?: number; estimatedCount?: number }) => ({
      id: seg.id,
      name: seg.name,
      description: seg.description || '',
      count: seg.count ?? seg.estimatedCount ?? 0,
    }));
    return segments;
  },

  /**
   * Get notification statistics
   */
  async getStats(): Promise<NotificationStats> {
    const response = await fetch('/api/notifications/stats');
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    const data = await response.json();
    return data.data;
  },

  /**
   * Broadcast notification to segment
   * Calls backend API directly to ensure notifications are actually sent
   */
  async broadcast(payload: SendNotificationPayload): Promise<{ success: boolean; message: string; sentCount: number }> {
    console.log('📤 [API Client] Step 2a: broadcast() called with payload:', payload);

    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string; id?: string; email?: string }>();

    console.log('📤 [API Client] Step 2b: Auth check - Token exists:', !!token);
    console.log('📤 [API Client] Step 2b: Auth check - Token preview:', token ? `${token.substring(0, 30)}...` : 'MISSING');
    console.log('📤 [API Client] Step 2c: User data:', user ? JSON.stringify(user) : 'MISSING');

    if (!token) {
      console.error('❌ [API Client] No auth token found');
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      console.error('❌ [API Client] No store ID found. User:', user);
      throw new Error('Store ID not found. Please log out and log in again.');
    }

    const endpoint = `${API_URL}/notifications/stores/${user.storeId}/broadcast`;
    console.log('📤 [API Client] Step 2d: Endpoint:', endpoint);
    console.log('📤 [API Client] Step 2e: API_URL value:', API_URL);

    const requestBody = JSON.stringify(payload);
    console.log('📤 [API Client] Step 2f: Request body:', requestBody);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: requestBody,
      });

      console.log('📤 [API Client] Step 3a: Response status:', response.status);
      console.log('📤 [API Client] Step 3b: Response ok:', response.ok);
      console.log('📤 [API Client] Step 3c: Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('📤 [API Client] Step 3d: Response data:', JSON.stringify(data));

      if (!response.ok) {
        console.error('❌ [API Client] Broadcast failed - Status:', response.status, 'Data:', data);
        throw new Error(data.message || `Failed to send notification (${response.status})`);
      }

      console.log('✅ [API Client] Broadcast success:', data);
      return {
        success: true,
        message: data.message || 'Notification sent successfully',
        sentCount: data.data?.sentCount || 0,
      };
    } catch (error) {
      console.error('❌ [API Client] Fetch error:', error);
      throw error;
    }
  },

  /**
   * Send test notification to a specific customer
   * Calls backend API directly
   */
  async sendTest(customerId: string, title: string, body: string): Promise<{ success: boolean; message: string }> {
    const token = tokenStorage.getToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/notifications/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ customerId, title, body }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send test notification');
    }

    return {
      success: true,
      message: data.message || 'Test notification sent successfully',
    };
  },

  /**
   * Get customers who can receive notifications
   */
  async getRecipients(page = 1, limit = 50): Promise<RecipientsResponse> {
    const response = await fetch(`/api/notifications/recipients?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch recipients');
    }
    const data = await response.json();
    return data.data;
  },

  /**
   * Get notification history with optional filters
   */
  async getHistory(filters: HistoryFilters = {}): Promise<NotificationHistoryResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.segment) params.append('segment', filters.segment);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`/api/notifications/history?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch notification history');
    }
    const data = await response.json();
    return data.data || data;
  },

  /**
   * Get notification detail by ID
   */
  async getNotificationDetail(notificationId: string): Promise<NotificationDetail> {
    const response = await fetch(`/api/notifications/history/${notificationId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch notification detail');
    }
    const data = await response.json();
    return data.data || data;
  },

  /**
   * Get scheduled notifications for the store
   */
  async getScheduledNotifications(): Promise<ScheduledNotificationsResponse> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(`${API_URL}/notifications/stores/${user.storeId}/scheduled`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch scheduled notifications');
    }

    const data = await response.json();
    return data.data || { notifications: [], total: 0 };
  },

  /**
   * Cancel a scheduled notification
   */
  async cancelScheduledNotification(notificationId: string): Promise<{ success: boolean; message: string }> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/notifications/stores/${user.storeId}/scheduled/${notificationId}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to cancel notification');
    }

    return { success: true, message: 'Notification cancelled' };
  },

  /**
   * Send a scheduled notification immediately
   */
  async sendScheduledNow(notificationId: string): Promise<{ success: boolean; message: string; sentCount: number }> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/notifications/stores/${user.storeId}/scheduled/${notificationId}/send-now`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send notification');
    }

    return {
      success: true,
      message: data.message || 'Notification sent',
      sentCount: data.data?.sentCount || 0,
    };
  },

  /**
   * Update a scheduled notification
   */
  async updateScheduledNotification(
    notificationId: string,
    updates: {
      title?: string;
      body?: string;
      segment?: string;
      imageUrl?: string;
      data?: Record<string, string>;
      scheduledFor?: string;
    }
  ): Promise<{ success: boolean; notification: ScheduledNotification }> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/notifications/stores/${user.storeId}/scheduled/${notificationId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update notification');
    }

    return {
      success: true,
      notification: data.data?.notification || data.notification,
    };
  },

  // Template API functions

  /**
   * Get all templates for the store
   */
  async getTemplates(): Promise<{ templates: NotificationTemplate[]; total: number }> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/notifications/stores/${user.storeId}/templates`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch templates');
    }

    const data = await response.json();
    return data.data || { templates: [], total: 0 };
  },

  /**
   * Get a single template by ID
   */
  async getTemplate(templateId: string): Promise<NotificationTemplate> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/notifications/stores/${user.storeId}/templates/${templateId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch template');
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Create a new template
   */
  async createTemplate(payload: CreateTemplatePayload): Promise<NotificationTemplate> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/notifications/stores/${user.storeId}/templates`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create template');
    }

    return data.data;
  },

  /**
   * Update an existing template
   */
  async updateTemplate(
    templateId: string,
    updates: UpdateTemplatePayload
  ): Promise<NotificationTemplate> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/notifications/stores/${user.storeId}/templates/${templateId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update template');
    }

    return data.data;
  },

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string): Promise<{ success: boolean }> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/notifications/stores/${user.storeId}/templates/${templateId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete template');
    }

    return { success: true };
  },

  /**
   * Record template usage
   */
  async recordTemplateUsage(templateId: string): Promise<{ success: boolean }> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/notifications/stores/${user.storeId}/templates/${templateId}/use`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to record template usage');
    }

    return { success: true };
  },

  /**
   * Duplicate a template
   */
  async duplicateTemplate(templateId: string): Promise<NotificationTemplate> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/notifications/stores/${user.storeId}/templates/${templateId}/duplicate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to duplicate template');
    }

    return data.data;
  },

  // Image API functions

  /**
   * Get image usage statistics for the store
   */
  async getImageUsage(): Promise<ImageUsage> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/notifications/stores/${user.storeId}/images/usage`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch image usage');
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Get upload signature for Cloudinary
   */
  async getUploadSignature(): Promise<UploadSignature> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/notifications/stores/${user.storeId}/images/signature`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get upload signature');
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Register an uploaded image with the backend
   */
  async registerImage(imageData: {
    publicId: string;
    url: string;
    secureUrl: string;
    size: number;
    width?: number;
    height?: number;
    format?: string;
  }): Promise<{ success: boolean; image: StoredImage }> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/notifications/stores/${user.storeId}/images/register`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(imageData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to register image');
    }

    return data.data;
  },

  /**
   * Delete an image
   */
  async deleteImage(imageId: string): Promise<{ success: boolean }> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/notifications/stores/${user.storeId}/images/${imageId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete image');
    }

    return { success: true };
  },

  /**
   * Get all stored images for the store
   */
  async getStoredImages(): Promise<{ images: StoredImage[]; total: number }> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/notifications/stores/${user.storeId}/images`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch stored images');
    }

    const data = await response.json();
    return data.data || { images: [], total: 0 };
  },
};
