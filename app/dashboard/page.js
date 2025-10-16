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
import {
  Package,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
  FileText,
  RefreshCw,
  Calendar,
  BarChart3,
  Users,
  Settings,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShoppingCart,
} from "lucide-react";
import { getCurrentStaff } from "../../lib/utils/auth.js";
import {
  assetsService,
  assetRequestsService,
  staffService,
} from "../../lib/appwrite/provider.js";
import { Query } from "appwrite";

export default function DashboardPage() {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalAssets: 0,
    availableAssets: 0,
    myRequests: 0,
    pendingRequests: 0,
    totalConsumables: 0,
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
      const currentStaff = await getCurrentStaff();
      setStaff(currentStaff);

      if (!currentStaff) {
        setError("Not authenticated");
        return;
      }

      const assetsResponse = await assetsService.list();
      const assets = assetsResponse.documents || [];

      const requestsResponse = await assetRequestsService.list([
        Query.orderDesc("$createdAt"),
      ]);
      const requests = requestsResponse.documents || [];

      const myRequests = requests.filter(
        (request) => request.requesterStaffId === currentStaff.$id
      );

      // Filter assets and consumables
      const assetsOnly = assets.filter(
        (item) =>
          item.itemType === "ASSET" ||
          !item.itemType ||
          item.itemType === undefined
      );

      const consumablesOnly = assets.filter(
        (item) => item.itemType === "CONSUMABLE"
      );

      const totalAssets = assetsOnly.length;
      const availableAssets = assetsOnly.filter(
        (asset) => asset.availableStatus === "AVAILABLE"
      ).length;
      const myRequestsCount = myRequests.length;
      const pendingRequests = myRequests.filter(
        (request) => request.status === "PENDING"
      ).length;
      const totalConsumables = consumablesOnly.length;

      // Process recent requests with asset names
      const recentRequestsWithAssets = await Promise.all(
        myRequests
          .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt))
          .slice(0, 5)
          .map(async (request) => {
            try {
              // Get asset names for requested items
              const assetNames = await Promise.all(
                request.requestedItems.map(async (assetId) => {
                  try {
                    const asset = await assetsService.get(assetId);
                    return asset.name;
                  } catch (error) {
                    console.warn(`Failed to load asset ${assetId}:`, error);
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
              console.warn(`Failed to process request ${request.$id}:`, error);
              return {
                ...request,
                assetNames: "Unknown Assets",
                itemCount: request.requestedItems?.length || 0,
              };
            }
          })
      );

      const recentAssets = assets
        .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt))
        .slice(0, 5);

      setDashboardData({
        totalAssets,
        availableAssets,
        myRequests: myRequestsCount,
        pendingRequests,
        totalConsumables,
        recentRequests: recentRequestsWithAssets,
        recentAssets,
      });
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError(
        `Failed to load dashboard data: ${err.message || err.toString()}`
      );
    } finally {
      setLoading(false);
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
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadDashboardData} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-primary-50/30 to-primary-100/40 -mx-6 -my-6 px-6 py-6">
      <div>
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <div>
                  {staff && (
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                      {getTimeBasedGreeting()},
                      <span className="text-green-600">{staff.name}</span>! 👋
                    </h1>
                  )}
                </div>
              </div>
              <p className="text-gray-600 text-lg">
                Here's an overview of your asset management activities.
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={loadDashboardData}
                variant="outline"
                disabled={loading}
                className="bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                {loading ? "Refreshing..." : "Refresh Dashboard"}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {/* Total Assets Card */}
          <Card className="bg-gradient-to-br from-primary-500 to-primary-600 border-0 shadow-sm hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-500 ease-out group cursor-pointer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-400/10 to-primary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-white/20 rounded-lg shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out">
                  <Package className="h-4 w-4 text-white" />
                </div>
                <Badge className="bg-white/20 text-white hover:bg-white/30 border-0 text-xs px-2 py-1 group-hover:scale-105 transition-transform duration-300">
                  Total
                </Badge>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">
                  {dashboardData.totalAssets}
                </h3>
                <p className="text-sm font-medium text-white/90">
                  Total Assets
                </p>
                <p className="text-xs text-white/80">
                  {dashboardData.availableAssets} available
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Available Assets Card */}
          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 border-0 shadow-sm hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-500 ease-out group cursor-pointer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-white/20 rounded-lg shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
                <Badge className="bg-white/20 text-white hover:bg-white/30 border-0 text-xs px-2 py-1 group-hover:scale-105 transition-transform duration-300">
                  Ready
                </Badge>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">
                  {dashboardData.availableAssets}
                </h3>
                <p className="text-sm font-medium text-white/90">Available</p>
                <p className="text-xs text-white/80">Ready to deploy</p>
              </div>
            </CardContent>
          </Card>

          {/* My Requests Card */}
          <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 border-0 shadow-sm hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-500 ease-out group cursor-pointer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-white/20 rounded-lg shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <Badge className="bg-white/20 text-white hover:bg-white/30 border-0 text-xs px-2 py-1 group-hover:scale-105 transition-transform duration-300">
                  Requests
                </Badge>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">
                  {dashboardData.myRequests}
                </h3>
                <p className="text-sm font-medium text-white/90">My Requests</p>
                <p className="text-xs text-white/80">
                  {dashboardData.pendingRequests} pending
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pending Requests Card */}
          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 border-0 shadow-sm hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-500 ease-out group cursor-pointer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-white/20 rounded-lg shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <Badge className="bg-white/20 text-white hover:bg-white/30 border-0 text-xs px-2 py-1 group-hover:scale-105 transition-transform duration-300">
                  Pending
                </Badge>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">
                  {dashboardData.pendingRequests}
                </h3>
                <p className="text-sm font-medium text-white/90">Pending</p>
                <p className="text-xs text-white/80">Awaiting approval</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Consumables Card */}
          <Card className="bg-gradient-to-br from-cyan-500 to-blue-600 border-0 shadow-sm hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-500 ease-out group cursor-pointer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-white/20 rounded-lg shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out">
                  <ShoppingCart className="h-4 w-4 text-white" />
                </div>
                <Badge className="bg-white/20 text-white hover:bg-white/30 border-0 text-xs px-2 py-1 group-hover:scale-105 transition-transform duration-300">
                  Stock
                </Badge>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">
                  {dashboardData.totalConsumables}
                </h3>
                <p className="text-sm font-medium text-white/90">Consumables</p>
                <p className="text-xs text-white/80">Available items</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white rounded-2xl border border-gray-200/30 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center text-primary-800 text-xl font-bold">
                <div className="p-2 bg-gradient-to-br from-primary-500 to-sidebar-500 rounded-lg mr-3 group-hover:scale-110 transition-transform duration-300">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                Quick Actions
              </CardTitle>
              <CardDescription className="text-primary-600 text-base">
                Common tasks you can perform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Request New Asset */}
                <Link href="/requests/new">
                  <div className="group/action bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-white/20 rounded-lg group-hover/action:bg-white/30 transition-colors duration-300">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-white/80 group-hover/action:text-white transition-colors duration-300">
                        →
                      </div>
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-1">
                      Request Asset
                    </h3>
                    <p className="text-white/80 text-sm">
                      Submit a new request
                    </p>
                  </div>
                </Link>

                {/* Browse Assets */}
                <Link href="/assets">
                  <div className="group/action bg-gradient-to-br from-sidebar-500 to-sidebar-600 hover:from-sidebar-600 hover:to-sidebar-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-white/20 rounded-lg group-hover/action:bg-white/30 transition-colors duration-300">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-white/80 group-hover/action:text-white transition-colors duration-300">
                        →
                      </div>
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-1">
                      Browse Assets
                    </h3>
                    <p className="text-white/80 text-sm">
                      View available assets
                    </p>
                  </div>
                </Link>

                {/* Browse Consumables */}
                <Link href="/consumables">
                  <div className="group/action bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-white/20 rounded-lg group-hover/action:bg-white/30 transition-colors duration-300">
                        <ShoppingCart className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-white/80 group-hover/action:text-white transition-colors duration-300">
                        →
                      </div>
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-1">
                      Browse Consumables
                    </h3>
                    <p className="text-white/80 text-sm">View stock items</p>
                  </div>
                </Link>

                {/* View My Requests */}
                <Link href="/requests">
                  <div className="group/action bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-white/20 rounded-lg group-hover/action:bg-white/30 transition-colors duration-300">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-white/80 group-hover/action:text-white transition-colors duration-300">
                        →
                      </div>
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-1">
                      My Requests
                    </h3>
                    <p className="text-white/80 text-sm">
                      Check request status
                    </p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary-50 to-sidebar-50 rounded-2xl border border-primary-200/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-primary-800">
                <div className="p-2 bg-gradient-to-br from-primary-500 to-sidebar-500 rounded-lg mr-3 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                Recent Activity
              </CardTitle>
              <CardDescription className="text-primary-600">
                Your latest requests and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.recentRequests.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recentRequests.map((request) => (
                    <div
                      key={request.$id}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-white to-primary-50/50 rounded-lg border border-primary-100/50 hover:border-primary-200/50 hover:shadow-md transition-all duration-300 group/item"
                    >
                      <div>
                        <p className="font-medium text-sm text-primary-800 group-hover/item:text-primary-700">
                          {request.assetNames || "Asset Request"}
                        </p>
                        <p className="text-xs text-primary-600 group-hover/item:text-primary-500">
                          {formatDate(request.$createdAt)} • {request.itemCount}{" "}
                          item{request.itemCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <Badge
                        className={`${getStatusBadgeColor(
                          request.status
                        )} group-hover/item:scale-105 transition-transform duration-300`}
                      >
                        {request.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="p-3 bg-primary-100/50 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-primary-500" />
                  </div>
                  <p className="text-primary-600 text-sm font-medium">
                    No recent requests
                  </p>
                  <p className="text-primary-500 text-xs mt-1">
                    Your activity will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
