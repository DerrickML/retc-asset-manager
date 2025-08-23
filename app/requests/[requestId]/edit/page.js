"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { MainLayout } from "../../../../components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Label } from "../../../../components/ui/label"
import { Textarea } from "../../../../components/ui/textarea"
import { Checkbox } from "../../../../components/ui/checkbox"
import { Badge } from "../../../../components/ui/badge"
import { Alert, AlertDescription } from "../../../../components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select"
import { CalendarDays, Package, AlertTriangle, Save, X } from "lucide-react"
import {
  assetRequestsService,
  assetsService,
  staffService,
} from "../../../../lib/appwrite/provider.js"
import { getCurrentStaff } from "../../../../lib/utils/auth.js"
import { ENUMS } from "../../../../lib/appwrite/config.js"
import { validateRequestDates } from "../../../../lib/utils/validation.js"
import { formatCategory } from "../../../../lib/utils/mappings.js"
import { Query } from "appwrite"

export default function EditRequestPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [currentStaff, setCurrentStaff] = useState(null)
  const [request, setRequest] = useState(null)
  const [availableAssets, setAvailableAssets] = useState([])
  const [selectedAssets, setSelectedAssets] = useState([])

  // Form data
  const [formData, setFormData] = useState({
    purpose: "",
    issueDate: "",
    expectedReturnDate: "",
  })

  // Search and filter
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  useEffect(() => {
    loadData()
  }, [params.requestId])

  const loadData = async () => {
    try {
      const [requestData, staff] = await Promise.all([
        assetRequestsService.get(params.requestId),
        getCurrentStaff(),
      ])

      // Check if user can edit this request
      if (requestData.requesterStaffId !== staff.$id) {
        setError("You can only edit your own requests")
        return
      }

      if (requestData.status !== ENUMS.REQUEST_STATUS.PENDING) {
        setError("Only pending requests can be edited")
        return
      }

      setRequest(requestData)
      setCurrentStaff(staff)

      // Set form data
      setFormData({
        purpose: requestData.purpose,
        issueDate: requestData.issueDate.split('T')[0], // Format for date input
        expectedReturnDate: requestData.expectedReturnDate.split('T')[0],
      })

      // Load current assets and set them as selected
      const currentAssets = await Promise.all(
        requestData.requestedItems.map(async (itemId) => {
          try {
            return await assetsService.get(itemId)
          } catch {
            return null
          }
        })
      )
      
      const validAssets = currentAssets.filter(asset => asset !== null)
      setSelectedAssets(validAssets)

      // Load available assets
      await loadAvailableAssets()
    } catch (err) {
      setError("Failed to load request data")
      console.error("Error loading request:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableAssets = async () => {
    try {
      const queries = [
        Query.equal("availableStatus", ENUMS.AVAILABLE_STATUS.AVAILABLE),
        Query.equal("isPublic", true),
        Query.orderAsc("name"),
      ]

      if (categoryFilter !== "all") {
        queries.push(Query.equal("category", categoryFilter))
      }

      if (searchTerm) {
        queries.push(Query.search("name", searchTerm))
      }

      const result = await assetsService.getPublicAssets(queries)
      setAvailableAssets(result.documents)
    } catch (error) {
      console.error("Failed to load assets:", error)
    }
  }

  useEffect(() => {
    if (currentStaff && !loading) {
      loadAvailableAssets()
    }
  }, [searchTerm, categoryFilter, currentStaff, loading])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleAssetToggle = (asset) => {
    setSelectedAssets(prev => {
      const isSelected = prev.some(selected => selected.$id === asset.$id)
      if (isSelected) {
        return prev.filter(selected => selected.$id !== asset.$id)
      } else {
        return [...prev, asset]
      }
    })
    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      // Validation
      if (!formData.purpose.trim()) {
        throw new Error("Purpose is required")
      }

      if (selectedAssets.length === 0) {
        throw new Error("Please select at least one asset")
      }

      const dateValidation = validateRequestDates(formData.issueDate, formData.expectedReturnDate)
      if (!dateValidation.isValid) {
        throw new Error(dateValidation.error)
      }

      // Update request data
      const updateData = {
        purpose: formData.purpose.trim(),
        issueDate: new Date(formData.issueDate).toISOString(),
        expectedReturnDate: new Date(formData.expectedReturnDate).toISOString(),
        requestedItems: selectedAssets.map(asset => asset.$id),
      }

      await assetRequestsService.update(request.$id, updateData)
      router.push(`/requests/${request.$id}`)
    } catch (err) {
      setError(err.message || "Failed to update request")
    } finally {
      setSaving(false)
    }
  }

  const filteredAssets = availableAssets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </MainLayout>
    )
  }

  if (error && !request) {
    return (
      <MainLayout>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/requests">Back to Requests</Link>
          </Button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button asChild variant="ghost" size="sm">
                <Link href={`/requests/${request.$id}`}>← Back to Request</Link>
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Request #{request.$id.slice(-8)}
            </h1>
            <p className="text-gray-600">Make changes to your pending request</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Request Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="purpose">Purpose *</Label>
                <Textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => handleInputChange("purpose", e.target.value)}
                  placeholder="Describe why you need these assets..."
                  rows={3}
                  className="mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="issueDate">Issue Date *</Label>
                  <Input
                    type="date"
                    id="issueDate"
                    value={formData.issueDate}
                    onChange={(e) => handleInputChange("issueDate", e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expectedReturnDate">Expected Return Date *</Label>
                  <Input
                    type="date"
                    id="expectedReturnDate"
                    value={formData.expectedReturnDate}
                    onChange={(e) => handleInputChange("expectedReturnDate", e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Asset Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Select Assets ({selectedAssets.length} selected)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected Assets */}
              {selectedAssets.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Selected Assets:</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedAssets.map((asset) => (
                      <Badge key={asset.$id} variant="secondary" className="px-3 py-1">
                        {asset.name}
                        <button
                          type="button"
                          onClick={() => handleAssetToggle(asset)}
                          className="ml-2 text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    type="search"
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
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
                </div>
              </div>

              {/* Available Assets */}
              <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-2">
                {filteredAssets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No assets found</p>
                    {searchTerm && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchTerm("")}
                        className="mt-2"
                      >
                        Clear search
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredAssets.map((asset) => {
                    const isSelected = selectedAssets.some(selected => selected.$id === asset.$id)
                    return (
                      <div
                        key={asset.$id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                        }`}
                        onClick={() => handleAssetToggle(asset)}
                      >
                        <Checkbox checked={isSelected} readOnly />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 truncate">{asset.name}</h4>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {formatCategory(asset.category)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {asset.locationName}
                            {asset.roomOrArea && ` - ${asset.roomOrArea}`}
                          </p>
                          {asset.publicSummary && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {asset.publicSummary}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button asChild variant="outline" disabled={saving}>
              <Link href={`/requests/${request.$id}`}>Cancel</Link>
            </Button>
            
            <Button type="submit" disabled={saving || selectedAssets.length === 0}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Updating..." : "Update Request"}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}