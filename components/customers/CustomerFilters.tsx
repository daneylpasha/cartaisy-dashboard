'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type CustomerFilterType = 'all' | 'has_orders' | 'no_orders' | 'high_value';

interface CustomerFiltersProps {
  search: string;
  filter: CustomerFilterType;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: CustomerFilterType) => void;
  onClear: () => void;
}

const filterOptions: { value: CustomerFilterType; label: string }[] = [
  { value: 'all', label: 'All Customers' },
  { value: 'has_orders', label: 'Has Orders' },
  { value: 'no_orders', label: 'No Orders' },
  { value: 'high_value', label: 'High Value (>$100)' },
];

export function CustomerFilters({
  search,
  filter,
  onSearchChange,
  onFilterChange,
  onClear,
}: CustomerFiltersProps) {
  const [searchInput, setSearchInput] = useState(search);
  const hasActiveFilters = search || filter !== 'all';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchInput);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearchChange(searchInput);
    }
  };

  const handleClear = () => {
    setSearchInput('');
    onClear();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="pl-10 h-11 bg-white"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              onSearchChange('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Filter Dropdown */}
      <div className="flex items-center gap-3">
        <Select value={filter} onValueChange={(value) => onFilterChange(value as CustomerFilterType)}>
          <SelectTrigger className="w-[180px] h-11 bg-white">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <SelectValue placeholder="Filter" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-slate-500 hover:text-slate-700"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
