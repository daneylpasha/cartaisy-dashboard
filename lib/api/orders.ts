/**
 * Orders API Client
 *
 * Client-side API functions for managing orders
 */

import { tokenStorage } from '@/lib/api/mutator/custom-instance';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cartaisy-backend-production.up.railway.app/api/v1';
const ADMIN_API_URL = `${API_URL}/admin`;

// Order Status Types
export type OrderStatus = 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled' | 'restocked' | 'cancelled';
export type PaymentMethod = 'apple_pay' | 'google_pay' | 'card' | 'link' | 'cash' | 'cod' | 'other';
export type PaymentGateway = 'stripe' | 'shopify' | 'paypal' | 'cash' | 'other';

export interface OrderLineItem {
  id: string;
  productId: string;
  productTitle: string;
  variantId?: string;
  variantTitle?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  imageUrl?: string;
}

export interface OrderAddress {
  firstName?: string;
  lastName?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  provinceCode?: string;
  country: string;
  countryCode?: string;
  zip: string;
  phone?: string;
}

export interface OrderCustomer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface OrderTimelineEvent {
  id: string;
  type: 'created' | 'paid' | 'fulfilled' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'note';
  message: string;
  createdAt: string;
  createdBy?: string;
}

export interface OrderNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  paymentMethod?: PaymentMethod;
  paymentGateway?: PaymentGateway;
  customer: OrderCustomer;
  lineItems: OrderLineItem[];
  itemCount: number;
  subtotal: number;
  shippingTotal: number;
  shippingMethod?: string;
  taxTotal: number;
  discountTotal: number;
  total: number;
  currency: string;
  shippingAddress?: OrderAddress;
  billingAddress?: OrderAddress;
  trackingNumber?: string;
  trackingUrl?: string;
  trackingCompany?: string;
  notes: OrderNote[];
  timeline: OrderTimelineEvent[];
  transactionId?: string;
  cardBrand?: string;
  cardLast4?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  fulfilledAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  paymentMethod?: PaymentMethod;
  customer: {
    name: string;
    email: string;
  };
  itemCount: number;
  total: number;
  currency: string;
  createdAt: string;
}

