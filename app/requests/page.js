"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pause,
  RefreshCw,
  Eye,
  X,
} from "lucide-react";
import {
  assetRequestsService,
  assetsService,
} from "../../lib/appwrite/provider.js";
import { getCurrentStaff } from "../../lib/utils/auth.js";
import { ENUMS } from "../../lib/appwrite/config.js";
import { Query } from "appwrite";

export default function MyRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (staff) {
      loadRequests();
    }
  }, [staff, statusFilter, searchTerm, dateFilter]);

  const loadData = async () => {
    try {
      const currentStaff = await getCurrentStaff();
      setStaff(currentStaff);
    } catch (error) {
      // Silent fail for staff data loading
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const queries = [
        Query.equal("requesterStaffId", staff.$id),
        Query.orderDesc("$createdAt"),
      ];

      if (statusFilter !== "all") {
        queries.push(Query.equal("status", statusFilter));
      }

      // Add date filtering
      if (dateFilter !== "all") {
        const now = new Date();
        const startOfDay = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        switch (dateFilter) {
          case "today":
            queries.push(
              Query.greaterThanEqual("$createdAt", startOfDay.toISOString())
            );
            break;
          case "week":
            const weekAgo = new Date(startOfDay);
            weekAgo.setDate(weekAgo.getDate() - 7);
            queries.push(
              Query.greaterThanEqual("$createdAt", weekAgo.toISOString())
            );
            break;
          case "month":
            const monthAgo = new Date(startOfDay);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            queries.push(
              Query.greaterThanEqual("$createdAt", monthAgo.toISOString())
            );
            break;
        }
      }

      const result = await assetRequestsService.list(queries);

      // Load asset details for each request
      let requestsWithAssets = await Promise.all(
        result.documents.map(async (request) => {
          try {
            const assets = await Promise.all(
              request.requestedItems.map(async (itemId) => {
                try {
                  return await assetsService.get(itemId);
                } catch {
                  return { name: "Asset not found", $id: itemId };
                }
              })
            );
            return { ...request, assets };
          } catch {
            return { ...request, assets: [] };
          }
        })
      );

      // Apply search filtering
      if (searchTerm) {
        requestsWithAssets = requestsWithAssets.filter((request) => {
          const searchLower = searchTerm.toLowerCase();
          return (
            request.purpose?.toLowerCase().includes(searchLower) ||
            request.assets.some((asset) =>
              asset.name?.toLowerCase().includes(searchLower)
            ) ||
            request.$id.toLowerCase().includes(searchLower)
          );
        });
      }

      setRequests(requestsWithAssets);
    } catch (error) {
      // Silent fail for requests loading
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      [ENUMS.REQUEST_STATUS.PENDING]:
        "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300",
      [ENUMS.REQUEST_STATUS.APPROVED]:
        "bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 border-primary-300",
      [ENUMS.REQUEST_STATUS.DENIED]:
        "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300",
      [ENUMS.REQUEST_STATUS.CANCELLED]:
        "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300",
      [ENUMS.REQUEST_STATUS.FULFILLED]:
        "bg-gradient-to-r from-sidebar-100 to-sidebar-200 text-sidebar-800 border-sidebar-300",
    };
    return (
      colors[status] ||
      "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300"
    );
  };

  const getStatusIcon = (status) => {
    const icons = {
      [ENUMS.REQUEST_STATUS.PENDING]: Pause,
      [ENUMS.REQUEST_STATUS.APPROVED]: CheckCircle,
      [ENUMS.REQUEST_STATUS.DENIED]: XCircle,
      [ENUMS.REQUEST_STATUS.CANCELLED]: X,
      [ENUMS.REQUEST_STATUS.FULFILLED]: CheckCircle,
    };
    return icons[status] || AlertCircle;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setSearchTerm("");
    setDateFilter("all");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Simple Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
              <p className="text-gray-600 text-lg mt-2">
                Track your asset requests and their status
              </p>
            </div>
            <Button
              asChild
              className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link
                href="/requests/new"
                className="flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>New Request</span>
              </Link>
            </Button>
          </div>
        </div>
        {/* Simple Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-gray-300 focus:border-primary-500 focus:ring-primary-500">
                  <SelectValue placeholder="All Statuses" />
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

            {/* Date Filter */}
            <div className="lg:w-48">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="border-gray-300 focus:border-primary-500 focus:ring-primary-500">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={clearFilters}
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card
                key={i}
                className="animate-pulse bg-white/80 backdrop-blur-sm border-0 shadow-lg"
              >
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-3 w-1/3"></div>
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-4 w-2/3"></div>
                      <div className="flex gap-3">
                        <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-24"></div>
                        <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-32"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <Card className="bg-white border border-gray-200">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No requests found
              </h3>
              <p className="text-gray-600 mb-6">
                {statusFilter !== "all" || searchTerm || dateFilter !== "all"
                  ? "No requests match your current filters."
                  : "You haven't made any asset requests yet."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  asChild
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                >
                  <Link
                    href="/requests/new"
                    className="flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Request</span>
                  </Link>
                </Button>
                {(statusFilter !== "all" ||
                  searchTerm ||
                  dateFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const StatusIcon = getStatusIcon(request.status);
              return (
                <Card
                  key={request.$id}
                  className="bg-white border border-gray-200 hover:shadow-md transition-shadow duration-200"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Request #{request.$id.slice(-8)}
                          </h3>
                          <Badge
                            className={getStatusBadgeColor(request.status)}
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {request.status.replace(/_/g, " ")}
                          </Badge>
                        </div>

                        <p className="text-gray-700 mb-3">{request.purpose}</p>

                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <span>Created: {formatDate(request.$createdAt)}</span>
                          <span>•</span>
                          <span>Issue: {formatDate(request.issueDate)}</span>
                          <span>•</span>
                          <span>
                            Return: {formatDate(request.expectedReturnDate)}
                          </span>
                        </div>

                        {/* Requested Assets */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                              Requested Assets ({request.assets.length})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {request.assets.map((asset) => (
                              <Badge
                                key={asset.$id}
                                variant="outline"
                                className="text-xs"
                              >
                                {asset.name}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Decision Notes */}
                        {request.decisionNotes && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <p className="text-sm text-gray-700">
                              <strong>Notes:</strong> {request.decisionNotes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          asChild
                          size="sm"
                          className="bg-primary-600 hover:bg-primary-700 text-white"
                        >
                          <Link
                            href={`/requests/${request.$id}`}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Link>
                        </Button>
                        {request.status === ENUMS.REQUEST_STATUS.PENDING && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
