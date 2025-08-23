"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { MainLayout } from "../../../components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Textarea } from "../../../components/ui/textarea"
import { Label } from "../../../components/ui/label"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogClose, 
  DialogFooter,
  DialogDescription 
} from "../../../components/ui/dialog"
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Package, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Edit3,
  Trash2,
  RotateCcw,
  Eye,
  MessageSquare
} from "lucide-react"
import {
  assetRequestsService,
  assetsService,
  staffService,
  assetEventsService,
} from "../../../lib/appwrite/provider.js"
import { getCurrentStaff, permissions } from "../../../lib/utils/auth.js"
import { ENUMS } from "../../../lib/appwrite/config.js"
import { Query } from "appwrite"

export default function RequestDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [request, setRequest] = useState(null)
  const [assets, setAssets] = useState([])
  const [requester, setRequester] = useState(null)
  const [approver, setApprover] = useState(null)
  const [currentStaff, setCurrentStaff] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [resubmitDialogOpen, setResubmitDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [resubmitReason, setResubmitReason] = useState("")

  useEffect(() => {
    loadData()
  }, [params.requestId])

  const loadData = async () => {
    try {
      const [requestData, staff] = await Promise.all([
        assetRequestsService.get(params.requestId),
        getCurrentStaff(),
      ])

      setRequest(requestData)
      setCurrentStaff(staff)

      // Load requester details
      const requesterData = await staffService.get(requestData.requesterStaffId)
      setRequester(requesterData)

      // Load approver details if exists
      if (requestData.approverStaffId) {
        try {
          const approverData = await staffService.get(requestData.approverStaffId)
          setApprover(approverData)
        } catch (error) {
          console.warn("Could not load approver data:", error)
        }
      }

      // Load assets details
      const assetsData = await Promise.all(
        requestData.requestedItems.map(async (itemId) => {
          try {
            return await assetsService.get(itemId)
          } catch {
            return { name: "Asset not found", $id: itemId, notFound: true }
          }
        })
      )
      setAssets(assetsData)

      // Load timeline/history
      await loadTimeline(requestData)
    } catch (err) {
      setError("Failed to load request details")
      console.error("Error loading request:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadTimeline = async (requestData) => {
    try {
      // Get related asset events for this request
      const eventsResult = await assetEventsService.list([
        Query.search("notes", `#${requestData.$id.slice(-8)}`),
        Query.orderDesc("at"),
      ])

      const timelineItems = [
        {
          id: "created",
          type: "created",
          timestamp: requestData.$createdAt,
          title: "Request Submitted",
          description: `Request submitted by ${requester?.name || "Unknown"}`,
          icon: FileText,
          color: "blue"
        }
      ]

      // Add status changes
      if (requestData.status === ENUMS.REQUEST_STATUS.APPROVED && requestData.approvedAt) {
        timelineItems.push({
          id: "approved",
          type: "approved",
          timestamp: requestData.approvedAt,
          title: "Request Approved",
          description: `Approved by ${approver?.name || "Admin"}`,
          notes: requestData.approvalNotes,
          icon: CheckCircle,
          color: "green"
        })
      }

      if (requestData.status === ENUMS.REQUEST_STATUS.DENIED && requestData.deniedAt) {
        timelineItems.push({
          id: "denied",
          type: "denied",
          timestamp: requestData.deniedAt,
          title: "Request Denied",
          description: `Denied by ${approver?.name || "Admin"}`,
          notes: requestData.denialReason,
          icon: XCircle,
          color: "red"
        })
      }

      if (requestData.status === ENUMS.REQUEST_STATUS.FULFILLED) {
        timelineItems.push({
          id: "fulfilled",
          type: "fulfilled",
          timestamp: requestData.fulfilledAt || requestData.$updatedAt,
          title: "Assets Issued",
          description: "Assets have been issued and are ready for pickup",
          icon: Package,
          color: "blue"
        })
      }

      // Add asset events
      eventsResult.documents.forEach(event => {
        timelineItems.push({
          id: event.$id,
          type: "asset_event",
          timestamp: event.at,
          title: `Asset ${event.eventType.replace(/_/g, " ")}`,
          description: event.notes,
          icon: Package,
          color: "gray"
        })
      })

      // Sort by timestamp descending
      timelineItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      setTimeline(timelineItems)
    } catch (error) {
      console.warn("Could not load timeline:", error)
    }
  }

  const handleCancelRequest = async () => {
    setActionLoading(true)
    try {
      await assetRequestsService.update(request.$id, {
        status: ENUMS.REQUEST_STATUS.CANCELLED,
        decisionNotes: cancelReason,
        decidedAt: new Date().toISOString()
      })
      setCancelDialogOpen(false)
      setCancelReason("")
      await loadData()
    } catch (error) {
      setError("Failed to cancel request")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteRequest = async () => {
    setActionLoading(true)
    try {
      await assetRequestsService.delete(request.$id)
      setDeleteDialogOpen(false)
      router.push("/requests?deleted=true")
    } catch (error) {
      setError("Failed to delete request")
      setActionLoading(false)
    }
  }

  const handleResubmitRequest = async () => {
    setActionLoading(true)
    try {
      // Create a new request based on the current one
      const newRequestData = {
        requesterStaffId: request.requesterStaffId,
        requestedItems: request.requestedItems,
        purpose: request.purpose,
        issueDate: request.issueDate,
        expectedReturnDate: request.expectedReturnDate,
        status: ENUMS.REQUEST_STATUS.PENDING,
        resubmissionReason: resubmitReason,
        originalRequestId: request.$id,
      }

      const newRequest = await assetRequestsService.create(newRequestData, {
        sendNotification: true,
        requester: requester,
        asset: assets[0] // For notification purposes
      })

      setResubmitDialogOpen(false)
      setResubmitReason("")
      router.push(`/requests/${newRequest.$id}`)
    } catch (error) {
      setError("Failed to resubmit request")
      setActionLoading(false)
    }
  }

  const getStatusBadgeColor = (status) => {
    const colors = {
      [ENUMS.REQUEST_STATUS.PENDING]: "bg-yellow-100 text-yellow-800 border-yellow-200",
      [ENUMS.REQUEST_STATUS.APPROVED]: "bg-green-100 text-green-800 border-green-200",
      [ENUMS.REQUEST_STATUS.DENIED]: "bg-red-100 text-red-800 border-red-200",
      [ENUMS.REQUEST_STATUS.CANCELLED]: "bg-gray-100 text-gray-800 border-gray-200",
      [ENUMS.REQUEST_STATUS.FULFILLED]: "bg-blue-100 text-blue-800 border-blue-200",
    }
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getStatusIcon = (status) => {
    const icons = {
      [ENUMS.REQUEST_STATUS.PENDING]: Clock,
      [ENUMS.REQUEST_STATUS.APPROVED]: CheckCircle,
      [ENUMS.REQUEST_STATUS.DENIED]: XCircle,
      [ENUMS.REQUEST_STATUS.CANCELLED]: XCircle,
      [ENUMS.REQUEST_STATUS.FULFILLED]: Package,
    }
    const IconComponent = icons[status] || AlertTriangle
    return <IconComponent className="w-4 h-4" />
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  // Permission checks
  const isRequester = currentStaff?.$id === request?.requesterStaffId
  const isAdmin = currentStaff && permissions.canApproveRequests(currentStaff)
  const canEditRequest = isRequester && request?.status === ENUMS.REQUEST_STATUS.PENDING
  const canCancelRequest = isRequester && [ENUMS.REQUEST_STATUS.PENDING, ENUMS.REQUEST_STATUS.APPROVED].includes(request?.status)
  const canDeleteRequest = isRequester && request?.status === ENUMS.REQUEST_STATUS.PENDING
  const canResubmitRequest = isRequester && request?.status === ENUMS.REQUEST_STATUS.DENIED

  if (loading) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </MainLayout>
    )
  }

  if (error || !request) {
    return (
      <MainLayout>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error || "Request not found"}</AlertDescription>
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/requests">← Back to Requests</Link>
              </Button>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                Request #{request.$id.slice(-8)}
              </h1>
              <Badge className={`${getStatusBadgeColor(request.status)} flex items-center gap-1`}>
                {getStatusIcon(request.status)}
                {request.status.replace(/_/g, " ")}
              </Badge>
            </div>
            <p className="text-gray-600">{request.purpose}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {canEditRequest && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/requests/${request.$id}/edit`}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Link>
              </Button>
            )}
            
            {canCancelRequest && (
              <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-orange-600 hover:text-orange-700">
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Request</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to cancel this request? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cancelReason">Cancellation Reason</Label>
                      <Textarea
                        id="cancelReason"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Please provide a reason for cancellation..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                      onClick={handleCancelRequest}
                      disabled={actionLoading || !cancelReason.trim()}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {actionLoading ? "Cancelling..." : "Cancel Request"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {canDeleteRequest && (
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Request</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to permanently delete this request? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                      onClick={handleDeleteRequest}
                      disabled={actionLoading}
                      variant="destructive"
                    >
                      {actionLoading ? "Deleting..." : "Delete Request"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {canResubmitRequest && (
              <Dialog open={resubmitDialogOpen} onOpenChange={setResubmitDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Resubmit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Resubmit Request</DialogTitle>
                    <DialogDescription>
                      This will create a new request with the same details. Please provide any additional context.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="resubmitReason">Additional Context (Optional)</Label>
                      <Textarea
                        id="resubmitReason"
                        value={resubmitReason}
                        onChange={(e) => setResubmitReason(e.target.value)}
                        placeholder="Address any concerns from the previous denial..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                      onClick={handleResubmitRequest}
                      disabled={actionLoading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {actionLoading ? "Resubmitting..." : "Resubmit Request"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {isAdmin && request.status === ENUMS.REQUEST_STATUS.APPROVED && (
              <Button asChild size="sm">
                <Link href={`/admin/issue/${request.$id}`}>
                  <Package className="w-4 h-4 mr-2" />
                  Issue Assets
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Request Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Requester</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {requester?.name?.split(" ").map(n => n[0]).join("") || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{requester?.name || "Unknown"}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Department</Label>
                    <p className="text-sm mt-1">{requester?.department || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Issue Date</Label>
                    <p className="text-sm mt-1">{formatDate(request.issueDate)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Expected Return</Label>
                    <p className="text-sm mt-1">{formatDate(request.expectedReturnDate)}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Purpose</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">{request.purpose}</p>
                </div>

                {request.resubmissionReason && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Resubmission Context</Label>
                    <p className="text-sm mt-1 p-3 bg-blue-50 rounded-md">{request.resubmissionReason}</p>
                  </div>
                )}

                {(request.approvalNotes || request.denialReason || request.decisionNotes) && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      {request.status === ENUMS.REQUEST_STATUS.APPROVED ? "Approval Notes" :
                       request.status === ENUMS.REQUEST_STATUS.DENIED ? "Denial Reason" :
                       "Decision Notes"}
                    </Label>
                    <div className={`text-sm mt-1 p-3 rounded-md ${
                      request.status === ENUMS.REQUEST_STATUS.APPROVED ? "bg-green-50" :
                      request.status === ENUMS.REQUEST_STATUS.DENIED ? "bg-red-50" :
                      "bg-gray-50"
                    }`}>
                      {request.approvalNotes || request.denialReason || request.decisionNotes}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Requested Assets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Requested Assets ({assets.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assets.map((asset) => (
                    <div key={asset.$id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{asset.name}</h4>
                          {asset.assetTag && (
                            <Badge variant="outline" className="text-xs">
                              {asset.assetTag}
                            </Badge>
                          )}
                          {asset.notFound && (
                            <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                              Not Found
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {asset.category?.replace(/_/g, " ")} • {asset.locationName}
                          {asset.roomOrArea && ` - ${asset.roomOrArea}`}
                        </p>
                        {asset.currentCondition && (
                          <p className="text-xs text-gray-500 mt-1">
                            Condition: {asset.currentCondition.replace(/_/g, " ")}
                          </p>
                        )}
                      </div>
                      {!asset.notFound && (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/assets/${asset.$id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Link>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Created</span>
                  <span>{formatDateTime(request.$createdAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last Updated</span>
                  <span>{formatDateTime(request.$updatedAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Duration</span>
                  <span>
                    {Math.ceil((new Date(request.expectedReturnDate) - new Date(request.issueDate)) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
                {approver && (
                  <div className="pt-2 border-t">
                    <span className="text-xs text-gray-600">
                      {request.status === ENUMS.REQUEST_STATUS.APPROVED ? "Approved by" :
                       request.status === ENUMS.REQUEST_STATUS.DENIED ? "Denied by" :
                       "Reviewed by"}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-xs">
                          {approver.name?.split(" ").map(n => n[0]).join("") || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{approver.name}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeline.map((item, index) => {
                    const IconComponent = item.icon
                    const isLast = index === timeline.length - 1
                    return (
                      <div key={item.id} className="relative flex gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                          item.color === "blue" ? "bg-blue-50 border-blue-200" :
                          item.color === "green" ? "bg-green-50 border-green-200" :
                          item.color === "red" ? "bg-red-50 border-red-200" :
                          "bg-gray-50 border-gray-200"
                        }`}>
                          <IconComponent className={`w-4 h-4 ${
                            item.color === "blue" ? "text-blue-600" :
                            item.color === "green" ? "text-green-600" :
                            item.color === "red" ? "text-red-600" :
                            "text-gray-600"
                          }`} />
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">{item.title}</h4>
                            <time className="text-xs text-gray-500">
                              {formatDateTime(item.timestamp)}
                            </time>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                          {item.notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                              <MessageSquare className="w-3 h-3 inline mr-1" />
                              {item.notes}
                            </div>
                          )}
                        </div>
                        {!isLast && (
                          <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-200" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}