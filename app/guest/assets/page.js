"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Card, CardContent } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { settingsService, assetsService } from "../../../lib/appwrite/provider.js"
import { ENUMS } from "../../../lib/appwrite/config.js"
import { formatCategory, mapToPublicStatusLabel } from "../../../lib/utils/mappings.js"
import { Query } from "appwrite"

export default function GuestAssetsPage() {
  const searchParams = useSearchParams()
  const [settings, setSettings] = useState(null)
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "all")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all")
  const [locationFilter, setLocationFilter] = useState(searchParams.get("location") || "all")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 12

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    if (settings) {
      loadAssets()
    }
  }, [settings, search, categoryFilter, statusFilter, locationFilter, currentPage])

  const loadSettings = async () => {
    try {
      const systemSettings = await settingsService.get()
      setSettings(systemSettings)

      // Check if guest portal is enabled
      if (!systemSettings.guestPortal) {
        window.location.href = "/guest"
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
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
      if (categoryFilter !== "all") {
        queries.push(Query.equal("category", categoryFilter))
      }
      if (statusFilter !== "all") {
        queries.push(Query.equal("availableStatus", statusFilter))
      }
      if (locationFilter !== "all") {
        queries.push(Query.equal("publicLocationLabel", locationFilter))
      }

      // Add pagination
      queries.push(Query.limit(pageSize))
      queries.push(Query.offset((currentPage - 1) * pageSize))
      queries.push(Query.orderDesc("$createdAt"))

      const result = await assetsService.getPublicAssets(queries)
      setAssets(result.documents)
      setTotalPages(Math.ceil(result.total / pageSize))
    } catch (error) {
      console.error("Failed to load assets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    loadAssets()
  }

  const clearFilters = () => {
    setSearch("")
    setCategoryFilter("all")
    setStatusFilter("all")
    setLocationFilter("all")
    setCurrentPage(1)
  }

  const getUniqueLocations = () => {
    // This would ideally come from an API endpoint
    return ["Main Lab", "Workshop", "Storage", "Field Station"]
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/guest" className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: settings.branding.brandColor }}
                >
                  RETC
                </div>
                <div>
                  <h1 className="font-bold text-gray-900">{settings.branding.orgName}</h1>
                  <p className="text-sm text-gray-600">Equipment Catalog</p>
                </div>
              </Link>
            </div>
            <Button asChild variant="outline">
              <Link href="/login">Staff Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Equipment Catalog</h1>
          <p className="text-gray-600">Browse our available training equipment and resources</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Search equipment..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" style={{ backgroundColor: settings.branding.brandColor }}>
                  Search
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <SelectValue placeholder="Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="IN_USE">On Loan</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {getUniqueLocations().map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button type="button" variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Assets Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No equipment found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters.</p>
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {assets.map((asset) => (
                <Card key={asset.$id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-gray-900 flex-1 line-clamp-2">{asset.name}</h3>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{formatCategory(asset.category)}</p>

                    {asset.publicSummary && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{asset.publicSummary}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge
                        className={
                          asset.availableStatus === "AVAILABLE"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {mapToPublicStatusLabel(asset.availableStatus)}
                      </Badge>
                      {asset.publicConditionLabel && (
                        <Badge variant="outline">{asset.publicConditionLabel.replace(/_/g, " ")}</Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {asset.publicLocationLabel && <span>{asset.publicLocationLabel}</span>}
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/guest/assets/${asset.$id}`}>View Details</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

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
          </>
        )}

        {/* Call to Action */}
        <Card className="mt-12" style={{ backgroundColor: `${settings.branding.brandColor}10` }}>
          <CardContent className="text-center py-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Need to Request Equipment?</h3>
            <p className="text-gray-600 mb-4">Sign in to your staff account to request assets for your projects.</p>
            <Button asChild style={{ backgroundColor: settings.branding.brandColor }}>
              <Link href="/login">Sign In to Request</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
