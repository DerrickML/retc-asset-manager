import React, { useState, useMemo } from "react"
import { Button } from "./button"
import { Input } from "./input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { EmptySearchResults, LoadingEmptyState } from "./empty-state"
import { TableSkeleton } from "./loading"
import { ChevronLeft, ChevronRight, Search, Filter, MoreHorizontal } from "lucide-react"

/**
 * DataTable Component
 * Reusable table component with built-in search, filtering, pagination, and sorting
 */
export function DataTable({
  data = [],
  columns = [],
  loading = false,
  searchable = true,
  filterable = false,
  paginated = true,
  sortable = true,
  selectable = false,
  pageSize = 10,
  title,
  description,
  actions,
  filters = [],
  onRowClick,
  onSelectionChange,
  className = "",
  emptyState,
  ...props
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState("asc")
  const [activeFilters, setActiveFilters] = useState({})
  const [selectedRows, setSelectedRows] = useState(new Set())

  // Filter and search data
  const filteredData = useMemo(() => {
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
        
        if (sortDirection === "asc") {
          return aVal.toString().localeCompare(bVal.toString())
        } else {
          return bVal.toString().localeCompare(aVal.toString())
        }
      })
    }

    return result
  }, [data, searchQuery, activeFilters, sortColumn, sortDirection, columns, searchable, sortable])

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize)
  const paginatedData = paginated 
    ? filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredData

  const handleSort = (column) => {
    if (!sortable || !column.sortable) return

    if (sortColumn === column.accessor) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column.accessor)
      setSortDirection("asc")
    }
  }

  const handleFilterChange = (filterKey, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: value
    }))
    setCurrentPage(1) // Reset to first page
  }

  const handleRowSelect = (rowId, checked) => {
    const newSelection = new Set(selectedRows)
    if (checked) {
      newSelection.add(rowId)
    } else {
      newSelection.delete(rowId)
    }
    setSelectedRows(newSelection)
    onSelectionChange?.(Array.from(newSelection))
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = paginatedData.map(row => row.id || row.$id)
      setSelectedRows(new Set(allIds))
      onSelectionChange?.(allIds)
    } else {
      setSelectedRows(new Set())
      onSelectionChange?.([])
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setActiveFilters({})
    setCurrentPage(1)
  }

  const hasActiveFilters = searchQuery || Object.values(activeFilters).some(v => v && v !== "all")

  if (loading) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <p className="text-sm text-gray-600">{description}</p>}
          </CardHeader>
        )}
        <CardContent>
          <TableSkeleton rows={pageSize} columns={columns.length} />
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
            {actions && <div className="flex space-x-2">{actions}</div>}
          </div>
        </CardHeader>
      )}

      <CardContent>
        {/* Search and Filters */}
        {(searchable || filterable) && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {searchable && (
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 transform -translate-y-1/2" />
                  <Input
                    placeholder="Search..."
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
        )}

        {/* Table */}
        {filteredData.length === 0 ? (
          hasActiveFilters ? (
            <EmptySearchResults onClearFilters={clearFilters} />
          ) : (
            emptyState || <EmptySearchResults showAction={false} />
          )
        ) : (
          <>
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    {selectable && (
                      <th className="p-4 w-12">
                        <input
                          type="checkbox"
                          checked={paginatedData.length > 0 && selectedRows.size === paginatedData.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </th>
                    )}
                    {columns.map((column) => (
                      <th
                        key={column.accessor}
                        className={`p-4 text-left text-sm font-medium text-gray-900 ${
                          sortable && column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                        }`}
                        onClick={() => handleSort(column)}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{column.header}</span>
                          {sortable && column.sortable && sortColumn === column.accessor && (
                            <span className="text-xs">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, index) => (
                    <tr
                      key={row.id || row.$id || index}
                      className={`border-b hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                      onClick={() => onRowClick?.(row)}
                    >
                      {selectable && (
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(row.id || row.$id)}
                            onChange={(e) => handleRowSelect(row.id || row.$id, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-gray-300"
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td key={column.accessor} className="p-4 text-sm text-gray-900">
                          {column.cell 
                            ? column.cell(row) 
                            : (row[column.accessor] || "—")
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {paginated && totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * pageSize) + 1} to{" "}
                  {Math.min(currentPage * pageSize, filteredData.length)} of{" "}
                  {filteredData.length} results
                </p>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}