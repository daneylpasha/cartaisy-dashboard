'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Filter, X, RefreshCw, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrdersFilters, OrderStatus, PaymentStatus, FulfillmentStatus } from '@/lib/api/orders';

interface OrderFiltersProps {
  filters: OrdersFilters;
  onFiltersChange: (filters: OrdersFilters) => void;
  onRefresh: () => void;
  onExport: () => void;
  isLoading?: boolean;
}

export function OrderFilters({
  filters,
  onFiltersChange,
  onRefresh,
  onExport,
  isLoading = false,
}: OrderFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousSearchRef = useRef(filters.search || '');

  // Auto-search after 3 letters with debouncing - only if value changed
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchValue.length < 3) {
      // Clear search if less than 3 characters
      if (filters.search) {
        previousSearchRef.current = '';
        onFiltersChange({ ...filters, search: '', page: 1 });
      }
      return;
    }

    // Only trigger API call if search value actually changed
    if (searchValue === previousSearchRef.current) {
      return;
    }

    // Set debounce timer for search after 3+ letters
    debounceTimerRef.current = setTimeout(() => {
      previousSearchRef.current = searchValue;
      onFiltersChange({ ...filters, search: searchValue, page: 1 });
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchValue, filters, onFiltersChange]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleFilterChange = (key: keyof OrdersFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  const handleClearFilters = () => {
    setSearchValue('');
    onFiltersChange({
      page: 1,
      limit: filters.limit,
    });
  };

  const hasActiveFilters =
    filters.search ||
    (filters.status && filters.status !== 'all') ||
    (filters.paymentStatus && filters.paymentStatus !== 'all') ||
    (filters.fulfillmentStatus && filters.fulfillmentStatus !== 'all') ||
    filters.startDate ||
    filters.endDate;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by order #, customer name or email..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </form>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap gap-2">
          {/* Status Filter */}
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger className="w-[130px] h-9 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="placed">Placed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Payment Status Filter */}
          <Select
            value={filters.paymentStatus || 'all'}
            onValueChange={(value) => handleFilterChange('paymentStatus', value)}
          >
            <SelectTrigger className="w-[140px] h-9 text-sm">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>

          {/* Fulfillment Status Filter */}
          <Select
            value={filters.fulfillmentStatus || 'all'}
            onValueChange={(value) => handleFilterChange('fulfillmentStatus', value)}
          >
            <SelectTrigger className="w-[140px] h-9 text-sm">
              <SelectValue placeholder="Fulfillment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fulfillment</SelectItem>
              <SelectItem value="unfulfilled">Unfulfilled</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="fulfilled">Fulfilled</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range - Start */}
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="pl-8 w-[140px] h-9 text-sm"
              placeholder="Start date"
            />
          </div>

          {/* Date Range - End */}
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="pl-8 w-[140px] h-9 text-sm"
              placeholder="End date"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-slate-600 h-8"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Clear filters
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={isLoading}
            className="h-8"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
}
