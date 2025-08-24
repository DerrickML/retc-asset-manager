/**
 * Virtualized Data Table Component
 * Optimized for rendering large datasets with thousands of rows
 * Uses react-window for efficient virtual scrolling
 */

"use client"

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { FixedSizeList as List } from "react-window"
import InfiniteLoader from "react-window-infinite-loader"
import { Button } from "./button"
import { Input } from "./input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { EmptySearchResults } from "./empty-state"
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  RefreshCw
} from "lucide-react"

// Constants
const ROW_HEIGHT = 60
const HEADER_HEIGHT = 50
const SEARCH_HEIGHT = 70
const PAGINATION_HEIGHT = 60
const OVERSCAN_COUNT = 5

// Memoized table row component
const TableRow = React.memo(({ 
  index, 
  style, 
  data: { items, columns, onRowClick, selectedRows, onRowSelect, selectable }
}) => {
  const item = items[index]
  const isSelected = selectable && selectedRows.has(item.id || item.$id)

  const handleRowClick = useCallback(() => {
    onRowClick?.(item)
  }, [onRowClick, item])

  const handleSelectChange = useCallback((e) => {
    e.stopPropagation()
    onRowSelect?.(item.id || item.$id, e.target.checked)
  }, [onRowSelect, item])

  if (!item) {
    // Loading placeholder
    return (
      <div style={style} className="flex items-center px-4 border-b bg-gray-50 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
      </div>
    )
  }

  return (
    <div
      style={style}
      className={`flex items-center px-4 border-b hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''} ${isSelected ? 'bg-blue-50' : ''}`}
      onClick={handleRowClick}
    >
      {selectable && (
        <div className="w-12 flex justify-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelectChange}
            onClick={(e) => e.stopPropagation()}
            className="rounded border-gray-300"
          />
        </div>
      )}
      {columns.map((column) => (
        <div
          key={column.accessor}
          className="flex-1 text-sm text-gray-900 px-2 truncate"
          style={{ minWidth: column.width || 'auto', maxWidth: column.maxWidth || 'auto' }}
        >
          {column.cell ? column.cell(item) : (item[column.accessor] || "—")}
        </div>
      ))}
    </div>
  )
})

TableRow.displayName = 'TableRow'

// Memoized table header
const TableHeader = React.memo(({ 
  columns, 
  selectable, 
  sortColumn, 
  sortDirection, 
  onSort, 
  onSelectAll, 
  allSelected, 
  someSelected 
}) => {
  return (
    <div 
      className="flex items-center px-4 border-b bg-gray-50 font-medium text-sm text-gray-700"
      style={{ height: HEADER_HEIGHT }}
    >
      {selectable && (
        <div className="w-12 flex justify-center">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(input) => {
              if (input) input.indeterminate = someSelected && !allSelected
            }}
            onChange={(e) => onSelectAll?.(e.target.checked)}
            className="rounded border-gray-300"
          />
        </div>
      )}
      {columns.map((column) => (
        <div
          key={column.accessor}
          className={`flex-1 px-2 flex items-center ${column.sortable && onSort ? 'cursor-pointer hover:text-gray-900' : ''}`}
          style={{ minWidth: column.width || 'auto', maxWidth: column.maxWidth || 'auto' }}
          onClick={() => column.sortable && onSort?.(column.accessor)}
        >
          <span>{column.header}</span>
          {column.sortable && sortColumn === column.accessor && (
            <span className="ml-1">
              {sortDirection === 'asc' ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
            </span>
          )}
          {column.sortable && sortColumn !== column.accessor && (
            <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />
          )}
        </div>
      ))}
    </div>
  )
})

TableHeader.displayName = 'TableHeader'

