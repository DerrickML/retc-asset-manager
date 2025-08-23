"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Checkbox } from "../ui/checkbox"
import { Alert, AlertDescription } from "../ui/alert"
import { assetsService, departmentsService, staffService } from "../../lib/appwrite/provider.js"
import { ENUMS } from "../../lib/appwrite/config.js"
import { getCurrentStaff } from "../../lib/utils/auth.js"
import { validateAssetTag } from "../../lib/utils/validation.js"
import { formatCategory, mapToPublicCondition } from "../../lib/utils/mappings.js"


export function AssetForm({ asset, onSuccess }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [departments, setDepartments] = useState([])
  const [staff, setStaff] = useState([])
  const [currentStaff, setCurrentStaff] = useState(null)

  // Form data
  const [formData, setFormData] = useState({
    // Identity
    assetTag: "",
    serialNumber: "",
    name: "",

    // Classification
    category: "",
    subcategory: "",
    model: "",
    manufacturer: "",

    // Ownership
    departmentId: "",
    custodianStaffId: "",

    // State
    availableStatus: ENUMS.AVAILABLE_STATUS.AWAITING_DEPLOY,
    currentCondition: ENUMS.CURRENT_CONDITION.NEW,

    // Location
    locationName: "",
    roomOrArea: "",

    // Lifecycle dates
    purchaseDate: "",
    warrantyExpiryDate: "",
    lastMaintenanceDate: "",
    nextMaintenanceDue: "",

    // Public visibility
    isPublic: false,
    publicSummary: "",
    publicLocationLabel: "",
    publicConditionLabel: ENUMS.PUBLIC_CONDITION_LABEL.NEW,
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (asset) {
      setFormData({
        assetTag: asset.assetTag || "",
        serialNumber: asset.serialNumber || "",
        name: asset.name || "",
        category: asset.category || "",
        subcategory: asset.subcategory || "",
        model: asset.model || "",
        manufacturer: asset.manufacturer || "",
        departmentId: asset.departmentId || "",
        custodianStaffId: asset.custodianStaffId || "",
        availableStatus: asset.availableStatus || ENUMS.AVAILABLE_STATUS.AWAITING_DEPLOY,
        currentCondition: asset.currentCondition || ENUMS.CURRENT_CONDITION.NEW,
        locationName: asset.locationName || "",
        roomOrArea: asset.roomOrArea || "",
        purchaseDate: asset.purchaseDate ? asset.purchaseDate.split("T")[0] : "",
        warrantyExpiryDate: asset.warrantyExpiryDate ? asset.warrantyExpiryDate.split("T")[0] : "",
        lastMaintenanceDate: asset.lastMaintenanceDate ? asset.lastMaintenanceDate.split("T")[0] : "",
        nextMaintenanceDue: asset.nextMaintenanceDue ? asset.nextMaintenanceDue.split("T")[0] : "",
        isPublic: asset.isPublic || false,
        publicSummary: asset.publicSummary || "",
        publicLocationLabel: asset.publicLocationLabel || "",
        publicConditionLabel: asset.publicConditionLabel || mapToPublicCondition(asset.currentCondition),
      })
    }
  }, [asset])

  const loadInitialData = async () => {
    try {
      const [deptResult, staffResult, currentUser] = await Promise.all([
        departmentsService.list(),
        staffService.list(),
        getCurrentStaff(),
      ])

      setDepartments(deptResult.documents)
      setStaff(staffResult.documents)
      setCurrentStaff(currentUser)
    } catch (error) {
      console.error("Failed to load form data:", error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Validate asset tag
      validateAssetTag(formData.assetTag)

      // Prepare data for submission
      const submitData = {
        ...formData,
        // Convert dates to ISO strings
        purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate).toISOString() : null,
        warrantyExpiryDate: formData.warrantyExpiryDate ? new Date(formData.warrantyExpiryDate).toISOString() : null,
        lastMaintenanceDate: formData.lastMaintenanceDate ? new Date(formData.lastMaintenanceDate).toISOString() : null,
        nextMaintenanceDue: formData.nextMaintenanceDue ? new Date(formData.nextMaintenanceDue).toISOString() : null,

        // Initialize arrays
        attachmentFileIds: asset?.attachmentFileIds || [],
        publicImages: asset?.publicImages || [],
      }

      if (asset) {
        // Update existing asset
        await assetsService.update(asset.$id, submitData, currentStaff.$id, "Asset updated via form")
      } else {
        // Create new asset
        await assetsService.create(submitData, currentStaff.$id)
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/assets")
      }
    } catch (err) {
      setError(err.message || "Failed to save asset")
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assetTag">Asset Tag *</Label>
              <Input
                id="assetTag"
                value={formData.assetTag}
                onChange={(e) => updateField("assetTag", e.target.value)}
                placeholder="RETC-LAP-001"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => updateField("serialNumber", e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Asset Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Classification */}
      <Card>
        <CardHeader>
          <CardTitle>Classification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => updateField("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ENUMS.CATEGORY).map((category) => (
                    <SelectItem key={category} value={category}>
                      {formatCategory(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Input
                id="subcategory"
                value={formData.subcategory}
                onChange={(e) => updateField("subcategory", e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => updateField("manufacturer", e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => updateField("model", e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ownership & Status */}
      <Card>
        <CardHeader>
          <CardTitle>Ownership & Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departmentId">Department *</Label>
              <Select value={formData.departmentId} onValueChange={(value) => updateField("departmentId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.$id} value={dept.$id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custodianStaffId">Custodian</Label>
              <Select
                value={formData.custodianStaffId}
                onValueChange={(value) => updateField("custodianStaffId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select custodian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No custodian assigned</SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member.$id} value={member.$id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="availableStatus">Status</Label>
              <Select value={formData.availableStatus} onValueChange={(value) => updateField("availableStatus", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ENUMS.AVAILABLE_STATUS).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentCondition">Condition</Label>
              <Select
                value={formData.currentCondition}
                onValueChange={(value) => updateField("currentCondition", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ENUMS.CURRENT_CONDITION).map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {condition.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="locationName">Location Name *</Label>
              <Input
                id="locationName"
                value={formData.locationName}
                onChange={(e) => updateField("locationName", e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomOrArea">Room/Area</Label>
              <Input
                id="roomOrArea"
                value={formData.roomOrArea}
                onChange={(e) => updateField("roomOrArea", e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Public Visibility */}
      <Card>
        <CardHeader>
          <CardTitle>Public Visibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) => updateField("isPublic", checked)}
            />
            <Label htmlFor="isPublic">Make this asset visible in the guest portal</Label>
          </div>

          {formData.isPublic && (
            <div className="space-y-4 pl-6 border-l-2 border-blue-200">
              <div className="space-y-2">
                <Label htmlFor="publicSummary">Public Summary</Label>
                <Textarea
                  id="publicSummary"
                  value={formData.publicSummary}
                  onChange={(e) => updateField("publicSummary", e.target.value)}
                  placeholder="Brief description for public viewing..."
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="publicLocationLabel">Public Location</Label>
                  <Input
                    id="publicLocationLabel"
                    value={formData.publicLocationLabel}
                    onChange={(e) => updateField("publicLocationLabel", e.target.value)}
                    placeholder="Main Lab"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publicConditionLabel">Public Condition</Label>
                  <Select
                    value={formData.publicConditionLabel}
                    onValueChange={(value) => updateField("publicConditionLabel", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ENUMS.PUBLIC_CONDITION_LABEL).map((condition) => (
                        <SelectItem key={condition} value={condition}>
                          {condition.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : asset ? "Update Asset" : "Create Asset"}
        </Button>
      </div>
    </form>
  )
}
