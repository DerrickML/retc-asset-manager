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
  CheckCircle,
  AlertTriangle,
  Plus,
  FileText,
  TrendingUp,
  Calendar,
  Zap,
  Target,
  Users,
  BookOpen,
  Sparkles,
  ArrowRight,
  Activity,
  Shield,
  Star,
  RefreshCw,
} from "lucide-react";
import {
  assetsService,
  assetRequestsService,
  staffService,
} from "../../lib/appwrite/provider.js";
import { getCurrentStaff } from "../../lib/utils/auth.js";
import { ENUMS } from "../../lib/appwrite/config.js";
import { formatCategory } from "../../lib/utils/mappings.js";

export default function Dashboard() {
  const [staff, setStaff] = useState(null);
  const [stats, setStats] = useState({
    totalAssets: 0,
    myAssets: 0,
    pendingRequests: 0,
    approvedRequests: 0,
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [myAssets, setMyAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get current staff member
      const currentStaff = await getCurrentStaff();

      if (!currentStaff) {
        setLoading(false);
        return;
      }

      setStaff(currentStaff);

      // Load dashboard data
      const [allAssetsResult, myRequestsResult, staffAssetsResult] =
        await Promise.all([
          assetsService.list(),
          assetRequestsService.getByStaff(currentStaff.$id),
          assetsService.getByStaff(currentStaff.$id),
        ]);

      // Extract document arrays from service responses
      const allAssets = allAssetsResult.documents || [];
      const myRequests = myRequestsResult.documents || [];
      const staffAssets = staffAssetsResult.documents || [];

      // Calculate stats
      const pendingRequests = myRequests.filter(
        (r) => r.status === ENUMS.REQUEST_STATUS.PENDING
      ).length;
      const approvedRequests = myRequests.filter(
        (r) => r.status === ENUMS.REQUEST_STATUS.APPROVED
      ).length;

      setStats({
        totalAssets: allAssetsResult.total || allAssets.length,
        myAssets: staffAssetsResult.total || staffAssets.length,
        pendingRequests,
        approvedRequests,
      });

      // Set recent requests (last 5)
      const sortedRequests = myRequests.sort(
        (a, b) => new Date(b.$createdAt) - new Date(a.$createdAt)
      );
      setRecentRequests(sortedRequests.slice(0, 5));

      // Set my assets (last 5)
      const sortedAssets = staffAssets.sort(
        (a, b) => new Date(b.$updatedAt) - new Date(a.$updatedAt)
      );
      setMyAssets(sortedAssets.slice(0, 5));
    } catch (error) {
      // Silent fail for dashboard data loading
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case ENUMS.REQUEST_STATUS.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case ENUMS.REQUEST_STATUS.APPROVED:
        return "bg-green-100 text-green-800";
      case ENUMS.REQUEST_STATUS.DENIED:
        return "bg-red-100 text-red-800";
      case ENUMS.REQUEST_STATUS.FULFILLED:
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAvailabilityColor = (status) => {
    switch (status) {
      case ENUMS.AVAILABLE_STATUS.AVAILABLE:
        return "bg-green-100 text-green-800";
      case ENUMS.AVAILABLE_STATUS.IN_USE:
        return "bg-blue-100 text-blue-800";
      case ENUMS.AVAILABLE_STATUS.MAINTENANCE:
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent absolute top-0 left-0"></div>
          </div>
          <div className="text-center">
            <p className="text-slate-700 font-medium">Loading Dashboard</p>
            <p className="text-slate-500 text-sm">
              Preparing your workspace...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if no staff found
  if (!staff) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.3'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        ></div>
      </div>

      <div className="relative container mx-auto p-6 space-y-8">
        {/* Modern Header */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg shadow-blue-500/5 p-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                    Welcome Back
                  </h1>
                  <p className="text-slate-600 font-medium">{staff?.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <div className="flex items-center space-x-1 ml-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Online</span>
                </div>
              </div>
            </div>

            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Link href="/requests/new">
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Link>
            </Button>
          </div>
        </div>

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Assets Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
                  Available
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-bold text-slate-900">
                  {stats.totalAssets}
                </h3>
                <p className="text-sm font-medium text-slate-600">
                  Total Assets
                </p>
                <p className="text-xs text-blue-600">Available in system</p>
              </div>
            </CardContent>
          </Card>

          {/* My Assets Card */}
          <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0">
                  Mine
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-bold text-slate-900">
                  {stats.myAssets}
                </h3>
                <p className="text-sm font-medium text-slate-600">My Assets</p>
                <p className="text-xs text-green-600">
                  Currently assigned to me
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pending Requests Card */}
          <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-0">
                  Pending
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-bold text-slate-900">
                  {stats.pendingRequests}
                </h3>
                <p className="text-sm font-medium text-slate-600">Pending</p>
                <p className="text-xs text-orange-600">Awaiting approval</p>
              </div>
            </CardContent>
          </Card>

          {/* Approved Requests Card */}
          <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0">
                  Ready
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-bold text-slate-900">
                  {stats.approvedRequests}
                </h3>
                <p className="text-sm font-medium text-slate-600">Approved</p>
                <p className="text-xs text-purple-600">Ready for pickup</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modern Quick Actions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Requests */}
          <Card className="bg-white/70 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    Recent Requests
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Your latest asset requests
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentRequests.length > 0 ? (
                recentRequests.map((request) => {
                  const getModernStatusColor = (status) => {
                    switch (status) {
                      case ENUMS.REQUEST_STATUS.PENDING:
                        return "bg-gradient-to-r from-orange-50 to-amber-100 border-orange-200";
                      case ENUMS.REQUEST_STATUS.APPROVED:
                        return "bg-gradient-to-r from-green-50 to-emerald-100 border-green-200";
                      case ENUMS.REQUEST_STATUS.DENIED:
                        return "bg-gradient-to-r from-red-50 to-rose-100 border-red-200";
                      case ENUMS.REQUEST_STATUS.FULFILLED:
                        return "bg-gradient-to-r from-blue-50 to-indigo-100 border-blue-200";
                      default:
                        return "bg-gradient-to-r from-slate-50 to-gray-100 border-slate-200";
                    }
                  };

                  const getStatusIcon = (status) => {
                    switch (status) {
                      case ENUMS.REQUEST_STATUS.PENDING:
                        return <Clock className="w-4 h-4 text-orange-600" />;
                      case ENUMS.REQUEST_STATUS.APPROVED:
                        return (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        );
                      case ENUMS.REQUEST_STATUS.DENIED:
                        return (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        );
                      case ENUMS.REQUEST_STATUS.FULFILLED:
                        return <Zap className="w-4 h-4 text-blue-600" />;
                      default:
                        return <Activity className="w-4 h-4 text-slate-600" />;
                    }
                  };

                  return (
                    <div
                      key={request.$id}
                      className={`p-4 ${getModernStatusColor(
                        request.status
                      )} rounded-xl border hover:shadow-md transition-all duration-200 group`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-200">
                            {getStatusIcon(request.status)}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-slate-800">
                              {request.assetName || "Asset Request"}
                            </p>
                            <p className="text-xs text-slate-600">
                              {new Date(
                                request.$createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-white/80 text-slate-700 border-0 font-medium">
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <div className="p-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 font-medium">
                    No recent requests
                  </p>
                </div>
              )}
              <Button
                asChild
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Link href="/requests">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  View All Requests
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* My Assets */}
          <Card className="bg-white/70 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-lg">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    My Assets
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Assets currently assigned to you
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {myAssets.length > 0 ? (
                myAssets.map((asset) => {
                  const getModernAvailabilityColor = (status) => {
                    switch (status) {
                      case ENUMS.AVAILABLE_STATUS.AVAILABLE:
                        return "bg-gradient-to-r from-green-50 to-emerald-100 border-green-200";
                      case ENUMS.AVAILABLE_STATUS.IN_USE:
                        return "bg-gradient-to-r from-blue-50 to-indigo-100 border-blue-200";
                      case ENUMS.AVAILABLE_STATUS.MAINTENANCE:
                        return "bg-gradient-to-r from-orange-50 to-amber-100 border-orange-200";
                      default:
                        return "bg-gradient-to-r from-slate-50 to-gray-100 border-slate-200";
                    }
                  };

                  const getAssetIcon = (status) => {
                    switch (status) {
                      case ENUMS.AVAILABLE_STATUS.AVAILABLE:
                        return (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        );
                      case ENUMS.AVAILABLE_STATUS.IN_USE:
                        return <Zap className="w-4 h-4 text-blue-600" />;
                      case ENUMS.AVAILABLE_STATUS.MAINTENANCE:
                        return (
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                        );
                      default:
                        return <Package className="w-4 h-4 text-slate-600" />;
                    }
                  };

                  return (
                    <div
                      key={asset.$id}
                      className={`p-4 ${getModernAvailabilityColor(
                        asset.availableStatus
                      )} rounded-xl border hover:shadow-md transition-all duration-200 group`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-200">
                            {getAssetIcon(asset.availableStatus)}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-slate-800">
                              {asset.name}
                            </p>
                            <p className="text-xs text-slate-600">
                              {formatCategory(asset.category)}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-white/80 text-slate-700 border-0 font-medium">
                          {asset.availableStatus ===
                          ENUMS.AVAILABLE_STATUS.IN_USE
                            ? "In Use"
                            : asset.availableStatus}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <div className="p-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Package className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 font-medium">
                    No assets currently assigned
                  </p>
                </div>
              )}
              <Button
                asChild
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Link href="/assets">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Browse Assets
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Modern Quick Links */}
        <Card className="bg-white/70 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg shadow-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Common tasks and shortcuts
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                asChild
                className="h-24 flex-col bg-gradient-to-br from-blue-100 to-indigo-200 hover:from-blue-200 hover:to-indigo-300 border border-blue-300 text-slate-800 hover:text-slate-900 shadow-lg hover:shadow-xl transition-all duration-200 group"
              >
                <Link href="/assets">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300 mb-2">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium">Browse Assets</span>
                </Link>
              </Button>

              <Button
                asChild
                className="h-24 flex-col bg-gradient-to-br from-emerald-100 to-green-200 hover:from-emerald-200 hover:to-green-300 border border-emerald-300 text-slate-800 hover:text-slate-900 shadow-lg hover:shadow-xl transition-all duration-200 group"
              >
                <Link href="/requests/new">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300 mb-2">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium">New Request</span>
                </Link>
              </Button>

              <Button
                asChild
                className="h-24 flex-col bg-gradient-to-br from-amber-100 to-orange-200 hover:from-amber-200 hover:to-orange-300 border border-amber-300 text-slate-800 hover:text-slate-900 shadow-lg hover:shadow-xl transition-all duration-200 group"
              >
                <Link href="/requests">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300 mb-2">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium">My Requests</span>
                </Link>
              </Button>

              <Button
                asChild
                className="h-24 flex-col bg-gradient-to-br from-purple-100 to-violet-200 hover:from-purple-200 hover:to-violet-300 border border-purple-300 text-slate-800 hover:text-slate-900 shadow-lg hover:shadow-xl transition-all duration-200 group"
              >
                <Link href="/guest">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300 mb-2">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium">Guest Portal</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
