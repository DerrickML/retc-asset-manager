"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MainLayout } from "../../../components/layout/main-layout"
import { Button } from "../../../components/ui/button"
import { Card, CardContent } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Textarea } from "../../../components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter, DialogDescription } from "../../../components/ui/dialog"
import { Check, X, FileText } from "lucide-react"
import { assetRequestsService, assetsService, staffService, settingsService } from "../../../lib/appwrite/provider.js"
import { getCurrentStaff, permissions } from "../../../lib/utils/auth.js"
import { ENUMS } from "../../../lib/appwrite/config.js"
import { Query } from "appwrite"

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [staff, setStaff] = useState(null)
  const [settings, setSettings] = useState(null)
  const [statusFilter, setStatusFilter] = useState("PENDING")

  // Decision dialog state
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [decisionNotes, setDecisionNotes] = useState("")
  const [decisionLoading, setDecisionLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadRequests()
  }, [statusFilter])

  const loadData = async () => {
    try {
      const [currentStaff, systemSettings] = await Promise.all([getCurrentStaff(), settingsService.get()])
      setStaff(currentStaff)
      setSettings(systemSettings)
    } catch (error) {
      console.error("Failed to load data:", error)
    }
  }

  const loadRequests = async () => {
    setLoading(true)
    try {
      const queries = [Query.orderDesc("$createdAt")]

      if (statusFilter !== "all") {
        queries.push(Query.equal("status", statusFilter))
      }

      const result = await assetRequestsService.list(queries)

      // Load additional details for each request
      const requestsWithDetails = await Promise.all(
        result.documents.map(async (request) => {
          try {
            const [requester, assets] = await Promise.all([
              staffService.get(request.requesterStaffId),
              Promise.all(
                request.requestedItems.map(async (itemId) => {
                  try {
                    return await assetsService.get(itemId)
                  } catch {
                    return { name: "Asset not found", $id: itemId }
                  }
                }),
              ),
            ])

            return { ...request, requester, assets }
          } catch {
            return { ...request, requester: { name: "Unknown" }, assets: [] }
          }
        }),
      )

      setRequests(requestsWithDetails)
    } catch (error) {
      console.error("Failed to load requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDecision = async (requestId, decision) => {
    setDecisionLoading(true)
    try {
      const updateData = {
        status: decision,
        decisionNotes,
        decisionByStaffId: staff.$id,
      }

      await assetRequestsService.update(requestId, updateData)

      // Reload requests
      await loadRequests()

      // Close dialog
      setSelectedRequest(null)
      setDecisionNotes("")
    } catch (error) {
      console.error("Failed to update request:", error)
    } finally {
      setDecisionLoading(false)
    }
  }

  const getStatusBadgeColor = (status) => {
    const colors = {
      [ENUMS.REQUEST_STATUS.PENDING]: "bg-yellow-100 text-yellow-800",
      [ENUMS.REQUEST_STATUS.APPROVED]: "bg-green-100 text-green-800",
      [ENUMS.REQUEST_STATUS.DENIED]: "bg-red-100 text-red-800",
      [ENUMS.REQUEST_STATUS.CANCELLED]: "bg-gray-100 text-gray-800",
      [ENUMS.REQUEST_STATUS.FULFILLED]: "bg-blue-100 text-blue-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const getPriorityLevel = (request) => {
    // Simple priority calculation based on request duration and asset count
    const duration = new Date(request.expectedReturnDate) - new Date(request.issueDate)
    const durationDays = duration / (1000 * 60 * 60 * 24)
    const assetCount = request.requestedItems.length

    if (durationDays > 30 || assetCount > 5) {
      return { level: "High", color: "bg-red-100 text-red-800" }
    } else if (durationDays > 7 || assetCount > 2) {
      return { level: "Medium", color: "bg-yellow-100 text-yellow-800" }
    }
    return { level: "Low", color: "bg-green-100 text-green-800" }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const canApproveRequests = staff && permissions.canApproveRequests(staff)

  if (!canApproveRequests) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to manage requests.</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout requiredPermission="canApproveRequests">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Request Queue</h1>
            <p className="text-gray-600">Review and manage asset requests</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.values(ENUMS.REQUEST_STATUS).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
              <p className="text-gray-600">
                {statusFilter !== "all" ? "No requests match the selected filter." : "No requests to review."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const priority = getPriorityLevel(request)
              return (
                <Card key={request.$id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">Request #{request.$id.slice(-8)}</h3>
                          <Badge className={getStatusBadgeColor(request.status)}>{request.status}</Badge>
                          <Badge className={priority.color}>{priority.level} Priority</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Requester:</strong> {request.requester.name}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Purpose:</strong> {request.purpose}
                        </p>
                        <div className="text-xs text-gray-500">
                          <p>Requested: {formatDateTime(request.$createdAt)}</p>
                          <p>
                            Period: {formatDate(request.issueDate)} to {formatDate(request.expectedReturnDate)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Requested Assets */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Requested Assets:</h4>
                      <div className="flex flex-wrap gap-2">
                        {request.assets.map((asset) => (
                          <Badge key={asset.$id} variant="outline" className="text-xs">
                            {asset.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Decision Notes */}
                    {request.decisionNotes && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Decision Notes:</h4>
                        <p className="text-sm text-gray-600">{request.decisionNotes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/requests/${request.$id}`}>View Details</Link>
                      </Button>

                      {request.status === ENUMS.REQUEST_STATUS.PENDING && (
                        <>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => setSelectedRequest(request)}
                              >
                                Approve
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
                              <DialogHeader className="sticky top-0 bg-white border-b pb-4 mb-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <DialogTitle className="text-xl font-semibold flex items-center space-x-2">
                                      <Check className="h-5 w-5 text-green-600" />
                                      <span>Approve Request</span>
                                    </DialogTitle>
                                    <DialogDescription className="text-gray-600 mt-1">Review and approve this asset request</DialogDescription>
                                  </div>
                                  <DialogClose asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                                      <X className="h-4 w-4" />
                                      <span className="sr-only">Close</span>
                                    </Button>
                                  </DialogClose>
                                </div>
                              </DialogHeader>
                              
                              <div className="space-y-6 pb-4">
                                {/* Request Summary */}
                                <div className="bg-green-50 p-6 rounded-lg space-y-4">
                                  <h3 className="text-lg font-semibold text-gray-900">Request Details</h3>
                                  <div className="space-y-2">
                                    <p className="text-sm">
                                      <span className="font-medium text-gray-700">Requester:</span> {request.requester.name}
                                    </p>
                                    <p className="text-sm">
                                      <span className="font-medium text-gray-700">Purpose:</span> {request.purpose}
                                    </p>
                                    <p className="text-sm">
                                      <span className="font-medium text-gray-700">Duration:</span> {formatDate(request.issueDate)} to {formatDate(request.expectedReturnDate)}
                                    </p>
                                    <p className="text-sm">
                                      <span className="font-medium text-gray-700">Assets:</span> {request.assets.map(a => a.name).join(', ')}
                                    </p>
                                  </div>
                                </div>

                                {/* Decision Notes */}
                                <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                                  <div className="flex items-center space-x-2">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    <h3 className="text-lg font-semibold text-gray-900">Decision Notes</h3>
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-sm font-medium text-gray-700">Additional Notes (Optional)</label>
                                    <Textarea
                                      value={decisionNotes}
                                      onChange={(e) => setDecisionNotes(e.target.value)}
                                      placeholder="Add any notes about this approval decision..."
                                      rows={4}
                                      className="resize-none"
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <DialogFooter className="sticky bottom-0 bg-white border-t pt-4 mt-6">
                                <div className="flex items-center justify-between w-full">
                                  <p className="text-sm text-green-600 font-medium">
                                    ✓ This will approve the request and notify the requester
                                  </p>
                                  <div className="flex items-center space-x-3">
                                    <DialogClose asChild>
                                      <Button 
                                        variant="outline" 
                                        className="px-6"
                                        onClick={() => {
                                          setSelectedRequest(null)
                                          setDecisionNotes("")
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                    </DialogClose>
                                    <Button
                                      onClick={() => handleDecision(request.$id, ENUMS.REQUEST_STATUS.APPROVED)}
                                      disabled={decisionLoading}
                                      className="px-6 bg-green-600 hover:bg-green-700"
                                    >
                                      <Check className="w-4 h-4 mr-2" />
                                      {decisionLoading ? "Approving..." : "Approve Request"}
                                    </Button>
                                  </div>
                                </div>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 bg-transparent"
                                onClick={() => setSelectedRequest(request)}
                              >
                                Deny
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
                              <DialogHeader className="sticky top-0 bg-white border-b pb-4 mb-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <DialogTitle className="text-xl font-semibold flex items-center space-x-2">
                                      <X className="h-5 w-5 text-red-600" />
                                      <span>Deny Request</span>
                                    </DialogTitle>
                                    <DialogDescription className="text-gray-600 mt-1">Provide a reason for denying this asset request</DialogDescription>
                                  </div>
                                  <DialogClose asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                                      <X className="h-4 w-4" />
                                      <span className="sr-only">Close</span>
                                    </Button>
                                  </DialogClose>
                                </div>
                              </DialogHeader>
                              
                              <div className="space-y-6 pb-4">
                                {/* Request Summary */}
                                <div className="bg-red-50 p-6 rounded-lg space-y-4">
                                  <h3 className="text-lg font-semibold text-gray-900">Request Details</h3>
                                  <div className="space-y-2">
                                    <p className="text-sm">
                                      <span className="font-medium text-gray-700">Requester:</span> {request.requester.name}
                                    </p>
                                    <p className="text-sm">
                                      <span className="font-medium text-gray-700">Purpose:</span> {request.purpose}
                                    </p>
                                    <p className="text-sm">
                                      <span className="font-medium text-gray-700">Duration:</span> {formatDate(request.issueDate)} to {formatDate(request.expectedReturnDate)}
                                    </p>
                                    <p className="text-sm">
                                      <span className="font-medium text-gray-700">Assets:</span> {request.assets.map(a => a.name).join(', ')}
                                    </p>
                                  </div>
                                </div>

                                {/* Denial Reason */}
                                <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                                  <div className="flex items-center space-x-2">
                                    <FileText className="h-5 w-5 text-red-600" />
                                    <h3 className="text-lg font-semibold text-gray-900">Reason for Denial</h3>
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-sm font-medium text-gray-700">Explanation *</label>
                                    <Textarea
                                      value={decisionNotes}
                                      onChange={(e) => setDecisionNotes(e.target.value)}
                                      placeholder="Please provide a clear reason for denying this request. This will be shared with the requester."
                                      rows={4}
                                      className="resize-none"
                                      required
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <DialogFooter className="sticky bottom-0 bg-white border-t pt-4 mt-6">
                                <div className="flex items-center justify-between w-full">
                                  <p className="text-sm text-red-600 font-medium">
                                    ⚠ This will deny the request and notify the requester
                                  </p>
                                  <div className="flex items-center space-x-3">
                                    <DialogClose asChild>
                                      <Button 
                                        variant="outline" 
                                        className="px-6"
                                        onClick={() => {
                                          setSelectedRequest(null)
                                          setDecisionNotes("")
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                    </DialogClose>
                                    <Button
                                      onClick={() => handleDecision(request.$id, ENUMS.REQUEST_STATUS.DENIED)}
                                      disabled={decisionLoading || !decisionNotes.trim()}
                                      className="px-6 bg-red-600 hover:bg-red-700"
                                    >
                                      <X className="w-4 h-4 mr-2" />
                                      {decisionLoading ? "Denying..." : "Deny Request"}
                                    </Button>
                                  </div>
                                </div>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}

                      {request.status === ENUMS.REQUEST_STATUS.APPROVED && (
                        <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Link href={`/admin/issue/${request.$id}`}>Issue Assets</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
