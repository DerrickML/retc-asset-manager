"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Checkbox } from "../ui/checkbox"
import { Alert, AlertDescription } from "../ui/alert"
import { Badge } from "../ui/badge"
import { assetsService, assetRequestsService } from "../../lib/appwrite/provider.js"
import { getCurrentStaff } from "../../lib/utils/auth.js"
import { ENUMS } from "../../lib/appwrite/config.js"
import { validateRequestDates } from "../../lib/utils/validation.js"
import { formatCategory } from "../../lib/utils/mappings.js"
import { Query } from "appwrite"

export function RequestForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [staff, setStaff] = useState(null)
  const [availableAssets, setAvailableAssets] = useState([])
  const [selectedAssets, setSelectedAssets] = useState([])

  // Form data
  const [formData, setFormData] = useState({
    purpose: "",
    issueDate: "",
    expectedReturnDate: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [currentStaff, assetsResult] = await Promise.all([
        getCurrentStaff(),
        assetsService.list([Query.equal("availableStatus", ENUMS.AVAILABLE_STATUS.AVAILABLE), Query.orderAsc("name")]),
      ])

      setStaff(currentStaff)
      setAvailableAssets(assetsResult.documents)

      // Set default dates (tomorrow to next week)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 8)

      setFormData({
        purpose: "",
        issueDate: tomorrow.toISOString().split("T")[0],
        expectedReturnDate: nextWeek.toISOString().split("T")[0],
      })
    } catch (error) {
      console.error("Failed to load form data:", error)
      setError("Failed to load form data. Please refresh the page.")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Validate form
      if (selectedAssets.length === 0) {
        throw new Error("Please select at least one asset to request.")
      }

      validateRequestDates(formData.issueDate, formData.expectedReturnDate)

      // Create request
      const requestData = {
        requesterStaffId: staff.$id,
        purpose: formData.purpose,
        issueDate: new Date(formData.issueDate).toISOString(),
        expectedReturnDate: new Date(formData.expectedReturnDate).toISOString(),
        requestedItems: selectedAssets,
        status: ENUMS.REQUEST_STATUS.PENDING,
      }

      await assetRequestsService.create(requestData)

      router.push("/requests")
    } catch (err) {
      setError(err.message || "Failed to submit request")
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleAssetSelection = (assetId) => {
    setSelectedAssets((prev) => (prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]))
  }

  const getAssetsByCategory = () => {
    const grouped = {}
    availableAssets.forEach((asset) => {
      if (!grouped[asset.category]) {
        grouped[asset.category] = []
      }
      grouped[asset.category].push(asset)
    })
    return grouped
  }

  const assetsByCategory = getAssetsByCategory()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Request Details */}
      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose *</Label>
            <Textarea
              id="purpose"
              value={formData.purpose}
              onChange={(e) => updateField("purpose", e.target.value)}
              placeholder="Describe what you need these assets for..."
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date *</Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={(e) => updateField("issueDate", e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedReturnDate">Expected Return Date *</Label>
              <Input
                id="expectedReturnDate"
                type="date"
                value={formData.expectedReturnDate}
                onChange={(e) => updateField("expectedReturnDate", e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Assets</CardTitle>
          <p className="text-sm text-gray-600">Choose the assets you need for your request</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedAssets.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Selected Assets ({selectedAssets.length})</h4>
              <div className="flex flex-wrap gap-2">
                {selectedAssets.map((assetId) => {
                  const asset = availableAssets.find((a) => a.$id === assetId)
                  return (
                    <Badge key={assetId} variant="outline" className="bg-white">
                      {asset?.name || "Unknown Asset"}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          {Object.keys(assetsByCategory).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No available assets found.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(assetsByCategory).map(([category, assets]) => (
                <div key={category}>
                  <h4 className="font-medium text-gray-900 mb-3">{formatCategory(category)}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {assets.map((asset) => (
                      <div
                        key={asset.$id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedAssets.includes(asset.$id)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => toggleAssetSelection(asset.$id)}
                      >
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            checked={selectedAssets.includes(asset.$id)}
                            onChange={() => toggleAssetSelection(asset.$id)}
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-gray-900 truncate">{asset.name}</h5>
                            <p className="text-sm text-gray-600">Tag: {asset.assetTag}</p>
                            <p className="text-sm text-gray-600">Location: {asset.locationName}</p>
                            <Badge className="mt-1 text-xs bg-green-100 text-green-800">Available</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || selectedAssets.length === 0}>
          {loading ? "Submitting..." : "Submit Request"}
        </Button>
      </div>
    </form>
  )
}
