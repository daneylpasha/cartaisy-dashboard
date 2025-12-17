'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CustomerTable,
  CustomerFilters,
  CustomerStatsCards,
  CustomerFilterType,
} from '@/components/customers';
import { customersApi, Customer, CustomersFilters } from '@/lib/api/customers';

const ITEMS_PER_PAGE = 20;

export default function CustomersPage() {
  const router = useRouter();

  // Data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<{
    totalCustomers: number;
    customersWithOrders: number;
    customersWithoutOrders: number;
    highValueCustomers: number;
    newCustomersThisMonth: number;
  } | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });

  // Filter state
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CustomerFilterType>('all');
  const [sortBy, setSortBy] = useState<string>('joined');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const filters: CustomersFilters = {
        page: pagination.page,
        limit: ITEMS_PER_PAGE,
        search: search || undefined,
        filter: filter !== 'all' ? filter : undefined,
        sortBy: sortBy as CustomersFilters['sortBy'],
        sortOrder,
      };

      const data = await customersApi.getCustomers(filters);
      setCustomers(data.customers);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, search, filter, sortBy, sortOrder]);

  const fetchStats = useCallback(async () => {
    try {
      setIsStatsLoading(true);
      const data = await customersApi.getCustomerStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRowClick = (customerId: string) => {
    router.push(`/dashboard/customers/${customerId}`);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (value: CustomerFilterType) => {
    setFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setSearch('');
    setFilter('all');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePrevPage = () => {
    setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }));
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Last Order', 'Joined'];
    const rows = customers.map((c) => {
      const name = c.firstName || c.lastName
        ? `${c.firstName || ''} ${c.lastName || ''}`.trim()
        : c.email.split('@')[0];
      return [
        name,
        c.email,
        c.phone || '',
        c.totalOrders,
        c.totalSpent,
        c.lastOrderDate || '',
        c.createdAt,
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-2">
                <Users className="w-4 h-4" />
                <span>Customer Management</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Customers</h1>
              <p className="text-slate-400 text-lg max-w-xl">
                View and manage your customer base. Track orders, spending, and engagement.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-2">
                  <Users className="w-7 h-7 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white">{stats?.totalCustomers ?? 0}</p>
                <p className="text-sm text-slate-400">Total Customers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <CustomerStatsCards stats={stats} isLoading={isStatsLoading} />

      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200">
        <CustomerFilters
          search={search}
          filter={filter}
          onSearchChange={handleSearchChange}
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
        />

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCustomers}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {customers.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {/* Customer Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <CustomerTable
          customers={customers}
          onRowClick={handleRowClick}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          isLoading={isLoading}
        />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Showing{' '}
              <span className="font-medium">
                {(pagination.page - 1) * ITEMS_PER_PAGE + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(pagination.page * ITEMS_PER_PAGE, pagination.total)}
              </span>{' '}
              of <span className="font-medium">{pagination.total}</span> customers
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={pagination.page === 1 || isLoading}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-sm font-medium text-slate-700">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={pagination.page === pagination.totalPages || isLoading}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Pro Tips */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-violet-50 p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-1">Customer Insights</h3>
            <p className="text-sm text-slate-600">
              Click on any customer to view their complete profile, order history, and activity.
              Use filters to find specific segments like high-value customers or those who haven&apos;t ordered yet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