export interface OrdersListResponse {
  orders: OrderListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrdersStats {
  totalOrders: number;
  todayOrders: number;
  unfulfilledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  currency: string;
}

export interface OrdersFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus | 'all';
  paymentStatus?: PaymentStatus | 'all';
  fulfillmentStatus?: FulfillmentStatus | 'all';
  sortBy?: 'date' | 'total' | 'orderNumber';
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface FulfillOrderData {
  trackingNumber?: string;
  trackingCompany?: string;
  trackingUrl?: string;
  notifyCustomer?: boolean;
}

export interface CancelOrderData {
  reason: string;
  refund?: boolean;
  notifyCustomer?: boolean;
}

export const ordersApi = {
  /**
   * Get paginated list of orders with filters
   */
  async getOrders(filters: OrdersFilters = {}): Promise<OrdersListResponse> {
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
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.paymentStatus && filters.paymentStatus !== 'all') params.append('paymentStatus', filters.paymentStatus);
    if (filters.fulfillmentStatus && filters.fulfillmentStatus !== 'all') params.append('fulfillmentStatus', filters.fulfillmentStatus);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(
      `${ADMIN_API_URL}/orders?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Store-ID': user.storeId,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    const data = await response.json();
    const rawOrders = data.data?.orders || [];
    const pagination = data.data?.pagination || { page: 1, limit: 20, total: 0, pages: 0 };

    // Map backend response to frontend format
    const orders: OrderListItem[] = rawOrders.map((o: Record<string, unknown>) => {
      const customer = o.customer as { _id?: string; name?: string; email?: string } || {};
      const mobileStatus = o.mobileStatus as { current?: string } || {};
      const lineItems = o.lineItems as { quantity: number }[] || [];
      const itemCount = lineItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

      return {
        id: (o._id as string) || (o.id as string),
        orderNumber: o.orderNumber as string,
        status: (mobileStatus.current as OrderStatus) || (o.status as OrderStatus) || 'placed',
        paymentStatus: (o.paymentStatus as PaymentStatus) || 'pending',
        fulfillmentStatus: (o.fulfillmentStatus as FulfillmentStatus) || 'unfulfilled',
        paymentMethod: (o.paymentMethodType as PaymentMethod) || (o.paymentMethod as PaymentMethod) || undefined,
        customer: {
          name: customer.name || 'Unknown',
          email: (o.email as string) || customer.email || '',
        },
        itemCount: (o.itemCount as number) || itemCount,
        total: (o.totalPrice as number) || (o.total as number) || 0,
        currency: (o.currency as string) || 'USD',
        createdAt: o.createdAt as string,
      };
    });

    // Client-side sorting fallback (in case backend doesn't sort)
    const sortBy = filters.sortBy || 'date';
    const sortOrder = filters.sortOrder || 'desc';
    orders.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        // Sort by date only (ignore time)
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        dateA.setHours(0, 0, 0, 0);
        dateB.setHours(0, 0, 0, 0);
        comparison = dateA.getTime() - dateB.getTime();
      } else if (sortBy === 'total') {
        comparison = a.total - b.total;
      } else if (sortBy === 'orderNumber') {
        comparison = a.orderNumber.localeCompare(b.orderNumber);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return {
      orders,
      pagination: {
        page: pagination.page || filters.page || 1,
        limit: pagination.limit || filters.limit || 20,
        total: pagination.total || rawOrders.length,
        totalPages: pagination.pages || pagination.totalPages || Math.ceil((pagination.total || rawOrders.length) / (filters.limit || 20)),
      },
    };
  },

  /**
   * Get order statistics (calculated from orders list)
   */
  async getOrderStats(): Promise<OrdersStats> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    const defaultStats: OrdersStats = {
      totalOrders: 0,
      todayOrders: 0,
      unfulfilledOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      currency: 'USD',
    };

    if (!token || !user?.storeId) {
      return defaultStats;
    }

    try {
      // Fetch all orders to calculate stats
      const response = await fetch(
        `${ADMIN_API_URL}/orders?limit=1000`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Store-ID': user.storeId,
          },
        }
      );

      if (!response.ok) {
        return defaultStats;
      }

      const data = await response.json();
      const orders = data.data?.orders || [];

      if (orders.length === 0) {
        return defaultStats;
      }

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let totalRevenue = 0;
      let todayOrders = 0;
      let unfulfilledOrders = 0;
      let currency = 'USD';

      orders.forEach((order: Record<string, unknown>) => {
        const total = (order.totalPrice as number) || 0;
        totalRevenue += total;
        currency = (order.currency as string) || currency;

        const createdAt = new Date(order.createdAt as string);
        if (createdAt >= today) {
          todayOrders++;
        }

        const fulfillmentStatus = order.fulfillmentStatus as string;
        if (fulfillmentStatus === 'unfulfilled' || !fulfillmentStatus) {
          unfulfilledOrders++;
        }
      });

      return {
        totalOrders: orders.length,
        todayOrders,
        unfulfilledOrders,
        totalRevenue,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        currency,
      };
    } catch {
      return defaultStats;
    }
  },

  /**
   * Get single order details
   */
  async getOrder(orderId: string): Promise<Order> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${ADMIN_API_URL}/orders/${orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Store-ID': user.storeId,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch order details');
    }

    const data = await response.json();

    // Handle different response formats:
    // { data: { order: {...} } } or { data: {...} } or { order: {...} }
    const orderData = data.data?.order || data.data || data.order || data;

    return mapOrderResponse(orderData);
  },

  /**
   * Update order status (fulfill, cancel, etc.)
   */
  async updateOrderStatus(
    orderId: string,
    action: 'fulfill' | 'cancel' | 'ship' | 'deliver',
    data?: FulfillOrderData | CancelOrderData
  ): Promise<Order> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${ADMIN_API_URL}/orders/${orderId}/status`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Store-ID': user.storeId,
        },
        body: JSON.stringify({ action, ...data }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update order status');
    }

    const result = await response.json();
    return mapOrderResponse(result.data);
  },

  /**
   * Add note to order
   */
  async addOrderNote(orderId: string, content: string): Promise<OrderNote> {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!user?.storeId) {
      throw new Error('Store ID not found');
    }

