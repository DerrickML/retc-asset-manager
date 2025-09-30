"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import { Button } from "../../../components/ui/button";
import { Progress } from "../../../components/ui/progress";
import { Badge } from "../../../components/ui/badge";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import {
  Download,
  Users,
  Package,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
  FileText,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart,
  Shield,
  Zap,
  Target,
  Briefcase,
  Settings,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Pause,
  Archive,
} from "lucide-react";
import { getCurrentStaff, permissions } from "../../../lib/utils/auth.js";
import {
  assetsService,
  assetRequestsService,
  staffService,
  departmentsService,
  assetEventsService,
} from "../../../lib/appwrite/provider.js";
import { ENUMS } from "../../../lib/appwrite/config.js";
import { Query } from "appwrite";

export default function AdminDashboard() {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Real data from database
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      totalAssets: 0,
      availableAssets: 0,
      inUseAssets: 0,
      maintenanceAssets: 0,
      retiredAssets: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      fulfilledRequests: 0,
      totalStaff: 0,
      totalDepartments: 0,
    },
    assetsByCategory: [],
    assetsByDepartment: [],
    assetsByStatus: [],
    requestsByStatus: [],
    recentEvents: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Check admin permissions first
      const currentStaff = await getCurrentStaff();
      if (!currentStaff || !permissions.isAdmin(currentStaff)) {
        window.location.href = "/unauthorized";
        return;
      }
      setStaff(currentStaff);

      // Load all real data from Appwrite in parallel
      const [
        assetsResult,
        requestsResult,
        staffResult,
        departmentsResult,
        recentEventsResult,
      ] = await Promise.all([
        assetsService.list(),
        assetRequestsService.list(),
        staffService.list(),
        departmentsService.list(),
        assetEventsService.list([Query.orderDesc("at"), Query.limit(10)]),
      ]);

      const assets = assetsResult.documents;
      const requests = requestsResult.documents;
      const allStaff = staffResult.documents;
      const departments = departmentsResult.documents;
      const events = recentEventsResult.documents;

      // Calculate real metrics from actual data
      const metrics = {
        totalAssets: assets.length,
        availableAssets: assets.filter(
          (a) => a.availableStatus === ENUMS.AVAILABLE_STATUS.AVAILABLE
        ).length,
        inUseAssets: assets.filter(
          (a) => a.availableStatus === ENUMS.AVAILABLE_STATUS.IN_USE
        ).length,
        maintenanceAssets: assets.filter(
          (a) =>
            a.availableStatus === ENUMS.AVAILABLE_STATUS.MAINTENANCE ||
            a.availableStatus === ENUMS.AVAILABLE_STATUS.REPAIR_REQUIRED
        ).length,
        retiredAssets: assets.filter(
          (a) =>
            a.availableStatus === ENUMS.AVAILABLE_STATUS.RETIRED ||
            a.availableStatus === ENUMS.AVAILABLE_STATUS.DISPOSED
        ).length,
        pendingRequests: requests.filter(
          (r) => r.status === ENUMS.REQUEST_STATUS.PENDING
        ).length,
        approvedRequests: requests.filter(
          (r) => r.status === ENUMS.REQUEST_STATUS.APPROVED
        ).length,
        fulfilledRequests: requests.filter(
          (r) => r.status === ENUMS.REQUEST_STATUS.FULFILLED
        ).length,
        totalStaff: allStaff.length,
        totalDepartments: departments.length,
      };

      // Process assets by category (real data)
      const categoryMap = {};
      assets.forEach((asset) => {
        const category = asset.category || "UNCATEGORIZED";
        categoryMap[category] = (categoryMap[category] || 0) + 1;
      });

      const assetsByCategory = Object.entries(categoryMap).map(
        ([category, count]) => ({
          name: category
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          value: count,
          percentage:
            assets.length > 0 ? ((count / assets.length) * 100).toFixed(1) : 0,
        })
      );

      // Process assets by status (real data)
      const statusMap = {};
      Object.values(ENUMS.AVAILABLE_STATUS).forEach((status) => {
        statusMap[status] = assets.filter(
          (a) => a.availableStatus === status
        ).length;
      });

      const assetsByStatus = Object.entries(statusMap)
        .filter(([status, count]) => count > 0)
        .map(([status, count]) => ({
          name: status
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          value: count,
          percentage:
            assets.length > 0 ? ((count / assets.length) * 100).toFixed(1) : 0,
          status: status,
        }));

      // Process requests by status (real data)
      const requestStatusMap = {};
      Object.values(ENUMS.REQUEST_STATUS).forEach((status) => {
        requestStatusMap[status] = requests.filter(
          (r) => r.status === status
        ).length;
      });

      const requestsByStatus = Object.entries(requestStatusMap)
        .filter(([status, count]) => count > 0)
        .map(([status, count]) => ({
          name: status
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          value: count,
          percentage:
            requests.length > 0
              ? ((count / requests.length) * 100).toFixed(1)
              : 0,
          status: status,
        }));

      // Process assets by department (real data)
      const deptAssetsMap = {};
      departments.forEach((dept) => {
        const deptAssets = assets.filter((a) => a.departmentId === dept.$id);
        if (deptAssets.length > 0) {
          deptAssetsMap[dept.name] = {
            total: deptAssets.length,
            available: deptAssets.filter(
              (a) => a.availableStatus === ENUMS.AVAILABLE_STATUS.AVAILABLE
            ).length,
            inUse: deptAssets.filter(
              (a) => a.availableStatus === ENUMS.AVAILABLE_STATUS.IN_USE
            ).length,
            utilization:
              deptAssets.length > 0
                ? (
                    (deptAssets.filter(
                      (a) => a.availableStatus === ENUMS.AVAILABLE_STATUS.IN_USE
                    ).length /
                      deptAssets.length) *
                    100
                  ).toFixed(1)
                : 0,
          };
        }
      });

      const assetsByDepartment = Object.entries(deptAssetsMap).map(
        ([deptName, data]) => ({
          name: deptName,
          ...data,
        })
      );

      setDashboardData({
        metrics,
        assetsByCategory,
        assetsByDepartment,
        assetsByStatus,
        requestsByStatus,
        recentEvents: events,
      });

      setLastUpdated(new Date());
    } catch (error) {
      // Silent fail for dashboard data loading
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  const exportData = async (type) => {
    try {
      let data = {};
      switch (type) {
        case "Assets":
          const assets = await assetsService.list();
          data = assets.documents;
          break;
        case "Requests":
          const requests = await assetRequestsService.list();
          data = requests.documents;
          break;
        case "Dashboard":
          data = dashboardData;
          break;
        default:
          data = dashboardData;
      }

      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type.toLowerCase()}_export_${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Export failed. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-primary-50 to-primary-100">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent absolute top-0 left-0"></div>
          </div>
          <div className="text-center">
            <p className="text-slate-700 font-medium">Loading Dashboard</p>
            <p className="text-slate-500 text-sm">Fetching real-time data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-primary-100/40">
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

      <div className="relative container mx-auto p-6 space-y-8 max-w-7xl">
        {/* Modern Header */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg shadow-blue-500/5 p-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <div>
                  {staff && (
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                      Welcome back, {staff.name}! 👋
                    </h1>
                  )}
                </div>
              </div>
              <p className="text-slate-600 font-medium">
                Real-time system analytics & insights
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
                onClick={handleRefresh}
                variant="outline"
                disabled={refreshing}
                className="relative bg-white/90 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 ease-out group overflow-hidden hover:scale-105 disabled:hover:scale-100 disabled:opacity-60"
              >
                <div className="flex items-center justify-center relative z-10">
                  <RefreshCw
                    className={`w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                  <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                    Refresh
                  </span>
                </div>
                {/* Ripple effect */}
                <div className="absolute inset-0 bg-gray-100/50 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              </Button>
              <Button
                onClick={() => exportData("Assets")}
                className="relative bg-gradient-to-r from-sidebar-500 to-sidebar-600 hover:from-sidebar-600 hover:to-sidebar-700 text-white border-0 shadow-lg hover:shadow-2xl transition-all duration-300 ease-out group overflow-hidden hover:scale-105"
              >
                <div className="flex items-center justify-center relative z-10">
                  <Download className="w-4 h-4 mr-2 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
                  <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                    Export Data
                  </span>
                </div>
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-sidebar-400 to-sidebar-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Ripple effect */}
                <div className="absolute inset-0 bg-white/20 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
                {/* Shimmer effect */}
                <div className="absolute inset-0 -top-1 -left-1 w-0 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:w-full transition-all duration-500 ease-out" />
              </Button>
              <Button
                onClick={() => exportData("Dashboard")}
                className="relative bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white border-0 shadow-lg hover:shadow-2xl transition-all duration-300 ease-out group overflow-hidden hover:scale-105"
              >
                <div className="flex items-center justify-center relative z-10">
                  <FileText className="w-4 h-4 mr-2 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
                  <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                    Generate Report
                  </span>
                </div>
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Ripple effect */}
                <div className="absolute inset-0 bg-white/20 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
                {/* Shimmer effect */}
                <div className="absolute inset-0 -top-1 -left-1 w-0 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:w-full transition-all duration-500 ease-out" />
              </Button>
            </div>
          </div>
        </div>

        {/* Modern Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {/* Total Assets Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
                  Total
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-bold text-slate-900">
                  {dashboardData.metrics.totalAssets}
                </h3>
                <p className="text-sm font-medium text-slate-600">
                  Total Assets
                </p>
                <p className="text-xs text-blue-600">
                  {dashboardData.metrics.availableAssets} available •{" "}
                  {dashboardData.metrics.inUseAssets} in use
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Available Assets Card */}
          <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0">
                  Ready
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-bold text-slate-900">
                  {dashboardData.metrics.availableAssets}
                </h3>
                <p className="text-sm font-medium text-slate-600">Available</p>
                <p className="text-xs text-green-600">Ready for deployment</p>
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
                  {dashboardData.metrics.pendingRequests}
                </h3>
                <p className="text-sm font-medium text-slate-600">Requests</p>
                <p className="text-xs text-orange-600">Awaiting approval</p>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Card */}
          <Card className="bg-gradient-to-br from-red-50 to-rose-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-0">
                  Alert
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-bold text-slate-900">
                  {dashboardData.metrics.maintenanceAssets}
                </h3>
                <p className="text-sm font-medium text-slate-600">
                  Maintenance
                </p>
                <p className="text-xs text-red-600">Needs attention</p>
              </div>
            </CardContent>
          </Card>

          {/* Staff & Departments Card */}
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0">
                  Team
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-bold text-slate-900">
                  {dashboardData.metrics.totalStaff}
                </h3>
                <p className="text-sm font-medium text-slate-600">Staff</p>
                <p className="text-xs text-purple-600">
                  {dashboardData.metrics.totalDepartments} departments
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modern Alert for pending requests */}
        {dashboardData.metrics.pendingRequests > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/50 rounded-2xl p-6 shadow-lg">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 mb-1">
                  Action Required
                </h3>
                <p className="text-orange-800 mb-3">
                  You have{" "}
                  <span className="font-bold text-orange-900">
                    {dashboardData.metrics.pendingRequests}
                  </span>{" "}
                  pending requests that require approval.
                </p>
                <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
                  Review Requests →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modern Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-8">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl p-2 relative overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-sidebar-500/5 rounded-2xl opacity-0 transition-opacity duration-500" />

            <TabsList className="grid w-full grid-cols-4 bg-transparent gap-1 relative z-10">
              <TabsTrigger
                value="overview"
                className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-500 data-[state=active]:to-primary-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 hover:bg-primary-50 hover:scale-105 hover:shadow-lg transition-all duration-300 ease-out rounded-xl font-medium group overflow-hidden"
              >
                <div className="flex items-center justify-center relative">
                  <PieChart className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300 data-[state=active]:text-white group-data-[state=active]:text-white text-primary-600 group-hover:text-primary-700" />
                  <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                    Overview
                  </span>
                </div>
                {/* Ripple effect */}
                <div className="absolute inset-0 bg-white/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              </TabsTrigger>

              <TabsTrigger
                value="assets"
                className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-sidebar-500 data-[state=active]:to-sidebar-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 hover:bg-sidebar-50 hover:scale-105 hover:shadow-lg transition-all duration-300 ease-out rounded-xl font-medium group overflow-hidden"
              >
                <div className="flex items-center justify-center relative">
                  <Package className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300 data-[state=active]:text-white group-data-[state=active]:text-white text-sidebar-600 group-hover:text-sidebar-700" />
                  <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                    Assets
                  </span>
                </div>
                {/* Ripple effect */}
                <div className="absolute inset-0 bg-white/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              </TabsTrigger>

              <TabsTrigger
                value="requests"
                className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-500 data-[state=active]:to-primary-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 hover:bg-primary-50 hover:scale-105 hover:shadow-lg transition-all duration-300 ease-out rounded-xl font-medium group overflow-hidden"
              >
                <div className="flex items-center justify-center relative">
                  <Clock className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300 data-[state=active]:text-white group-data-[state=active]:text-white text-primary-600 group-hover:text-primary-700" />
                  <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                    Requests
                  </span>
                </div>
                {/* Ripple effect */}
                <div className="absolute inset-0 bg-white/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              </TabsTrigger>

              <TabsTrigger
                value="activity"
                className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-sidebar-500 data-[state=active]:to-sidebar-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 hover:bg-sidebar-50 hover:scale-105 hover:shadow-lg transition-all duration-300 ease-out rounded-xl font-medium group overflow-hidden"
              >
                <div className="flex items-center justify-center relative">
                  <Activity className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300 data-[state=active]:text-white group-data-[state=active]:text-white text-sidebar-600 group-hover:text-sidebar-700" />
                  <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                    Activity
                  </span>
                </div>
                {/* Ripple effect */}
                <div className="absolute inset-0 bg-white/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Modern Asset Distribution by Category */}
              <Card className="bg-white/70 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                      <PieChart className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-900">
                        Asset Distribution by Category
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        Real data from your{" "}
                        <span className="font-medium text-blue-600">
                          {dashboardData.metrics.totalAssets}
                        </span>{" "}
                        assets
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.assetsByCategory.length > 0 ? (
                      dashboardData.assetsByCategory.map((category, index) => (
                        <div
                          key={category.name}
                          className="group p-4 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-slate-700">
                              {category.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">
                                {category.value}
                              </span>
                              <Badge className="bg-blue-100 text-blue-700 border-0 text-xs min-w-[50px]">
                                {category.percentage}%
                              </Badge>
                            </div>
                          </div>
                          <div className="relative">
                            <Progress
                              value={parseFloat(category.percentage)}
                              className="h-2 bg-slate-200"
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">
                          No assets found
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Modern Department Utilization */}
              <Card className="bg-white/70 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-lg">
                      <Briefcase className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-900">
                        Department Asset Utilization
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        Asset usage efficiency by department
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.assetsByDepartment.length > 0 ? (
                      dashboardData.assetsByDepartment.map((dept, index) => (
                        <div
                          key={dept.name}
                          className="group p-4 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 transition-all duration-200"
                        >
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center space-x-2">
                              <Target className="w-4 h-4 text-emerald-600" />
                              <span className="text-sm font-semibold text-slate-700">
                                {dept.name}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-slate-900">
                                {dept.inUse}/{dept.total}
                              </div>
                              <Badge
                                className={`text-xs border-0 ${
                                  parseFloat(dept.utilization) >= 80
                                    ? "bg-red-100 text-red-700"
                                    : parseFloat(dept.utilization) >= 60
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {dept.utilization}%
                              </Badge>
                            </div>
                          </div>
                          <div className="relative">
                            <Progress
                              value={parseFloat(dept.utilization)}
                              className="h-3 bg-slate-200"
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Briefcase className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">
                          No department assignments found
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Modern System Overview */}
            <Card className="bg-white/70 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      System Overview
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Current system status and utilization metrics
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 hover:from-green-100 hover:to-emerald-200 transition-all duration-200">
                    <div className="flex items-center justify-center mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                      <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                        Available
                      </Badge>
                    </div>
                    <div className="text-3xl font-bold text-green-700 mb-1">
                      {dashboardData.metrics.availableAssets}
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      {dashboardData.metrics.totalAssets > 0
                        ? (
                            (dashboardData.metrics.availableAssets /
                              dashboardData.metrics.totalAssets) *
                            100
                          ).toFixed(1)
                        : 0}
                      % of total
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200 transition-all duration-200">
                    <div className="flex items-center justify-center mb-2">
                      <Zap className="w-5 h-5 text-blue-600 mr-2" />
                      <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                        Active
                      </Badge>
                    </div>
                    <div className="text-3xl font-bold text-blue-700 mb-1">
                      {dashboardData.metrics.inUseAssets}
                    </div>
                    <div className="text-xs text-blue-600 font-medium">
                      {dashboardData.metrics.totalAssets > 0
                        ? (
                            (dashboardData.metrics.inUseAssets /
                              dashboardData.metrics.totalAssets) *
                            100
                          ).toFixed(1)
                        : 0}
                      % utilization
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-100 hover:from-orange-100 hover:to-amber-200 transition-all duration-200">
                    <div className="flex items-center justify-center mb-2">
                      <Settings className="w-5 h-5 text-orange-600 mr-2" />
                      <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">
                        Service
                      </Badge>
                    </div>
                    <div className="text-3xl font-bold text-orange-700 mb-1">
                      {dashboardData.metrics.maintenanceAssets}
                    </div>
                    <div className="text-xs text-orange-600 font-medium">
                      Offline assets
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-slate-50 to-gray-100 hover:from-slate-100 hover:to-gray-200 transition-all duration-200">
                    <div className="flex items-center justify-center mb-2">
                      <Archive className="w-5 h-5 text-slate-600 mr-2" />
                      <Badge className="bg-slate-100 text-slate-700 border-0 text-xs">
                        Retired
                      </Badge>
                    </div>
                    <div className="text-3xl font-bold text-slate-700 mb-1">
                      {dashboardData.metrics.retiredAssets}
                    </div>
                    <div className="text-xs text-slate-600 font-medium">
                      End of life
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Modern Assets Tab */}
          <TabsContent value="assets" className="space-y-8">
            <Card className="bg-white/70 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-lg">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      Asset Status Breakdown
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Detailed status distribution of all assets
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dashboardData.assetsByStatus.map((statusGroup, index) => {
                    const getStatusColor = (status) => {
                      switch (status) {
                        case "AVAILABLE":
                          return "from-green-50 to-emerald-100 border-green-200";
                        case "IN_USE":
                          return "from-blue-50 to-indigo-100 border-blue-200";
                        case "MAINTENANCE":
                        case "REPAIR_REQUIRED":
                          return "from-orange-50 to-amber-100 border-orange-200";
                        case "RETIRED":
                        case "DISPOSED":
                          return "from-slate-50 to-gray-100 border-slate-200";
                        default:
                          return "from-purple-50 to-violet-100 border-purple-200";
                      }
                    };

                    const getStatusIcon = (status) => {
                      switch (status) {
                        case "AVAILABLE":
                          return (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          );
                        case "IN_USE":
                          return <Zap className="w-5 h-5 text-blue-600" />;
                        case "MAINTENANCE":
                        case "REPAIR_REQUIRED":
                          return (
                            <Settings className="w-5 h-5 text-orange-600" />
                          );
                        case "RETIRED":
                        case "DISPOSED":
                          return <Archive className="w-5 h-5 text-slate-600" />;
                        default:
                          return (
                            <AlertCircle className="w-5 h-5 text-purple-600" />
                          );
                      }
                    };

                    return (
                      <div
                        key={statusGroup.name}
                        className={`p-6 bg-gradient-to-br ${getStatusColor(
                          statusGroup.status
                        )} rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300 group`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(statusGroup.status)}
                            <h4 className="font-semibold text-slate-800">
                              {statusGroup.name}
                            </h4>
                          </div>
                          <Badge className="bg-white/80 text-slate-700 border-0 font-medium">
                            {statusGroup.percentage}%
                          </Badge>
                        </div>
                        <div className="text-3xl font-bold text-slate-900 mb-3 group-hover:scale-105 transition-transform duration-200">
                          {statusGroup.value}
                        </div>
                        <Progress
                          value={parseFloat(statusGroup.percentage)}
                          className="h-2 bg-white/50"
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Modern Requests Tab */}
          <TabsContent value="requests" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/70 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg shadow-lg">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-900">
                        Request Status Summary
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        Current status of all asset requests
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.requestsByStatus.length > 0 ? (
                      dashboardData.requestsByStatus.map(
                        (statusGroup, index) => {
                          const getRequestStatusColor = (status) => {
                            switch (status) {
                              case "PENDING":
                                return "from-orange-50 to-amber-100 border-orange-200";
                              case "APPROVED":
                                return "from-green-50 to-emerald-100 border-green-200";
                              case "FULFILLED":
                                return "from-blue-50 to-indigo-100 border-blue-200";
                              case "REJECTED":
                                return "from-red-50 to-rose-100 border-red-200";
                              default:
                                return "from-slate-50 to-gray-100 border-slate-200";
                            }
                          };

                          const getRequestStatusIcon = (status) => {
                            switch (status) {
                              case "PENDING":
                                return (
                                  <Clock className="w-5 h-5 text-orange-600" />
                                );
                              case "APPROVED":
                                return (
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                );
                              case "FULFILLED":
                                return (
                                  <Zap className="w-5 h-5 text-blue-600" />
                                );
                              case "REJECTED":
                                return (
                                  <XCircle className="w-5 h-5 text-red-600" />
                                );
                              default:
                                return (
                                  <Pause className="w-5 h-5 text-slate-600" />
                                );
                            }
                          };

                          return (
                            <div
                              key={statusGroup.name}
                              className={`p-4 bg-gradient-to-r ${getRequestStatusColor(
                                statusGroup.status
                              )} rounded-xl border hover:shadow-md transition-all duration-200`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  {getRequestStatusIcon(statusGroup.status)}
                                  <div>
                                    <div className="font-semibold text-slate-800">
                                      {statusGroup.name}
                                    </div>
                                    <div className="text-sm text-slate-600">
                                      {statusGroup.percentage}% of total
                                    </div>
                                  </div>
                                </div>
                                <div className="text-2xl font-bold text-slate-900">
                                  {statusGroup.value}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )
                    ) : (
                      <div className="text-center py-12">
                        <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">
                          No requests found
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-lg">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-900">
                        Request Metrics
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        Key request processing metrics
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl border border-orange-200">
                      <div className="flex items-center justify-center mb-3">
                        <Clock className="w-6 h-6 text-orange-600 mr-2" />
                        <Badge className="bg-orange-100 text-orange-700 border-0">
                          Urgent
                        </Badge>
                      </div>
                      <div className="text-4xl font-bold text-orange-700 mb-2">
                        {dashboardData.metrics.pendingRequests}
                      </div>
                      <div className="text-sm font-medium text-orange-600">
                        Pending Approval
                      </div>
                      <div className="text-xs text-orange-500 mt-1">
                        Require immediate attention
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-700 mb-1">
                          {dashboardData.metrics.approvedRequests}
                        </div>
                        <div className="text-xs font-medium text-green-600">
                          Approved
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
                        <Zap className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-700 mb-1">
                          {dashboardData.metrics.fulfilledRequests}
                        </div>
                        <div className="text-xs font-medium text-blue-600">
                          Fulfilled
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Modern Activity Tab */}
          <TabsContent value="activity" className="space-y-8">
            <Card className="bg-white/70 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      Recent System Activity
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Latest events from the audit trail
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recentEvents.length > 0 ? (
                    dashboardData.recentEvents.map((event, index) => {
                      const getEventColor = (eventType) => {
                        if (eventType.includes("CREATE"))
                          return "from-green-50 to-emerald-100 border-green-200";
                        if (eventType.includes("UPDATE"))
                          return "from-blue-50 to-indigo-100 border-blue-200";
                        if (eventType.includes("DELETE"))
                          return "from-red-50 to-rose-100 border-red-200";
                        if (eventType.includes("ASSIGN"))
                          return "from-purple-50 to-violet-100 border-purple-200";
                        return "from-slate-50 to-gray-100 border-slate-200";
                      };

                      const getEventIcon = (eventType) => {
                        if (eventType.includes("CREATE"))
                          return (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          );
                        if (eventType.includes("UPDATE"))
                          return <Settings className="h-5 w-5 text-blue-600" />;
                        if (eventType.includes("DELETE"))
                          return <XCircle className="h-5 w-5 text-red-600" />;
                        if (eventType.includes("ASSIGN"))
                          return <Users className="h-5 w-5 text-purple-600" />;
                        return <Activity className="h-5 w-5 text-slate-600" />;
                      };

                      return (
                        <div
                          key={event.$id}
                          className={`p-4 bg-gradient-to-r ${getEventColor(
                            event.eventType
                          )} rounded-xl border hover:shadow-md transition-all duration-200 group`}
                        >
                          <div className="flex items-start space-x-4">
                            <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-200">
                              {getEventIcon(event.eventType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge className="bg-white/80 text-slate-700 border-0 text-xs font-medium">
                                  {event.eventType.replace(/_/g, " ")}
                                </Badge>
                                <span className="text-xs text-slate-500 font-medium">
                                  {new Date(event.at).toLocaleDateString()} •{" "}
                                  {new Date(event.at).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-slate-800 mb-1">
                                {event.fromValue && event.toValue
                                  ? `Changed from "${event.fromValue}" to "${event.toValue}"`
                                  : event.eventType
                                      .replace(/_/g, " ")
                                      .toLowerCase()}
                              </p>
                              {event.notes && (
                                <p className="text-xs text-slate-600 bg-white/50 rounded-lg px-3 py-2 mt-2">
                                  {event.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-16">
                      <div className="p-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                        <Activity className="h-12 w-12 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">
                        No Recent Activity
                      </h3>
                      <p className="text-slate-500">
                        System activity will appear here when events occur
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
