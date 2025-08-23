"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"
import { departmentsService, staffService } from "../../lib/appwrite/provider.js"
import { getStatusBadgeColor, getConditionBadgeColor, formatCategory } from "../../lib/utils/mappings.js"
import { getCurrentStaff, permissions } from "../../lib/utils/auth.js"


export function AssetOverview({ asset, onUpdate }) {
  const [department, setDepartment] = useState(null)
  const [custodian, setCustodian] = useState(null)
  const [staff, setStaff] = useState(null)

  useEffect(() => {
    loadRelatedData()
  }, [asset])

  const loadRelatedData = async () => {
    try {
      const [currentStaff] = await Promise.all([getCurrentStaff()])
      setStaff(currentStaff)

      if (asset.departmentId) {
        const deptData = await departmentsService.get(asset.departmentId)
        setDepartment(deptData)
      }

      if (asset.custodianStaffId) {
        const custodianData = await staffService.get(asset.custodianStaffId)
        setCustodian(custodianData)
      }
    } catch (error) {
      console.error("Failed to load related data:", error)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Not set"
    return new Date(dateString).toLocaleDateString()
  }

  const canManageAssets = staff && permissions.canManageAssets(staff)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">Asset Tag</h4>
            <p className="font-mono text-sm">{asset.assetTag}</p>
          </div>

          {asset.serialNumber && (
            <div>
              <h4 className="font-medium text-gray-900">Serial Number</h4>
              <p className="font-mono text-sm">{asset.serialNumber}</p>
            </div>
          )}

          <div>
            <h4 className="font-medium text-gray-900">Category</h4>
            <p className="text-sm">{formatCategory(asset.category)}</p>
          </div>

          {asset.subcategory && (
            <div>
              <h4 className="font-medium text-gray-900">Subcategory</h4>
              <p className="text-sm">{asset.subcategory}</p>
            </div>
          )}

          {asset.manufacturer && (
            <div>
              <h4 className="font-medium text-gray-900">Manufacturer</h4>
              <p className="text-sm">{asset.manufacturer}</p>
            </div>
          )}

          {asset.model && (
            <div>
              <h4 className="font-medium text-gray-900">Model</h4>
              <p className="text-sm">{asset.model}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status & Condition */}
      <Card>
        <CardHeader>
          <CardTitle>Status & Condition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Current Status</h4>
            <Badge className={getStatusBadgeColor(asset.availableStatus)}>
              {asset.availableStatus.replace(/_/g, " ")}
            </Badge>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Condition</h4>
            <Badge className={getConditionBadgeColor(asset.currentCondition)}>
              {asset.currentCondition.replace(/_/g, " ")}
            </Badge>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium text-gray-900">Department</h4>
            <p className="text-sm">{department?.name || "Loading..."}</p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900">Custodian</h4>
            <p className="text-sm">{custodian?.name || "Not assigned"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">Location</h4>
            <p className="text-sm">{asset.locationName}</p>
          </div>

          {asset.roomOrArea && (
            <div>
              <h4 className="font-medium text-gray-900">Room/Area</h4>
              <p className="text-sm">{asset.roomOrArea}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lifecycle Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Lifecycle Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">Purchase Date</h4>
            <p className="text-sm">{formatDate(asset.purchaseDate)}</p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900">Warranty Expiry</h4>
            <p className="text-sm">{formatDate(asset.warrantyExpiryDate)}</p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900">Last Maintenance</h4>
            <p className="text-sm">{formatDate(asset.lastMaintenanceDate)}</p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900">Next Maintenance Due</h4>
            <p className="text-sm">{formatDate(asset.nextMaintenanceDue)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Public Visibility */}
      {asset.isPublic && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Public Visibility
              <Badge variant="outline">Visible to Guests</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {asset.publicSummary && (
              <div>
                <h4 className="font-medium text-gray-900">Public Summary</h4>
                <p className="text-sm text-gray-600">{asset.publicSummary}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {asset.publicLocationLabel && (
                <div>
                  <h4 className="font-medium text-gray-900">Public Location</h4>
                  <p className="text-sm">{asset.publicLocationLabel}</p>
                </div>
              )}

              {asset.publicConditionLabel && (
                <div>
                  <h4 className="font-medium text-gray-900">Public Condition</h4>
                  <Badge variant="outline">{asset.publicConditionLabel.replace(/_/g, " ")}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
