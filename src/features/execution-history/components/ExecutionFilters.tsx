/**
 * ExecutionFilters Component
 * 
 * Shadcn form components for execution filtering
 */

import React from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Search, Filter, X } from 'lucide-react';
import type { ExecutionFiltersProps, ExecutionStatus } from '../types';

export function ExecutionFilters({ filters, onFiltersChange, onReset }: ExecutionFiltersProps) {
  const handleStatusChange = (status: string) => {
    onFiltersChange({
      ...filters,
      status: status === 'all' ? undefined : (status as ExecutionStatus),
    });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      search: event.target.value || undefined,
    });
  };

  const handleDateFromChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      date_from: event.target.value || undefined,
    });
  };

  const handleDateToChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      date_to: event.target.value || undefined,
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by template name or query..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date-from">From Date</Label>
            <Input
              id="date-from"
              type="date"
              value={filters.date_from || ''}
              onChange={handleDateFromChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date-to">To Date</Label>
            <Input
              id="date-to"
              type="date"
              value={filters.date_to || ''}
              onChange={handleDateToChange}
            />
          </div>
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              Active filters:
              <div className="flex flex-wrap gap-1 mt-1">
                {filters.status && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs">
                    Status: {filters.status}
                  </span>
                )}
                {filters.search && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-800 text-xs">
                    Search: "{filters.search}"
                  </span>
                )}
                {filters.date_from && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 text-purple-800 text-xs">
                    From: {filters.date_from}
                  </span>
                )}
                {filters.date_to && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 text-purple-800 text-xs">
                    To: {filters.date_to}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ExecutionFilters;
