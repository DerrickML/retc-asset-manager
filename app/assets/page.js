"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MainLayout } from "../../components/layout/main-layout"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { assetsService, departmentsService } from "../../lib/appwrite/provider.js"
import { ENUMS } from "../../lib/appwrite/config.js"
import { getStatusBadgeColor, getConditionBadgeColor, formatCategory } from "../../lib/utils/mappings.js"
import { getCurrentStaff, permissions } from "../../lib/utils/auth.js"
import { Query } from "appwrite"

export default function AssetsPage() {
  const [assets, setAssets] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [staff, setStaff] = useState(null)

  // Filters
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 12

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadAssets()
  }, [search, categoryFilter, statusFilter, departmentFilter, currentPage])

  const loadInitialData = async () => {
    try {
      const [currentStaff, deptResult] = await Promise.all([getCurrentStaff(), departmentsService.list()])
      setStaff(currentStaff)
      setDepartments(deptResult.documents)
    } catch (error) {
      console.error("Failed to load initial data:", error)
    }
  }

  const loadAssets = async () => {
    setLoading(true)
    try {
      const queries = []

      // Add search query
      if (search) {
        queries.push(Query.search("name", search))
      }

      // Add filters
      if (categoryFilter) {
        queries.push(Query.equal("category", categoryFilter))
      }
      if (statusFilter) {
        queries.push(Query.equal("availableStatus", statusFilter))
      }
      if (departmentFilter) {
        queries.push(Query.equal("departmentId", departmentFilter))
      }

      // Add pagination
      queries.push(Query.limit(pageSize))
      queries.push(Query.offset((currentPage - 1) * pageSize))
      queries.push(Query.orderDesc("$createdAt"))

      const result = await assetsService.list(queries)
      setAssets(result.documents)
      setTotalPages(Math.ceil(result.total / pageSize))
    } catch (error) {
      console.error("Failed to load assets:", error)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSearch("")
    setCategoryFilter("")
    setStatusFilter("")
    setDepartmentFilter("")
    setCurrentPage(1)
  }

  const canManageAssets = staff && permissions.canManageAssets(staff)

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
            <p className="text-gray-600">Manage and track your organization's assets</p>
          </div>
          {canManageAssets && (
            <Button asChild>
              <Link href="/assets/new">Add Asset</Link>
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Input placeholder="Search assets..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.values(ENUMS.CATEGORY).map((category) => (
                    <SelectItem key={category} value={category}>
                      {formatCategory(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.values(ENUMS.AVAILABLE_STATUS).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.$id} value={dept.$id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Assets Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : assets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
              <p className="text-gray-600 mb-4">
                {search || categoryFilter || statusFilter || departmentFilter
                  ? "Try adjusting your search criteria or filters."
                  : "Get started by adding your first asset."}
              </p>
              {canManageAssets && (
                <Button asChild>
                  <Link href="/assets/new">Add First Asset</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {assets.map((asset) => (
              <Card key={asset.$id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate flex-1">{asset.name}</h3>
                    {asset.isPublic && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Public
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{formatCategory(asset.category)}</p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={getStatusBadgeColor(asset.availableStatus)}>
                      {asset.availableStatus.replace(/_/g, " ")}
                    </Badge>
                    <Badge className={getConditionBadgeColor(asset.currentCondition)}>
                      {asset.currentCondition.replace(/_/g, " ")}
                    </Badge>
                  </div>

                  <div className="text-xs text-gray-500 mb-3">
                    <p>Tag: {asset.assetTag}</p>
                    <p>Location: {asset.locationName}</p>
                  </div>

                  <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
                    <Link href={`/assets/${asset.$id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
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
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  )
}