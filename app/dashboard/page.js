"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import {
  Package,
  Clock,
  AlertTriangle,
  Activity,
  FileText,
  RefreshCw,
  Calendar,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  Zap,
  TrendingUp,
  Eye,
  Send,
  Search,
} from "lucide-react";
import { getCurrentStaff } from "../../lib/utils/auth.js";
import {
  assetsService,
  assetRequestsService,
} from "../../lib/appwrite/provider.js";
import { Query } from "appwrite";
import { ENUMS } from "../../lib/appwrite/config.js";
import {
  getConsumableStatus,
  getCurrentStock,
  getMinStock,
} from "../../lib/utils/mappings.js";

export default function DashboardPage() {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalAssets: 0,
    availableAssets: 0,
    myRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    fulfilledRequests: 0,
    totalConsumables: 0,
    inStockConsumables: 0,
    lowStockConsumables: 0,
    recentRequests: [],
    recentAssets: [],
  });

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      const currentStaff = await getCurrentStaff();
      setStaff(currentStaff);

      if (!currentStaff) {
        setError("Not authenticated");
        return;
      }

      const [assetsResponse, requestsResponse] = await Promise.all([
        assetsService.list(),
        assetRequestsService.list([Query.orderDesc("$createdAt")]),
      ]);

      const assets = assetsResponse.documents || [];
      const requests = requestsResponse.documents || [];

      const myRequests = requests.filter(
        (request) => request.requesterStaffId === currentStaff.$id
      );

      // Filter assets and consumables
      const assetsOnly = assets.filter(
        (item) =>
          item.itemType === ENUMS.ITEM_TYPE.ASSET ||
          !item.itemType ||
          item.itemType === undefined
      );

      const consumablesOnly = assets.filter(
        (item) => item.itemType === ENUMS.ITEM_TYPE.CONSUMABLE
      );

      const totalAssets = assetsOnly.length;
      const availableAssets = assetsOnly.filter(
        (asset) => asset.availableStatus === ENUMS.AVAILABLE_STATUS.AVAILABLE
      ).length;
      const myRequestsCount = myRequests.length;
      const pendingRequests = myRequests.filter(
        (request) => request.status === ENUMS.REQUEST_STATUS.PENDING
      ).length;
      const approvedRequests = myRequests.filter(
        (request) => request.status === ENUMS.REQUEST_STATUS.APPROVED
      ).length;
      const rejectedRequests = myRequests.filter(
        (request) => request.status === ENUMS.REQUEST_STATUS.REJECTED
      ).length;
      const fulfilledRequests = myRequests.filter(
        (request) => request.status === ENUMS.REQUEST_STATUS.FULFILLED
      ).length;
      const totalConsumables = consumablesOnly.length;

      // Calculate consumable stock status
      const inStockConsumables = consumablesOnly.filter(
        (c) => getConsumableStatus(c) === ENUMS.CONSUMABLE_STATUS.IN_STOCK
      ).length;
      const lowStockConsumables = consumablesOnly.filter(
        (c) => getConsumableStatus(c) === ENUMS.CONSUMABLE_STATUS.LOW_STOCK
      ).length;

      // Process recent requests with asset names
      const recentRequestsWithAssets = await Promise.all(
        myRequests
          .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt))
          .slice(0, 5)
          .map(async (request) => {
            try {
              const assetNames = await Promise.all(
                request.requestedItems.map(async (assetId) => {
                  try {
                    const asset = await assetsService.get(assetId);
                    return asset.name;
                  } catch (error) {
                    return "Unknown Asset";
                  }
                })
              );

              return {
                ...request,
                assetNames: assetNames.join(", "),
                itemCount: request.requestedItems.length,
              };
            } catch (error) {
              return {
                ...request,
                assetNames: "Unknown Assets",
                itemCount: request.requestedItems?.length || 0,
              };
            }
          })
      );

      const recentAssets = assetsOnly
        .filter((a) => a.availableStatus === ENUMS.AVAILABLE_STATUS.AVAILABLE)
        .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt))
        .slice(0, 6);

      setDashboardData({
        totalAssets,
        availableAssets,
        myRequests: myRequestsCount,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        fulfilledRequests,
        totalConsumables,
        inStockConsumables,
        lowStockConsumables,
        recentRequests: recentRequestsWithAssets,
        recentAssets,
      });

      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError(
        `Failed to load dashboard data: ${err.message || err.toString()}`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case ENUMS.REQUEST_STATUS.PENDING:
        return "bg-orange-100 text-orange-700";
      case ENUMS.REQUEST_STATUS.APPROVED:
        return "bg-green-100 text-green-700";
      case ENUMS.REQUEST_STATUS.REJECTED:
        return "bg-red-100 text-red-700";
      case ENUMS.REQUEST_STATUS.FULFILLED:
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case ENUMS.REQUEST_STATUS.PENDING:
        return <Clock className="w-3 h-3" />;
      case ENUMS.REQUEST_STATUS.APPROVED:
        return <CheckCircle2 className="w-3 h-3" />;
      case ENUMS.REQUEST_STATUS.REJECTED:
        return <XCircle className="w-3 h-3" />;
      case ENUMS.REQUEST_STATUS.FULFILLED:
        return <Zap className="w-3 h-3" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-slate-600 font-medium">Loading Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="border-b border-red-100">
            <CardTitle className="text-red-700 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Error Loading Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              onClick={loadDashboardData}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Clean Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
            <div className="space-y-1">
              {staff && (
                <h1 className="text-3xl font-bold text-slate-900">
                  {getTimeBasedGreeting()}, <span className="text-blue-600">{staff.name}</span>!
                </h1>
              )}
              <p className="text-slate-600">
                Welcome to your asset management dashboard
              </p>
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <Calendar className="w-4 h-4" />
                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={loadDashboardData}
                variant="outline"
                disabled={refreshing}
                className="h-10 px-4 border-slate-300 hover:bg-slate-50"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Available Assets */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <Badge className="bg-green-100 text-green-700">Available</Badge>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-slate-900">
                  {dashboardData.availableAssets}
                </h3>
                <p className="text-sm font-medium text-slate-600">
                  Assets Ready
                </p>
                <p className="text-xs text-slate-500">
                  Out of {dashboardData.totalAssets} total
                </p>
              </div>
            </CardContent>
          </Card>

          {/* My Requests */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <Badge className="bg-blue-100 text-blue-700">Requests</Badge>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-slate-900">
                  {dashboardData.myRequests}
                </h3>
                <p className="text-sm font-medium text-slate-600">
                  My Requests
                </p>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="w-full mt-2"
                >
                  <Link href="/requests">View All →</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pending Requests */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <Badge className="bg-orange-100 text-orange-700">Pending</Badge>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-slate-900">
                  {dashboardData.pendingRequests}
                </h3>
                <p className="text-sm font-medium text-slate-600">
                  Awaiting Approval
                </p>
                <p className="text-xs text-slate-500">
                  {dashboardData.approvedRequests} approved
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Consumables */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-purple-600" />
                </div>
                <Badge className="bg-purple-100 text-purple-700">Stock</Badge>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-slate-900">
                  {dashboardData.totalConsumables}
                </h3>
                <p className="text-sm font-medium text-slate-600">
                  Consumables
                </p>
                <p className="text-xs text-slate-500">
                  {dashboardData.inStockConsumables} in stock
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Request Status Progress */}
        {dashboardData.myRequests > 0 && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Request Status Summary
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Pending
                    </span>
                    <span className="text-lg font-bold text-orange-700">
                      {dashboardData.pendingRequests}
                    </span>
                  </div>
                  <Progress
                    value={
                      dashboardData.myRequests > 0
                        ? (dashboardData.pendingRequests /
                            dashboardData.myRequests) *
                          100
                        : 0
                    }
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Approved
                    </span>
                    <span className="text-lg font-bold text-green-700">
                      {dashboardData.approvedRequests}
                    </span>
                  </div>
                  <Progress
                    value={
                      dashboardData.myRequests > 0
                        ? (dashboardData.approvedRequests /
                            dashboardData.myRequests) *
                          100
                        : 0
                    }
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Fulfilled
                    </span>
                    <span className="text-lg font-bold text-blue-700">
                      {dashboardData.fulfilledRequests}
                    </span>
                  </div>
                  <Progress
                    value={
                      dashboardData.myRequests > 0
                        ? (dashboardData.fulfilledRequests /
                            dashboardData.myRequests) *
                          100
                        : 0
                    }
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Rejected
                    </span>
                    <span className="text-lg font-bold text-red-700">
                      {dashboardData.rejectedRequests}
                    </span>
                  </div>
                  <Progress
                    value={
                      dashboardData.myRequests > 0
                        ? (dashboardData.rejectedRequests /
                            dashboardData.myRequests) *
                          100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Quick Actions
                </CardTitle>
              </div>
              <CardDescription className="text-slate-600">
                Common tasks you can perform
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  asChild
                  className="h-24 flex-col bg-blue-600 hover:bg-blue-700"
                >
                  <Link href="/requests/new">
                    <Send className="w-6 h-6 mb-2" />
                    <span>Request Asset</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-24 flex-col border-slate-300 hover:bg-slate-50"
                >
                  <Link href="/assets">
                    <Search className="w-6 h-6 mb-2" />
                    <span>Browse Assets</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-24 flex-col border-slate-300 hover:bg-slate-50"
                >
                  <Link href="/consumables">
                    <ShoppingCart className="w-6 h-6 mb-2" />
                    <span>View Stock</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-24 flex-col border-slate-300 hover:bg-slate-50"
                >
                  <Link href="/requests">
                    <Eye className="w-6 h-6 mb-2" />
                    <span>My Requests</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Recent Requests
                </CardTitle>
              </div>
              <CardDescription className="text-slate-600">
                Your latest request activity
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {dashboardData.recentRequests.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recentRequests.map((request) => (
                    <div
                      key={request.$id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="font-medium text-sm text-slate-800 truncate">
                          {request.assetNames || "Asset Request"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(request.$createdAt)} • {request.itemCount}{" "}
                          item{request.itemCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <Badge
                        className={`${getStatusBadgeColor(
                          request.status
                        )} flex items-center space-x-1`}
                      >
                        {getStatusIcon(request.status)}
                        <span>{request.status}</span>
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="p-3 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Activity className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium mb-1">
                    No recent requests
                  </p>
                  <p className="text-slate-500 text-sm">
                    Your request activity will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recently Added Assets */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Recently Added Assets
                </CardTitle>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/assets">View All →</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {dashboardData.recentAssets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.recentAssets.map((asset) => (
                  <Link
                    key={asset.$id}
                    href={`/assets/${asset.$id}`}
                    className="block"
                  >
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <Badge className="bg-green-100 text-green-700">
                          Available
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-slate-800 mb-1 truncate group-hover:text-blue-600 transition-colors">
                        {asset.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {asset.category
                          ?.replace(/_/g, " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 font-medium mb-1">
                  No assets available
                </p>
                <p className="text-slate-500 text-sm">
                  New assets will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
