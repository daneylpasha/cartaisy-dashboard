/**
 * Compliance & GDPR API Client
 *
 * Client-side API functions for GDPR compliance features
 */

import { tokenStorage } from '@/lib/api/mutator/custom-instance';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cartaisy-backend-production.up.railway.app/api/v1';

export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface DataExportRequest {
  id: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  type: 'single_customer' | 'all_customers' | 'bulk';
  status: ExportStatus;
  totalCustomers?: number;
  downloadUrl?: string;
  expiresAt?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface DataDeletionRequest {
  id: string;
  customerId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  deletedData: {
    personalInfo: boolean;
    orders: boolean;
    activity: boolean;
    addresses: boolean;
  };
  createdAt: string;
  completedAt?: string;
}

export interface ComplianceSettings {
  dataRetentionDays: number;
  privacyPolicyUrl?: string;
  cookieConsentEnabled: boolean;
  dataCollectionDisclosure: {
    personalInfo: string;
    orderHistory: string;
    activityTracking: string;
    deviceInfo: string;
  };
}

export const complianceApi = {
  /**
   * Request data export for a specific customer
   */
  async requestCustomerDataExport(customerId: string): Promise<DataExportRequest> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/stores/${user.storeId}/compliance/export/customer/${customerId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to request data export');
    }

    const data = await response.json();
    const result = data.data || data;
    // Handle different ID field names from backend
    if (!result.id) {
      result.id = result.exportId || result._id;
    }
    return result;
  },

  /**
   * Request bulk export of all customer data
   */
  async requestBulkDataExport(): Promise<DataExportRequest> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/stores/${user.storeId}/compliance/export/all`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to request bulk data export');
    }

    const data = await response.json();
    const result = data.data || data;
    // Handle different ID field names from backend
    if (!result.id) {
      result.id = result.exportId || result._id;
    }
    return result;
  },

  /**
   * Check status of a data export request
   */
  async getExportStatus(exportId: string): Promise<DataExportRequest> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/stores/${user.storeId}/compliance/export/${exportId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to check export status');
    }

    const data = await response.json();
    const result = data.data || data;
    // Handle different ID field names from backend
    if (!result.id) {
      result.id = result.exportId || result._id;
    }
    return result;
  },

  /**
   * Get list of recent export requests
   */
  async getExportHistory(): Promise<DataExportRequest[]> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/stores/${user.storeId}/compliance/exports`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch export history');
    }

    const data = await response.json();
    const results = data.data || data || [];
    // Handle different ID field names from backend for each item
    return results.map((item: DataExportRequest & { _id?: string; exportId?: string }) => {
      if (!item.id) {
        return { ...item, id: item.exportId || item._id };
      }
      return item;
    });
  },

  /**
   * Request deletion of customer data (GDPR right to erasure)
   */
  async requestCustomerDataDeletion(
    customerId: string,
    customerEmail: string
  ): Promise<DataDeletionRequest> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/stores/${user.storeId}/compliance/delete/customer/${customerId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmEmail: customerEmail }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to request data deletion');
    }

    const data = await response.json();
    return data.data || data;
  },

  /**
   * Get compliance settings for the store
   */
  async getComplianceSettings(): Promise<ComplianceSettings> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/stores/${user.storeId}/compliance/settings`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      // Return defaults if endpoint not available yet
      return {
        dataRetentionDays: 365,
        cookieConsentEnabled: false,
        dataCollectionDisclosure: {
          personalInfo: 'We collect name, email, and phone number to process orders and provide customer support.',
          orderHistory: 'Order history is retained to provide purchase records and enable reordering.',
          activityTracking: 'We track app usage to improve your shopping experience and provide personalized recommendations.',
          deviceInfo: 'Device information helps us optimize the app and send push notifications.',
        },
      };
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Download a completed export file
   */
  async downloadExport(
    exportId: string,
    exportInfo?: {
      customerId?: string;
      customerName?: string;
      isBulk?: boolean;
      totalCustomers?: number;
    }
  ): Promise<void> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/stores/${user.storeId}/compliance/export/${exportId}/download`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download export');
    }

    // Generate filename based on export type
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    let filename: string;

    if (exportInfo?.isBulk) {
      // Bulk export: all-customers-export-4-customers-2025-12-24.json
      const customerCount = exportInfo.totalCustomers || 'all';
      filename = `all-customers-export-${customerCount}-customers-${date}.json`;
    } else if (exportInfo?.customerId) {
      // Single customer export
      filename = `customer-export-${exportInfo.customerId}`;
      if (exportInfo?.customerName) {
        const sanitizedName = exportInfo.customerName
          .replace(/[^a-zA-Z0-9\s-]/g, '')
          .replace(/\s+/g, '_')
          .toLowerCase();
        filename += `-${sanitizedName}`;
      }
      filename += `-${date}.json`;
    } else {
      filename = `data-export-${date}.json`;
    }

    // Get the blob and trigger download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  /**
   * Update compliance settings
   */
  async updateComplianceSettings(
    settings: Partial<ComplianceSettings>
  ): Promise<ComplianceSettings> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/stores/${user.storeId}/compliance/settings`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update compliance settings');
    }

    const data = await response.json();
    return data.data;
  },
};
