import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface SortableTableHeadProps {
  children: React.ReactNode;
  sortKey: string;
  currentSortBy?: string;
  currentSortOrder?: 'asc' | 'desc';
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  className?: string;
}

export function SortableTableHead({
  children,
  sortKey,
  currentSortBy,
  currentSortOrder,
  onSort,
  className
}: SortableTableHeadProps) {
  const isActive = currentSortBy === sortKey;
  
  const handleSort = () => {
    if (!isActive) {
      onSort(sortKey, 'asc');
    } else {
      onSort(sortKey, currentSortOrder === 'asc' ? 'desc' : 'asc');
    }
  };

  const getSortIcon = () => {
    if (!isActive) {
      return <ChevronsUpDown className="h-4 w-4" />;
    }
    return currentSortOrder === 'asc' 
      ? <ChevronUp className="h-4 w-4" />
      : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <TableHead className={cn("p-0", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSort}
        className={cn(
          "h-auto w-full justify-start p-2 text-left font-medium",
          isActive && "text-primary"
        )}
      >
        {children}
        {getSortIcon()}
      </Button>
    </TableHead>
  );
}