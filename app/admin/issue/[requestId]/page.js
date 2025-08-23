"use client"

import Link from "next/link"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "../../../../components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Label } from "../../../../components/ui/label"
import { Textarea } from "../../../../components/ui/textarea"
import { Alert, AlertDescription } from "../../../../components/ui/alert"
import { Badge } from "../../../../components/ui/badge"
import {
  assetRequestsService,
  assetsService,
  assetIssuesService,
  staffService,
  writeAssetEvent,
} from "../../../../lib/appwrite/provider.js"
import { getCurrentStaff, permissions } from "../../../../lib/utils/auth.js"
import { ENUMS } from "../../../../lib/appwrite/config.js"
import { canIssueAsset } from "../../../../lib/utils/validation.js"
import { EmailService } from "../../../../lib/services/email.js"

export default function IssueAssetsPage() {
  const params = useParams()
  const router = useRouter()
  const [request, setRequest] = useState(null)
  const [assets, setAssets] = useState([])
  const [staff, setStaff] = useState(null)
  const [loading, setLoading] = useState(true)
  const [issuing, setIssuing] = useState(false)
  const [error, setError] = useState("")

  // Issue form data
  const [issueData, setIssueData] = useState({})
  const [handoverNote, setHandoverNote] = useState("")

  useEffect(() => {
    loadData()
  }, [params.requestId])

  const loadData = async () => {
    try {
      const [requestData, currentStaff] = await Promise.all([
        assetRequestsService.get(params.requestId),
        getCurrentStaff(),
      ])
      console.log("Loaded request data:", requestData)

      if (requestData.status !== ENUMS.REQUEST_STATUS.APPROVED) {
        setError("This request has not been approved yet.")
        return
      }

      // Load assets and requester details
      const [assetsData, requester] = await Promise.all([
        Promise.all(requestData.requestedItems.map((id) => assetsService.get(id))),
        staffService.get(requestData.requesterStaffId),
      ])

      setRequest({ ...requestData, requester })
      setAssets(assetsData)
      setStaff(currentStaff)

      // Initialize issue data for each asset
      const initialIssueData = {}
      assetsData.forEach((asset) => {
        initialIssueData[asset.$id] = {
          preCondition: asset.currentCondition,
          accessories: [],
          customAccessory: "",
        }
      })
      setIssueData(initialIssueData)
    } catch (err) {
      setError("Failed to load request data.")
    } finally {
      setLoading(false)
    }
  }

  const updateAssetIssueData = (assetId, field, value) => {
    setIssueData((prev) => ({
      ...prev,
      [assetId]: {
        ...prev[assetId],
        [field]: value,
      },
    }))
  }

  const addAccessory = (assetId, accessory) => {
    if (!accessory.trim()) return

    setIssueData((prev) => ({
      ...prev,
      [assetId]: {
        ...prev[assetId],
        accessories: [...prev[assetId].accessories, accessory.trim()],
        customAccessory: "",
      },
    }))
  }

  const removeAccessory = (assetId, index) => {
    setIssueData((prev) => ({
      ...prev,
      [assetId]: {
        ...prev[assetId],
        accessories: prev[assetId].accessories.filter((_, i) => i !== index),
      },
    }))
  }

  const handleIssue = async () => {
    setIssuing(true)
    setError("")

    try {

      // Validate all assets can be issued
      for (const asset of assets) {
        // Assign asset to custodian
        try {
          const assignCustodian = await assetsService.update(
            asset.$id,
            {
              custodianStaffId: request.requesterStaffId,
            },
            staff.$id,
            `Asset custodian changed to #${request.$id.slice(-8)}`,
          )
        } catch (err) {
          console.error("Error assigning custodian for asset:", asset.$id, err)
          // throw new Error(`Failed to assign custodian for asset ${asset.name}: ${err.message}`)
        }

        // Now Validate all assets can be issued
        canIssueAsset(asset)
      }

      // Create issue records for each asset
      const issuePromises = assets.map(async (asset) => {
        const assetIssueData = issueData[asset.$id]

        // Create issue record
        const issue = await assetIssuesService.create({
          requestId: request.$id,
          assetId: asset.$id,
          issuedByStaffId: staff.$id,
          preCondition: assetIssueData.preCondition,
          accessories: assetIssueData.accessories,
          issuedAt: new Date().toISOString(),
          dueAt: request.expectedReturnDate,
          handoverNote,
          acknowledgedByRequester: false,
        })

        // Update asset status
        await assetsService.update(
          asset.$id,
          {
            availableStatus: ENUMS.AVAILABLE_STATUS.IN_USE,
            custodianStaffId: request.requesterStaffId,
          },
          staff.$id,
          `Asset issued for request #${request.$id.slice(-8)}`,
        )

        // Write assignment event
        await writeAssetEvent(
          asset.$id,
          ENUMS.EVENT_TYPE.ASSIGNED,
          null,
          request.requester.name,
          staff.$id,
          `Issued to ${request.requester.name} for: ${request.purpose}`,
        )

        return issue
      })

      await Promise.all(issuePromises)

      // Update request status to fulfilled
      await assetRequestsService.update(request.$id, {
        status: ENUMS.REQUEST_STATUS.FULFILLED,
      })

      // Send email notification to requester about asset issuance
      try {
        await EmailService.sendAssetIssued(request, request.requester, assets[0], staff)
      } catch (error) {
        console.warn('Failed to send asset issued notification:', error)
      }

      router.push("/admin/requests")
    } catch (err) {
      setError(err.message || "Failed to issue assets")
    } finally {
      setIssuing(false)
    }
  }

  const canIssueAssets = staff && permissions.canIssueAssets(staff)

  if (!canIssueAssets) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to issue assets.</p>
        </div>
      </MainLayout>
    )
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </MainLayout>
    )
  }

  if (error || !request) {
    return (
      <MainLayout>
        <Alert variant="destructive">
          <AlertDescription>{error || "Request not found"}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/admin/requests">Back to Requests</Link>
          </Button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout requiredPermission="canIssueAssets">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Issue Assets</h1>
          <p className="text-gray-600">Complete the asset issuance for approved request</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Request Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Request Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <strong>Request ID:</strong> #{request.$id.slice(-8)}
            </p>
            <p>
              <strong>Requester:</strong> {request.requester.name}
            </p>
            <p>
              <strong>Purpose:</strong> {request.purpose}
            </p>
            <p>
              <strong>Issue Date:</strong> {new Date(request.issueDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Expected Return:</strong> {new Date(request.expectedReturnDate).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        {/* Assets to Issue */}
        <div className="space-y-4">
          {assets.map((asset) => (
            <Card key={asset.$id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{asset.name}</span>
                  <Badge className="bg-blue-100 text-blue-800">{asset.assetTag}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pre-Issue Condition</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={issueData[asset.$id]?.preCondition || ""}
                      onChange={(e) => updateAssetIssueData(asset.$id, "preCondition", e.target.value)}
                    >
                      {Object.values(ENUMS.CURRENT_CONDITION).map((condition) => (
                        <option key={condition} value={condition}>
                          {condition.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <p className="text-sm text-gray-600">
                      {asset.locationName}
                      {asset.roomOrArea && ` - ${asset.roomOrArea}`}
                    </p>
                  </div>
                </div>

                {/* Accessories */}
                <div className="space-y-2">
                  <Label>Accessories Included</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {issueData[asset.$id]?.accessories.map((accessory, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {accessory}
                        <button
                          type="button"
                          onClick={() => removeAccessory(asset.$id, index)}
                          className="ml-1 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add accessory..."
                      value={issueData[asset.$id]?.customAccessory || ""}
                      onChange={(e) => updateAssetIssueData(asset.$id, "customAccessory", e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addAccessory(asset.$id, issueData[asset.$id]?.customAccessory)
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addAccessory(asset.$id, issueData[asset.$id]?.customAccessory)}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Handover Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Handover Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={handoverNote}
              onChange={(e) => setHandoverNote(e.target.value)}
              placeholder="Add any special instructions or notes for the requester..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => router.back()} disabled={issuing}>
            Cancel
          </Button>
          <Button onClick={handleIssue} disabled={issuing} className="bg-blue-600 hover:bg-blue-700">
            {issuing ? "Issuing Assets..." : "Issue Assets"}
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
