"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { assetIssuesService, assetReturnsService, staffService } from "../../lib/appwrite/provider.js"
import { Query } from "appwrite"


export function AssetCustody({ assetId }) {
  const [custodyHistory, setCustodyHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCustodyHistory()
  }, [assetId])

  const loadCustodyHistory = async () => {
    try {
      // Get all issues for this asset
      const issuesResult = await assetIssuesService.list([Query.equal("assetId", assetId), Query.orderDesc("issuedAt")])

      // For each issue, get the return record and staff details
      const historyWithDetails = await Promise.all(
        issuesResult.documents.map(async (issue) => {
          try {
            // Get return record
            const returnsResult = await assetReturnsService.list([Query.equal("issueId", issue.$id)])
            const returnRecord = returnsResult.documents[0] || null

            // Get staff details
            const [issuer, requester, receiver] = await Promise.all([
              staffService.get(issue.issuedByStaffId).catch(() => ({ name: "Unknown" })),
              issue.requesterStaffId
                ? staffService.get(issue.requesterStaffId).catch(() => ({ name: "Unknown" }))
                : null,
              returnRecord?.receivedByStaffId
                ? staffService.get(returnRecord.receivedByStaffId).catch(() => ({ name: "Unknown" }))
                : null,
            ])

            return {
              issue,
              return: returnRecord,
              issuer,
              requester,
              receiver,
            }
          } catch (error) {
            console.error("Failed to load custody details:", error)
            return null
          }
        }),
      )

      setCustodyHistory(historyWithDetails.filter(Boolean))
    } catch (error) {
      console.error("Failed to load custody history:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (issue, returnRecord) => {
    if (returnRecord) {
      return <Badge className="bg-green-100 text-green-800">Returned</Badge>
    }

    const dueDate = new Date(issue.dueAt)
    const now = new Date()

    if (now > dueDate) {
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
    }

    return <Badge className="bg-blue-100 text-blue-800">Active</Badge>
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custody History</CardTitle>
      </CardHeader>
      <CardContent>
        {custodyHistory.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No custody records found for this asset.</p>
        ) : (
          <div className="space-y-4">
            {custodyHistory.map((record) => (
              <div key={record.issue.$id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Issue #{record.issue.$id.slice(-8)}</h4>
                  {getStatusBadge(record.issue, record.return)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Issue Details</h5>
                    <p>
                      <strong>Issued by:</strong> {record.issuer.name}
                    </p>
                    {record.requester && (
                      <p>
                        <strong>Requester:</strong> {record.requester.name}
                      </p>
                    )}
                    <p>
                      <strong>Issued at:</strong> {formatDate(record.issue.issuedAt)}
                    </p>
                    <p>
                      <strong>Due at:</strong> {formatDate(record.issue.dueAt)}
                    </p>
                    <p>
                      <strong>Pre-condition:</strong> {record.issue.preCondition}
                    </p>
                    {record.issue.accessories && record.issue.accessories.length > 0 && (
                      <p>
                        <strong>Accessories:</strong> {record.issue.accessories.join(", ")}
                      </p>
                    )}
                  </div>

                  {record.return && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Return Details</h5>
                      <p>
                        <strong>Returned by:</strong> {record.requester?.name || "Unknown"}
                      </p>
                      <p>
                        <strong>Received by:</strong> {record.receiver?.name || "Unknown"}
                      </p>
                      <p>
                        <strong>Returned at:</strong> {formatDate(record.return.returnedAt)}
                      </p>
                      <p>
                        <strong>Post-condition:</strong> {record.return.postCondition}
                      </p>
                      {record.return.missingAccessories && record.return.missingAccessories.length > 0 && (
                        <p>
                          <strong>Missing accessories:</strong> {record.return.missingAccessories.join(", ")}
                        </p>
                      )}
                      {record.return.remarks && (
                        <p>
                          <strong>Remarks:</strong> {record.return.remarks}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {record.issue.handoverNote && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      <strong>Handover note:</strong> {record.issue.handoverNote}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
