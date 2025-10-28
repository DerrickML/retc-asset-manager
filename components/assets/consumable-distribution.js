"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { staffService } from "../../lib/appwrite/provider.js";
import { Query } from "appwrite";

export function ConsumableDistribution({ consumableId }) {
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDistributions();
  }, [consumableId]);

  const loadDistributions = async () => {
    try {
      // Get all distributions for this consumable
      // const result = await consumableDistributionsService.list([
      //   Query.equal("consumableId", consumableId),
      //   Query.orderDesc("distributedAt"),
      // ]);
      const result = { documents: [] }; // Temporary fix

      // Load staff details for distributors
      const distributionsWithDetails = await Promise.all(
        result.documents.map(async (distribution) => {
          try {
            const distributor = await staffService.get(
              distribution.distributedBy
            );
            return { ...distribution, distributorName: distributor.name };
          } catch {
            return { ...distribution, distributorName: "Unknown User" };
          }
        })
      );

      setDistributions(distributionsWithDetails);
    } catch (error) {
      // Failed to load distributions
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-blue-100 text-blue-800",
      DENIED: "bg-red-100 text-red-800",
      DISTRIBUTED: "bg-green-100 text-green-800",
      CANCELLED: "bg-gray-100 text-gray-800",
    };

    const statusText = status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());

    return (
      <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>
        {statusText}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribution History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading distributions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribution History</CardTitle>
      </CardHeader>
      <CardContent>
        {distributions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No distribution records found for this consumable.
          </p>
        ) : (
          <div className="space-y-4">
            {distributions.map((distribution) => (
              <div key={distribution.$id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">
                    Distribution #{distribution.$id.slice(-8)}
                  </h4>
                  {getStatusBadge(distribution.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">
                      Distribution Details
                    </h5>
                    <p>
                      <strong>Recipient:</strong> {distribution.recipientName}
                    </p>
                    <p>
                      <strong>Quantity:</strong> {distribution.quantity}{" "}
                      {distribution.unit?.toLowerCase()}
                    </p>
                    <p>
                      <strong>Distributed by:</strong>{" "}
                      {distribution.distributorName}
                    </p>
                    <p>
                      <strong>Distributed at:</strong>{" "}
                      {formatDate(distribution.distributedAt)}
                    </p>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">
                      Additional Information
                    </h5>
                    {distribution.purpose && (
                      <p>
                        <strong>Purpose:</strong> {distribution.purpose}
                      </p>
                    )}
                    {distribution.notes && (
                      <p>
                        <strong>Notes:</strong> {distribution.notes}
                      </p>
                    )}
                    {distribution.approvedBy && (
                      <p>
                        <strong>Approved by:</strong> {distribution.approvedBy}
                      </p>
                    )}
                    {distribution.approvedAt && (
                      <p>
                        <strong>Approved at:</strong>{" "}
                        {formatDate(distribution.approvedAt)}
                      </p>
                    )}
                  </div>
                </div>

                {distribution.status === "PENDING" && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          // TODO: Implement approval
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          // TODO: Implement denial
                        }}
                      >
                        Deny
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
