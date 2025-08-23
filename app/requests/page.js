"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MainLayout } from "../../components/layout/main-layout"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { assetRequestsService, assetsService } from "../../lib/appwrite/provider.js"
import { getCurrentStaff } from "../../lib/utils/auth.js"
import { ENUMS } from "../../lib/appwrite/config.js"
import { Query } from "appwrite"

export default function MyRequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [staff, setStaff] = useState(null)
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (staff) {
      loadRequests()
    }
  }, [staff, statusFilter])

  const loadData = async () => {
    try {
      const currentStaff = await getCurrentStaff()
      setStaff(currentStaff)
    } catch (error) {
      console.error("Failed to load staff data:", error)
    }
  }

  const loadRequests = async () => {
    setLoading(true)
    try {
      const queries = [Query.equal("requesterStaffId", staff.$id), Query.orderDesc("$createdAt")]

      if (statusFilter !== "all") {
        queries.push(Query.equal("status", statusFilter))
      }

      const result = await assetRequestsService.list(queries)

      // Load asset details for each request
      const requestsWithAssets = await Promise.all(
        result.documents.map(async (request) => {
          try {
            const assets = await Promise.all(
              request.requestedItems.map(async (itemId) => {
                try {
                  return await assetsService.get(itemId)
                } catch {
                  return { name: "Asset not found", $id: itemId }
                }
              }),
            )
            return { ...request, assets }
          } catch {
            return { ...request, assets: [] }
          }
        }),
      )

      setRequests(requestsWithAssets)
    } catch (error) {
      console.error("Failed to load requests:", error)
    } finally {
      setLoading(false)
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
            <p className="text-gray-600">Track your asset requests and their status</p>
          </div>
          <Button asChild>
            <Link href="/requests/new">New Request</Link>
          </Button>
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
            {Array.from({ length: 3 }).map((_, i) => (
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
              <p className="text-gray-600 mb-4">
                {statusFilter !== "all"
                  ? "No requests match the selected filter."
                  : "You haven't made any asset requests yet."}
              </p>
              <Button asChild>
                <Link href="/requests/new">Create First Request</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.$id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">Request #{request.$id.slice(-8)}</h3>
                        <Badge className={getStatusBadgeColor(request.status)}>{request.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{request.purpose}</p>
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
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Decision Notes:</h4>
                      <p className="text-sm text-gray-600">{request.decisionNotes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/requests/${request.$id}`}>View Details</Link>
                    </Button>
                    {request.status === ENUMS.REQUEST_STATUS.PENDING && (
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                        Cancel Request
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
