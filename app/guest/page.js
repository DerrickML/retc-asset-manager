"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Input } from "../../components/ui/input"
import { settingsService, assetsService } from "../../lib/appwrite/provider.js"
import { formatCategory } from "../../lib/utils/mappings.js"
import { Query } from "appwrite"

export default function GuestHomePage() {
  const [settings, setSettings] = useState(null)
  const [featuredAssets, setFeaturedAssets] = useState([])
  const [stats, setStats] = useState({ total: 0, available: 0, categories: 0 })
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [systemSettings, publicAssets] = await Promise.all([
        settingsService.get(),
        assetsService.getPublicAssets([Query.limit(6), Query.orderDesc("$createdAt")]),
      ])

      setSettings(systemSettings)
      setFeaturedAssets(publicAssets.documents)

      // Calculate stats
      const allPublicAssets = await assetsService.getPublicAssets()
      const categories = new Set(allPublicAssets.documents.map((asset) => asset.category))
      const available = allPublicAssets.documents.filter((asset) => asset.availableStatus === "AVAILABLE").length

      setStats({
        total: allPublicAssets.total,
        available,
        categories: categories.size,
      })
    } catch (error) {
      console.error("Failed to load guest portal data:", error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/guest/assets?search=${encodeURIComponent(searchQuery.trim())}`
    } else {
      window.location.href = "/guest/assets"
    }
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Check if guest portal is enabled
  if (!settings.guestPortal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Guest Portal Unavailable</h1>
            <p className="text-gray-600 mb-6">The public asset catalog is currently disabled.</p>
            <Button asChild>
              <Link href="/login">Staff Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">

      {/* Hero Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Explore Our Equipment Catalog</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Browse our collection of renewable energy training equipment and resources. Sign in to request assets for
            your projects.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Search equipment, tools, or resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" style={{ backgroundColor: settings.branding.brandColor }}>
                Search
              </Button>
            </div>
          </form>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardContent className="text-center py-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">{stats.total}</div>
                <div className="text-gray-600">Total Assets</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-6">
                <div className="text-3xl font-bold text-green-600 mb-2">{stats.available}</div>
                <div className="text-gray-600">Available Now</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">{stats.categories}</div>
                <div className="text-gray-600">Categories</div>
              </CardContent>
            </Card>
          </div>

          <Button asChild size="lg" style={{ backgroundColor: settings.branding.brandColor }}>
            <Link href="/guest/assets">Browse All Equipment</Link>
          </Button>
        </div>
      </section>

      {/* Featured Assets */}
      {featuredAssets.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-12">Recently Added Equipment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredAssets.map((asset) => (
                <Card key={asset.$id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-900 flex-1">{asset.name}</h4>
                      <Badge
                        className={
                          asset.availableStatus === "AVAILABLE"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {asset.availableStatus === "AVAILABLE" ? "Available" : "On Loan"}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{formatCategory(asset.category)}</p>

                    {asset.publicSummary && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{asset.publicSummary}</p>
                    )}

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
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="py-16" style={{ backgroundColor: `${settings.branding.brandColor}10` }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Need to Request Equipment?</h3>
          <p className="text-gray-600 mb-6">
            Sign in to your staff account to request assets, track your requests, and manage your equipment loans.
          </p>
          <Button asChild size="lg" style={{ backgroundColor: settings.branding.brandColor }}>
            <Link href="/login">Sign In to Request</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2025 {settings.branding.orgName}. All rights reserved.</p>
          <p className="text-gray-400 mt-2">Asset Management System</p>
        </div>
      </footer>
    </div>
  )
}