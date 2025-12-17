/**
 * Customers API Client
 *
 * Client-side API functions for managing customers
 */

import { tokenStorage } from '@/lib/api/mutator/custom-instance';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cartaisy-backend-production.up.railway.app/api/v1';

export interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  createdAt: string;
  updatedAt: string;
  acceptsMarketing: boolean;
  tags?: string[];
  defaultAddress?: CustomerAddress;
  deviceCount?: number;
  platforms?: string[];
}

export interface CustomerAddress {
  id: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  provinceCode?: string;
  country?: string;
  countryCode?: string;
  zip?: string;
  phone?: string;
  isDefault: boolean;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  totalPrice: number;
  subtotalPrice: number;
  totalTax: number;
  currency: string;
  financialStatus: string;
  fulfillmentStatus: string;
  itemCount: number;
  createdAt: string;
  processedAt?: string;
}

export interface CustomerActivity {
  id: string;
  type: 'product_view' | 'search' | 'add_to_cart' | 'checkout' | 'order' | 'notification';
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CustomerDetail extends Customer {
  addresses: CustomerAddress[];
  orders: CustomerOrder[];
  recentActivity: CustomerActivity[];
  metrics: {
    averageOrderValue: number;
    daysSinceLastOrder?: number;
    lifetimeValue: number;
  };
}

export interface CustomersListResponse {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomersFilters {
  page?: number;
  limit?: number;
  search?: string;
  filter?: 'all' | 'has_orders' | 'no_orders' | 'high_value';
  sortBy?: 'name' | 'email' | 'orders' | 'spent' | 'lastOrder' | 'joined';
  sortOrder?: 'asc' | 'desc';
}

export const customersApi = {
  /**
   * Get paginated list of customers with filters
   */
  async getCustomers(filters: CustomersFilters = {}): Promise<CustomersListResponse> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.filter && filters.filter !== 'all') params.append('filter', filters.filter);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await fetch(
      `${API_URL}/stores/${user.storeId}/customers?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch customers');
    }

    const data = await response.json();
    return data.data || { customers: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  },

  /**
   * Get detailed customer information
   */
  async getCustomer(customerId: string): Promise<CustomerDetail> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/stores/${user.storeId}/customers/${customerId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch customer details');
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Get customer orders
   */
  async getCustomerOrders(
    customerId: string,
    page = 1,
    limit = 10
  ): Promise<{ orders: CustomerOrder[]; total: number }> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await fetch(
      `${API_URL}/stores/${user.storeId}/customers/${customerId}/orders?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch customer orders');
    }

    const data = await response.json();
    return data.data || { orders: [], total: 0 };
  },

  /**
   * Get customer activity
   */
  async getCustomerActivity(
    customerId: string,
    limit = 20
  ): Promise<{ activities: CustomerActivity[]; total: number }> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/stores/${user.storeId}/customers/${customerId}/activity?limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch customer activity');
    }

    const data = await response.json();
    return data.data || { activities: [], total: 0 };
  },

  /**
   * Get customer statistics summary
   */
  async getCustomerStats(): Promise<{
    totalCustomers: number;
    customersWithOrders: number;
    customersWithoutOrders: number;
    highValueCustomers: number;
    newCustomersThisMonth: number;
  }> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${API_URL}/stores/${user.storeId}/customers/stats`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch customer stats');
    }

    const data = await response.json();
    return data.data || {
      totalCustomers: 0,
      customersWithOrders: 0,
      customersWithoutOrders: 0,
      highValueCustomers: 0,
      newCustomersThisMonth: 0,
    };
  },
};