export function VirtualizedDataTable({
  data = [],
  columns = [],
  loading = false,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  searchable = true,
  filterable = false,
  sortable = true,
  selectable = false,
  infinite = false,
  pageSize = 50,
  height = 600,
  title,
  description,
  actions,
  filters = [],
  onRowClick,
  onSelectionChange,
  onRefresh,
  className = "",
  emptyState,
  ...props
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState("asc")
  const [activeFilters, setActiveFilters] = useState({})
  const [selectedRows, setSelectedRows] = useState(new Set())
  
  const listRef = useRef()
  const loaderRef = useRef()

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    let result = [...data]

    // Apply search
    if (searchQuery && searchable) {
      const query = searchQuery.toLowerCase()
      result = result.filter(row =>
        columns.some(col => {
          const value = col.accessor ? row[col.accessor] : ""
          return value && value.toString().toLowerCase().includes(query)
        })
      )
    }

    // Apply filters
    Object.keys(activeFilters).forEach(filterKey => {
      const filterValue = activeFilters[filterKey]
      if (filterValue && filterValue !== "all") {
        result = result.filter(row => row[filterKey] === filterValue)
      }
    })

    // Apply sorting
    if (sortColumn && sortable) {
      result.sort((a, b) => {
        const aVal = a[sortColumn] || ""
        const bVal = b[sortColumn] || ""
        
        // Handle different data types
        let comparison = 0
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal
        } else if (aVal instanceof Date && bVal instanceof Date) {
          comparison = aVal.getTime() - bVal.getTime()
        } else {
          comparison = aVal.toString().localeCompare(bVal.toString())
        }
        
        return sortDirection === "asc" ? comparison : -comparison
      })
    }

    return result
  }, [data, searchQuery, activeFilters, sortColumn, sortDirection, columns, searchable, sortable])

  // Handle sorting
  const handleSort = useCallback((column) => {
    if (!sortable) return

    if (sortColumn === column) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }

    // Scroll to top when sorting changes
    listRef.current?.scrollToItem(0)
  }, [sortColumn, sortable])

  // Handle filter changes
  const handleFilterChange = useCallback((filterKey, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: value
    }))
  }, [])

  // Handle row selection
  const handleRowSelect = useCallback((rowId, checked) => {
    const newSelection = new Set(selectedRows)
    if (checked) {
      newSelection.add(rowId)
    } else {
      newSelection.delete(rowId)
    }
    setSelectedRows(newSelection)
    onSelectionChange?.(Array.from(newSelection))
  }, [selectedRows, onSelectionChange])

  // Handle select all
  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      const allIds = processedData.map(row => row.id || row.$id).filter(Boolean)
      setSelectedRows(new Set(allIds))
      onSelectionChange?.(allIds)
    } else {
      setSelectedRows(new Set())
      onSelectionChange?.([])
    }
  }, [processedData, onSelectionChange])

  // Selection state
  const allSelected = processedData.length > 0 && selectedRows.size === processedData.length
  const someSelected = selectedRows.size > 0 && !allSelected

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchQuery("")
    setActiveFilters({})
  }, [])

  const hasActiveFilters = searchQuery || Object.values(activeFilters).some(v => v && v !== "all")

  // Infinite loading
  const isItemLoaded = useCallback((index) => {
    return !!processedData[index]
  }, [processedData])

  const loadMoreItems = useCallback(async (startIndex, stopIndex) => {
    if (hasMore && onLoadMore && !loadingMore) {
      return onLoadMore(startIndex, stopIndex)
    }
  }, [hasMore, onLoadMore, loadingMore])

  const itemCount = infinite ? (hasMore ? processedData.length + 1 : processedData.length) : processedData.length

  // Item data for react-window
  const itemData = useMemo(() => ({
    items: processedData,
    columns,
    onRowClick,
    selectedRows,
    onRowSelect: handleRowSelect,
    selectable
  }), [processedData, columns, onRowClick, selectedRows, handleRowSelect, selectable])

  const tableHeight = height - HEADER_HEIGHT - (title ? 80 : 0) - ((searchable || filterable) ? SEARCH_HEIGHT : 0)

  if (loading && processedData.length === 0) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <p className="text-sm text-gray-600">{description}</p>}
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className} {...props}>
      {title && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
            </div>
            <div className="flex items-center space-x-2">
              {onRefresh && (
                <Button variant="outline" onClick={onRefresh} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              )}
              {actions}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        {/* Search and Filters */}
        {(searchable || filterable) && (
          <div className="p-4 border-b bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-4">
              {searchable && (
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 transform -translate-y-1/2" />
                    <Input
                      placeholder={`Search ${processedData.length} items...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              {filterable && filters.length > 0 && (
                <div className="flex gap-2">
                  {filters.map((filter) => (
                    <Select
                      key={filter.key}
                      value={activeFilters[filter.key] || "all"}
                      onValueChange={(value) => handleFilterChange(filter.key, value)}
                    >
                      <SelectTrigger className="w-40">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder={filter.label} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All {filter.label}</SelectItem>
                        {filter.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ))}
                </div>
              )}

              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Selection summary */}
            {selectable && selectedRows.size > 0 && (
              <div className="mt-2">
                <Badge variant="secondary">
                  {selectedRows.size} of {processedData.length} selected
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Table */}
        {processedData.length === 0 ? (
          <div className="p-8">
            {hasActiveFilters ? (
              <EmptySearchResults onClearFilters={clearFilters} />
            ) : (
              emptyState || <EmptySearchResults showAction={false} />
            )}
          </div>
        ) : (
          <div style={{ height: tableHeight }}>
            <TableHeader
              columns={columns}
              selectable={selectable}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              onSelectAll={handleSelectAll}
              allSelected={allSelected}
              someSelected={someSelected}
            />
            
            {infinite ? (
              <InfiniteLoader
                ref={loaderRef}
                isItemLoaded={isItemLoaded}
                itemCount={itemCount}
                loadMoreItems={loadMoreItems}
              >
                {({ onItemsRendered, ref }) => (
                  <List
                    ref={(list) => {
                      ref(list)
                      listRef.current = list
                    }}
                    height={tableHeight - HEADER_HEIGHT}
                    itemCount={itemCount}
                    itemSize={ROW_HEIGHT}
                    itemData={itemData}
                    onItemsRendered={onItemsRendered}
                    overscanCount={OVERSCAN_COUNT}
                  >
                    {TableRow}
                  </List>
                )}
              </InfiniteLoader>
            ) : (
              <List
                ref={listRef}
                height={tableHeight - HEADER_HEIGHT}
                itemCount={processedData.length}
                itemSize={ROW_HEIGHT}
                itemData={itemData}
                overscanCount={OVERSCAN_COUNT}
              >
                {TableRow}
              </List>
            )}
          </div>
        )}

        {/* Loading indicator for infinite loading */}
        {loadingMore && (
          <div className="flex items-center justify-center py-4 border-t">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading more...</span>
          </div>
        )}

        {/* Stats */}
        <div className="px-4 py-3 border-t bg-gray-50 text-sm text-gray-600">
          Showing {processedData.length.toLocaleString()} of {data.length.toLocaleString()} items
          {hasActiveFilters && " (filtered)"}
        </div>
      </CardContent>
    </Card>
  )
}