    const response = await fetch(
      `${ADMIN_API_URL}/orders/${orderId}/notes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Store-ID': user.storeId,
        },
        body: JSON.stringify({ content }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to add note');
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Export orders to CSV (generates CSV from fetched orders)
   */
  async exportOrders(filters: OrdersFilters = {}): Promise<Blob> {
    const token = tokenStorage.getToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    // Fetch all orders with filters
    const response = await this.getOrders({ ...filters, limit: 10000 });
    const orders = response.orders;

    // Generate CSV
    const headers = ['Order #', 'Customer', 'Email', 'Items', 'Total', 'Currency', 'Payment Status', 'Fulfillment Status', 'Date'];
    const rows = orders.map(order => [
      order.orderNumber,
      order.customer.name,
      order.customer.email,
      order.itemCount.toString(),
      order.total.toFixed(2),
      order.currency,
      order.paymentStatus,
      order.fulfillmentStatus,
      new Date(order.createdAt).toISOString().split('T')[0],
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  },
};

// Helper function to safely extract a numeric value
function safeNumber(value: unknown): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  return 0;
}

// Helper function to get first valid number from multiple sources
function getNumber(...values: unknown[]): number {
  for (const value of values) {
    const num = safeNumber(value);
    if (num !== 0) return num;
  }
  return 0;
}

// Helper function to map backend order response to frontend format
function mapOrderResponse(data: Record<string, unknown>): Order {
  const lineItems = (data.lineItems as Record<string, unknown>[] || data.items as Record<string, unknown>[] || []).map(
    (item: Record<string, unknown>) => {
      const quantity = safeNumber(item.quantity) || 1;
      const unitPrice = getNumber(item.unitPrice, item.price);
      return {
        id: (item.id as string) || (item._id as string) || '',
        productId: (item.shopifyProductId as string) || (item.productId as string) || '',
        productTitle: (item.productTitle as string) || (item.title as string) || (item.name as string) || '',
        variantId: (item.shopifyVariantId as string) || (item.variantId as string) || undefined,
        variantTitle: item.variantTitle as string | undefined,
        sku: item.sku as string | undefined,
        quantity,
        unitPrice,
        totalPrice: safeNumber(item.totalPrice) || (quantity * unitPrice),
        currency: (item.currency as string) || 'USD',
        imageUrl: (item.imageUrl as string) || (item.image as string) || undefined,
      };
    }
  );

  const customer = data.customer as Record<string, unknown> || {};
  const mobileStatus = data.mobileStatus as { current?: string; history?: Array<{ status: string; timestamp: string }> } || {};
  const shipping = data.shipping as { method?: string; cost?: number } || {};
  const pricing = data.pricing as { subtotal?: number; shippingCost?: number; tax?: number; discountAmount?: number; grandTotal?: number } || {};

  // Parse customer name if it's a single field
  const customerName = (customer.name as string) || '';
  const nameParts = customerName.split(' ');
  const firstName = customer.firstName as string || nameParts[0] || '';
  const lastName = customer.lastName as string || nameParts.slice(1).join(' ') || '';

  // Build timeline from mobileStatus history if no timeline exists
  const timeline: OrderTimelineEvent[] = (data.timeline as OrderTimelineEvent[]) || [];
  if (timeline.length === 0 && mobileStatus.history) {
    mobileStatus.history.forEach((entry, index) => {
      timeline.push({
        id: `status-${index}`,
        type: entry.status === 'placed' ? 'created' : entry.status as OrderTimelineEvent['type'],
        message: `Order ${entry.status}`,
        createdAt: entry.timestamp,
      });
    });
  }

  return {
    id: (data._id as string) || (data.id as string),
    orderNumber: data.orderNumber as string,
    status: (mobileStatus.current as OrderStatus) || (data.status as OrderStatus) || 'placed',
    paymentStatus: (data.paymentStatus as PaymentStatus) || (data.financialStatus as PaymentStatus) || ((data.payment as Record<string, unknown>)?.status as PaymentStatus) || 'pending',
    fulfillmentStatus: (data.fulfillmentStatus as FulfillmentStatus) || 'unfulfilled',
    paymentMethod: (data.paymentMethodType as PaymentMethod) || (data.paymentMethod as PaymentMethod) || undefined,
    paymentGateway: data.paymentGateway as PaymentGateway || data.paymentMethod as PaymentGateway || undefined,
    customer: {
      id: (customer._id as string) || (customer.id as string) || '',
      email: (data.email as string) || (customer.email as string) || '',
      firstName,
      lastName,
      phone: customer.phone as string | undefined,
    },
    lineItems,
    itemCount: safeNumber(data.itemCount) || lineItems.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: getNumber(data.subtotal, data.subtotalPrice, pricing.subtotal),
    shippingTotal: getNumber(data.shippingTotal, data.shippingCost, shipping.cost, pricing.shippingCost),
    shippingMethod: (data.shippingMethod as string) || (shipping.method as string) || undefined,
    taxTotal: getNumber(data.taxTotal, data.totalTax, pricing.tax),
    discountTotal: getNumber(data.discountTotal, data.discount, pricing.discountAmount),
    total: getNumber(data.total, data.totalPrice, pricing.grandTotal),
    currency: (data.currency as string) || 'USD',
    shippingAddress: data.shippingAddress as OrderAddress | undefined,
    billingAddress: data.billingAddress as OrderAddress | undefined,
    trackingNumber: data.trackingNumber as string | undefined,
    trackingUrl: data.trackingUrl as string | undefined,
    trackingCompany: data.trackingCompany as string | undefined,
    notes: (data.notes as OrderNote[]) || [],
    timeline,
    transactionId: data.transactionId as string | undefined,
    cardBrand: data.cardBrand as string | undefined,
    cardLast4: data.cardLast4 as string | undefined,
    createdAt: data.createdAt as string,
    updatedAt: (data.updatedAt as string) || (data.createdAt as string),
    paidAt: data.paidAt as string | undefined,
    fulfilledAt: data.fulfilledAt as string | undefined,
    cancelledAt: data.cancelledAt as string | undefined,
    cancellationReason: data.cancellationReason as string | undefined,
  };
}
