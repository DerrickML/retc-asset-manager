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
} from "lucide-react";
import { getCurrentStaff } from "../../lib/utils/auth.js";
import {
  assetsService,
  assetRequestsService,
  staffService,
} from "../../lib/appwrite/provider.js";

export default function DashboardPage() {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalAssets: 0,
    availableAssets: 0,
    myRequests: 0,
    pendingRequests: 0,
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

      const requestsResponse = await assetRequestsService.list();
      const requests = requestsResponse.documents || [];

      const myRequests = requests.filter(
        (request) => request.staffId === currentStaff.$id
      );

      const totalAssets = assets.length;
      const availableAssets = assets.filter(
        (asset) => asset.availableStatus === "AVAILABLE"
      ).length;
      const myRequestsCount = myRequests.length;
      const pendingRequests = myRequests.filter(
        (request) => request.status === "PENDING"
      ).length;

      const recentRequests = myRequests
        .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt))
        .slice(0, 5);

      const recentAssets = assets
        .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt))
        .slice(0, 5);

      setDashboardData({
        totalAssets,
        availableAssets,
        myRequests: myRequestsCount,
        pendingRequests,
        recentRequests,
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
            <Button
              onClick={loadDashboardData}
              variant="outline"
              className="bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="text-center py-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-blue-700 mb-1">
                {dashboardData.totalAssets}
              </div>
              <div className="text-blue-600 font-semibold">Total Assets</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="text-center py-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-green-700 mb-1">
                {dashboardData.availableAssets}
              </div>
              <div className="text-green-600 font-semibold">Available</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="text-center py-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-purple-700 mb-1">
                {dashboardData.myRequests}
              </div>
              <div className="text-purple-600 font-semibold">My Requests</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="text-center py-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-orange-700 mb-1">
                {dashboardData.pendingRequests}
              </div>
              <div className="text-orange-600 font-semibold">Pending</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center text-gray-900 text-xl font-bold">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mr-3">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                Quick Actions
              </CardTitle>
              <CardDescription className="text-gray-600 text-base">
                Common tasks you can perform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/requests/new">
                <Button className="w-full justify-start h-14 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group rounded-xl font-semibold text-base">
                  <div className="p-2 bg-white/20 rounded-lg mr-4 group-hover:bg-white/30 transition-colors duration-300">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Request New Asset</div>
                    <div className="text-sm opacity-90">
                      Submit a new request
                    </div>
                  </div>
                  <div className="ml-auto group-hover:translate-x-1 transition-transform duration-300">
                    →
                  </div>
                </Button>
              </Link>

              <Link href="/assets">
                <Button className="w-full justify-start h-14 bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-700 hover:from-emerald-600 hover:via-emerald-700 hover:to-green-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group rounded-xl font-semibold text-base">
                  <div className="p-2 bg-white/20 rounded-lg mr-4 group-hover:bg-white/30 transition-colors duration-300">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Browse Assets</div>
                    <div className="text-sm opacity-90">
                      View available assets
                    </div>
                  </div>
                  <div className="ml-auto group-hover:translate-x-1 transition-transform duration-300">
                    →
                  </div>
                </Button>
              </Link>

              <Link href="/requests">
                <Button className="w-full justify-start h-14 bg-gradient-to-r from-purple-500 via-purple-600 to-violet-700 hover:from-purple-600 hover:via-purple-700 hover:to-violet-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group rounded-xl font-semibold text-base">
                  <div className="p-2 bg-white/20 rounded-lg mr-4 group-hover:bg-white/30 transition-colors duration-300">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">View My Requests</div>
                    <div className="text-sm opacity-90">
                      Check request status
                    </div>
                  </div>
                  <div className="ml-auto group-hover:translate-x-1 transition-transform duration-300">
                    →
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest requests and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.recentRequests.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recentRequests.map((request) => (
                    <div
                      key={request.$id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {request.assetName || "Asset Request"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(request.$createdAt)}
                        </p>
                      </div>
                      <Badge className={getStatusBadgeColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No recent requests</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
