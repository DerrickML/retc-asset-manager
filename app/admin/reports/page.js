"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import {
  BarChart3,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  AlertTriangle,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Filter,
  ShoppingCart,
} from "lucide-react";
import { getCurrentStaff, permissions } from "../../../lib/utils/auth.js";
import {
  assetsService,
  assetRequestsService,
  staffService,
} from "../../../lib/appwrite/provider.js";
import { ENUMS } from "../../../lib/appwrite/config.js";
import {
  formatCategory,
  getStatusBadgeColor,
  getConditionBadgeColor,
  getConsumableStatus,
  getCurrentStock,
  getMinStock,
  getMaxStock,
  getConsumableUnit,
} from "../../../lib/utils/mappings.js";

export default function AdminReports() {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    assets: [],
    requests: [],
    users: [],
  });
  const [analytics, setAnalytics] = useState({
    totalAssets: 0,
    totalRequests: 0,
    totalUsers: 0,
    assetsByCategory: {},
    assetsByCondition: {},
    assetsByStatus: {},
    requestsByStatus: {},
    requestsByMonth: {},
    topRequesters: [],
    mostRequestedAssets: [],
    totalAssetValue: 0,
    avgRequestDuration: 0,
  });

  // Filters
  const [dateRange, setDateRange] = useState("last30");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    checkPermissionsAndLoadData();
  }, []);

  useEffect(() => {
    if (reportData.assets.length > 0 || reportData.requests.length > 0) {
      calculateAnalytics();
    }
  }, [reportData, dateRange, categoryFilter, statusFilter]);

  const checkPermissionsAndLoadData = async () => {
    try {
      const currentStaff = await getCurrentStaff();
      if (!currentStaff || !permissions.canViewReports(currentStaff)) {
        window.location.href = "/unauthorized";
        return;
      }
      setStaff(currentStaff);
      await loadReportData();
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadReportData = async () => {
    try {
      const [assetsResult, requestsResult, usersResult] = await Promise.all([
        assetsService.list(),
        assetRequestsService.list(),
        staffService.list(),
      ]);

      setReportData({
        assets: assetsResult.documents || [],
        requests: requestsResult.documents || [],
        users: usersResult.documents || [],
      });
    } catch (error) {
      console.error("Failed to load report data:", error);
    }
  };

  const calculateAnalytics = () => {
    const { assets, requests, users } = reportData;

    // Filter data based on selected filters
    let filteredAssets = assets;
    let filteredRequests = requests;

    if (categoryFilter !== "all") {
      filteredAssets = assets.filter(
        (asset) => asset.category === categoryFilter
      );
    }

    if (statusFilter !== "all") {
      filteredAssets = assets.filter(
        (asset) => asset.availableStatus === statusFilter
      );
    }

    // Date range filtering for requests
    const now = new Date();
    let dateThreshold;
    switch (dateRange) {
      case "last7":
        dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "last30":
        dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "last90":
        dateThreshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "last365":
        dateThreshold = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateThreshold = new Date(0);
    }

    if (dateRange !== "all") {
      filteredRequests = requests.filter(
        (request) => new Date(request.$createdAt) >= dateThreshold
      );
    }

    // Separate assets and consumables
    const actualAssets = filteredAssets.filter(
      (item) =>
        item.itemType === "ASSET" ||
        !item.itemType ||
        item.itemType === undefined
    );
    const consumables = filteredAssets.filter(
      (item) => item.itemType === "CONSUMABLE"
    );

    // Calculate metrics
    const assetsByCategory = {};
    const assetsByCondition = {};
    const assetsByStatus = {};
    let totalValue = 0;

    // Process only actual assets for asset-specific metrics
    actualAssets.forEach((asset) => {
      // Category distribution
      assetsByCategory[asset.category] =
        (assetsByCategory[asset.category] || 0) + 1;

      // Condition distribution
      assetsByCondition[asset.currentCondition] =
        (assetsByCondition[asset.currentCondition] || 0) + 1;

      // Status distribution
      assetsByStatus[asset.availableStatus] =
        (assetsByStatus[asset.availableStatus] || 0) + 1;

      // Total value
      totalValue += asset.currentValue || 0;
    });

    // Add consumables to category distribution
    consumables.forEach((consumable) => {
      assetsByCategory[consumable.category] =
        (assetsByCategory[consumable.category] || 0) + 1;
    });

    // Request analytics
    const requestsByStatus = {};
    const requestsByMonth = {};
    const requesterCounts = {};
    const assetRequestCounts = {};
    let totalDuration = 0;
    let requestsWithDuration = 0;

    filteredRequests.forEach((request) => {
      // Status distribution
      requestsByStatus[request.status] =
        (requestsByStatus[request.status] || 0) + 1;

      // Monthly distribution
      const month = new Date(request.$createdAt).toISOString().slice(0, 7);
      requestsByMonth[month] = (requestsByMonth[month] || 0) + 1;

      // Top requesters
      const requesterId = request.requesterStaffId;
      requesterCounts[requesterId] = (requesterCounts[requesterId] || 0) + 1;

      // Most requested assets
      if (request.requestedItems && Array.isArray(request.requestedItems)) {
        request.requestedItems.forEach((assetId) => {
          assetRequestCounts[assetId] = (assetRequestCounts[assetId] || 0) + 1;
        });
      }

      // Average duration
      if (request.issueDate && request.expectedReturnDate) {
        const duration =
          (new Date(request.expectedReturnDate) - new Date(request.issueDate)) /
          (1000 * 60 * 60 * 24);
        totalDuration += duration;
        requestsWithDuration++;
      }
    });

    // Top requesters (need to map to user names)
    const topRequesters = Object.entries(requesterCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([userId, count]) => {
        const user = users.find((u) => u.$id === userId);
        return {
          name: user?.name || "Unknown User",
          count,
          email: user?.email || "",
        };
      });

    // Most requested assets
    const mostRequestedAssets = Object.entries(assetRequestCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([assetId, count]) => {
        const asset = assets.find((a) => a.$id === assetId);
        return {
          name: asset?.name || "Unknown Asset",
          count,
          category: asset?.category || "",
        };
      });

    setAnalytics({
      totalAssets: actualAssets.length,
      totalConsumables: consumables.length,
      totalRequests: filteredRequests.length,
      totalUsers: users.length,
      assetsByCategory,
      assetsByCondition,
      assetsByStatus,
      requestsByStatus,
      requestsByMonth,
      topRequesters,
      mostRequestedAssets,
      totalAssetValue: totalValue,
      avgRequestDuration:
        requestsWithDuration > 0
          ? Math.round(totalDuration / requestsWithDuration)
          : 0,
    });
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]).join(",");
    const csvContent = [
      headers,
      ...data.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getDateRangeText = () => {
    switch (dateRange) {
      case "last7":
        return "Last 7 days";
      case "last30":
        return "Last 30 days";
      case "last90":
        return "Last 90 days";
      case "last365":
        return "Last year";
      default:
        return "All time";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-primary-100/40">
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent absolute top-0 left-0"></div>
            </div>
            <div className="text-center">
              <p className="text-slate-700 font-medium">Loading Reports</p>
              <p className="text-slate-500 text-sm">
                Preparing analytics data...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-primary-100/40">
      <div className="container mx-auto space-y-8 p-6">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-sidebar-500 to-sidebar-600 rounded-xl shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-sidebar-900 to-sidebar-900 bg-clip-text text-transparent">
                  Reports & Analytics
                </h1>
                <p className="text-slate-600 font-medium">
                  System insights and data analysis
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => loadReportData()}
                className="relative bg-gradient-to-r from-sidebar-500 to-sidebar-600 hover:from-sidebar-600 hover:to-sidebar-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group rounded-xl px-6 py-3 border-0"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700 ease-in-out" />
                    <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-500 origin-center" />
                  </div>
                  <span className="group-hover:translate-x-1 transition-transform duration-300 font-semibold">
                    Refresh Data
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
                <div className="absolute inset-0 bg-gradient-to-r from-sidebar-400/20 to-sidebar-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
              <Filter className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">
                Date Range
              </Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="h-12 border-gray-300 focus:border-primary-500 focus:ring-primary-500/20 rounded-lg shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="last7">Last 7 days</SelectItem>
                  <SelectItem value="last30">Last 30 days</SelectItem>
                  <SelectItem value="last90">Last 90 days</SelectItem>
                  <SelectItem value="last365">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">
                Asset Category
              </Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-12 border-gray-300 focus:border-primary-500 focus:ring-primary-500/20 rounded-lg shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.values(ENUMS.CATEGORY).map((category) => (
                    <SelectItem key={category} value={category}>
                      {formatCategory(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">
                Asset Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-12 border-gray-300 focus:border-primary-500 focus:ring-primary-500/20 rounded-lg shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.values(ENUMS.AVAILABLE_STATUS).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Total Assets Card */}
          <div className="bg-gradient-to-br from-sidebar-50 to-sidebar-100 rounded-2xl p-6 border border-sidebar-200/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-sidebar-500 to-sidebar-600 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900">
                  {analytics.totalAssets}
                </div>
                <p className="text-sm font-semibold text-slate-600">
                  Active inventory items
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Total Assets
              </span>
              <div className="px-3 py-1 bg-sidebar-500/20 text-sidebar-600 rounded-lg text-sm font-semibold">
                Inventory
              </div>
            </div>
          </div>

          {/* Total Consumables Card */}
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl p-6 border border-cyan-200/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900">
                  {analytics.totalConsumables}
                </div>
                <p className="text-sm font-semibold text-slate-600">
                  Stock items
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Total Consumables
              </span>
              <div className="px-3 py-1 bg-cyan-500/20 text-cyan-600 rounded-lg text-sm font-semibold">
                Stock
              </div>
            </div>
          </div>

          {/* Total Value Card */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6 border border-primary-200/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900">
                  {formatCurrency(analytics.totalAssetValue)}
                </div>
                <p className="text-sm font-semibold text-slate-600">
                  Current asset value
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Total Value
              </span>
              <div className="px-3 py-1 bg-primary-500/20 text-primary-600 rounded-lg text-sm font-semibold">
                Value
              </div>
            </div>
          </div>

          {/* Requests Card */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900">
                  {analytics.totalRequests}
                </div>
                <p className="text-sm font-semibold text-slate-600">
                  {getDateRangeText()}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Requests
              </span>
              <div className="px-3 py-1 bg-orange-500/20 text-orange-600 rounded-lg text-sm font-semibold">
                Activity
              </div>
            </div>
          </div>

          {/* Avg Duration Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900">
                  {analytics.avgRequestDuration}
                </div>
                <p className="text-sm font-semibold text-slate-600">
                  Days per request
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Avg Duration
              </span>
              <div className="px-3 py-1 bg-purple-500/20 text-purple-600 rounded-lg text-sm font-semibold">
                Time
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl p-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-gray-50 to-gray-100 p-2 rounded-2xl shadow-inner border border-gray-200/50">
              <TabsTrigger
                value="overview"
                className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-500 data-[state=active]:to-primary-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 font-semibold transition-all duration-300 rounded-xl py-3 px-4 group hover:bg-primary-50 hover:text-primary-700 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-800"
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Overview</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-primary-600/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              </TabsTrigger>
              <TabsTrigger
                value="assets"
                className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-sidebar-500 data-[state=active]:to-sidebar-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 font-semibold transition-all duration-300 rounded-xl py-3 px-4 group hover:bg-sidebar-50 hover:text-sidebar-700 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-800"
              >
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Asset Reports</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-sidebar-500/20 to-sidebar-600/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              </TabsTrigger>
              <TabsTrigger
                value="consumables"
                className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 font-semibold transition-all duration-300 rounded-xl py-3 px-4 group hover:bg-cyan-50 hover:text-cyan-700 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-800"
              >
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Consumable Reports</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              </TabsTrigger>
              <TabsTrigger
                value="requests"
                className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 font-semibold transition-all duration-300 rounded-xl py-3 px-4 group hover:bg-orange-50 hover:text-orange-700 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-800"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Request Reports</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 font-semibold transition-all duration-300 rounded-xl py-3 px-4 group hover:bg-purple-50 hover:text-purple-700 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-800"
              >
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>User Reports</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Asset Distribution */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-gray-200/30 shadow-lg">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-sidebar-500 to-sidebar-600 rounded-lg shadow-md">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        Assets by Category
                      </h3>
                      <p className="text-slate-600 font-medium">
                        Distribution of assets across categories
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(analytics.assetsByCategory).map(
                      ([category, count]) => (
                        <div
                          key={category}
                          className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:border-sidebar-300 transition-colors"
                        >
                          <span className="text-sm font-semibold text-slate-700">
                            {formatCategory(category)}
                          </span>
                          <div className="flex items-center space-x-3">
                            <div className="w-24 bg-gray-200 rounded-full h-3 shadow-inner">
                              <div
                                className="bg-gradient-to-r from-sidebar-500 to-sidebar-600 h-3 rounded-full shadow-lg transition-all duration-500"
                                style={{
                                  width: `${
                                    (count / analytics.totalAssets) * 100
                                  }%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-bold text-slate-900 min-w-[2rem] text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Request Status Distribution */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-gray-200/30 shadow-lg">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        Requests by Status
                      </h3>
                      <p className="text-slate-600 font-medium">
                        Current status of asset requests
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(analytics.requestsByStatus).map(
                      ([status, count]) => (
                        <div
                          key={status}
                          className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:border-orange-300 transition-colors"
                        >
                          <Badge
                            className={`${getStatusBadgeColor(
                              status
                            )} font-semibold px-3 py-1`}
                          >
                            {status.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-sm font-bold text-slate-900">
                            {count}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Top Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Requesters */}
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6 border border-primary-200/30 shadow-lg">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-md">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        Top Requesters
                      </h3>
                      <p className="text-slate-600 font-medium">
                        Most active users ({getDateRangeText()})
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {analytics.topRequesters.map((requester, index) => (
                      <div
                        key={`${requester.name}-${index}`}
                        className="flex items-center justify-between p-4 bg-white rounded-xl border border-primary-200 hover:border-primary-300 transition-colors group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {requester.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {requester.email}
                            </p>
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-primary-500/20 text-primary-600 rounded-lg text-sm font-semibold">
                          {requester.count} requests
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Most Requested Assets */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200/30 shadow-lg">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        Most Requested Assets
                      </h3>
                      <p className="text-slate-600 font-medium">
                        Popular assets ({getDateRangeText()})
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {analytics.mostRequestedAssets.map((asset, index) => (
                      <div
                        key={`${asset.name}-${index}`}
                        className="flex items-center justify-between p-4 bg-white rounded-xl border border-orange-200 hover:border-orange-300 transition-colors group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {asset.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatCategory(asset.category)}
                            </p>
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-orange-500/20 text-orange-600 rounded-lg text-sm font-semibold">
                          {asset.count} requests
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Asset Reports Tab */}
            <TabsContent value="assets">
              <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-200/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-sidebar-500 to-sidebar-600 rounded-lg shadow-md">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">
                          Asset Inventory Report
                        </h3>
                        <p className="text-slate-600 font-medium">
                          Detailed asset information and status
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() =>
                        exportToCSV(reportData.assets, "assets-report.csv")
                      }
                      className="relative bg-gradient-to-r from-sidebar-500 to-sidebar-600 hover:from-sidebar-600 hover:to-sidebar-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 group"
                    >
                      <div className="flex items-center space-x-2">
                        <Download className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                        <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                          Export CSV
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-white/20 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
                    </Button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                          <TableHead className="font-semibold text-slate-700">
                            Asset Name
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">
                            Category
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">
                            Status
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">
                            Condition
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">
                            Value
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">
                            Location
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.assets.slice(0, 50).map((asset) => (
                          <TableRow
                            key={asset.$id}
                            className="hover:bg-gray-50/50 transition-colors duration-200 group border-b border-gray-100/50"
                          >
                            <TableCell className="font-medium text-slate-900 group-hover:text-sidebar-700">
                              {asset.name}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-sidebar-50 text-sidebar-700 border-sidebar-200 hover:bg-sidebar-100">
                                {formatCategory(asset.category)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={getStatusBadgeColor(
                                  asset.availableStatus
                                )}
                              >
                                {asset.availableStatus.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={getConditionBadgeColor(
                                  asset.currentCondition
                                )}
                              >
                                {asset.currentCondition.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-slate-900">
                              {formatCurrency(asset.currentValue || 0)}
                            </TableCell>
                            <TableCell className="text-slate-600">
                              {asset.location || "Not specified"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {reportData.assets.length > 50 && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-sidebar-50 to-sidebar-100 rounded-xl border border-sidebar-200">
                      <p className="text-sm font-semibold text-slate-700 text-center">
                        Showing first 50 of {reportData.assets.length} assets.
                        Export for full report.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Consumable Reports Tab */}
            <TabsContent value="consumables">
              <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-200/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg shadow-md">
                        <ShoppingCart className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800">
                          Consumable Reports
                        </h2>
                        <p className="text-slate-600">
                          Detailed analysis of consumable inventory and usage
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        onClick={() =>
                          exportToCSV(
                            reportData.assets.filter(
                              (item) => item.itemType === "CONSUMABLE"
                            ),
                            "consumable-report"
                          )
                        }
                        className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Consumable Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl p-6 border border-cyan-200/30 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-cyan-600">
                            Total Consumables
                          </p>
                          <p className="text-3xl font-bold text-slate-900">
                            {analytics.totalConsumables}
                          </p>
                        </div>
                        <ShoppingCart className="h-8 w-8 text-cyan-500" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200/30 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-green-600">
                            In Stock
                          </p>
                          <p className="text-3xl font-bold text-slate-900">
                            {
                              reportData.assets
                                .filter(
                                  (item) => item.itemType === "CONSUMABLE"
                                )
                                .filter((consumable) => {
                                  return (
                                    getConsumableStatus(consumable) ===
                                    ENUMS.CONSUMABLE_STATUS.IN_STOCK
                                  );
                                }).length
                            }
                          </p>
                        </div>
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200/30 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-orange-600">
                            Low Stock
                          </p>
                          <p className="text-3xl font-bold text-slate-900">
                            {
                              reportData.assets
                                .filter(
                                  (item) => item.itemType === "CONSUMABLE"
                                )
                                .filter((consumable) => {
                                  return (
                                    getConsumableStatus(consumable) ===
                                    ENUMS.CONSUMABLE_STATUS.LOW_STOCK
                                  );
                                }).length
                            }
                          </p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-orange-500" />
                      </div>
                    </div>
                  </div>

                  {/* Consumables by Category */}
                  <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">
                      Consumables by Category
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(
                        reportData.assets
                          .filter((item) => item.itemType === "CONSUMABLE")
                          .reduce((acc, consumable) => {
                            const category = consumable.category || "Unknown";
                            acc[category] = (acc[category] || 0) + 1;
                            return acc;
                          }, {})
                      )
                        .sort(([, a], [, b]) => b - a)
                        .map(([category, count]) => (
                          <div
                            key={category}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                              <span className="font-medium text-slate-700">
                                {category}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-cyan-500 h-2 rounded-full"
                                  style={{
                                    width: `${
                                      (count / analytics.totalConsumables) * 100
                                    }%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold text-slate-600 w-8 text-right">
                                {count}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Consumables Table */}
                  <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-200/30">
                      <h3 className="text-xl font-bold text-slate-800">
                        Consumable Inventory Details
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50/50">
                            <TableHead className="font-semibold text-slate-700">
                              Name
                            </TableHead>
                            <TableHead className="font-semibold text-slate-700">
                              Category
                            </TableHead>
                            <TableHead className="font-semibold text-slate-700">
                              Current Stock
                            </TableHead>
                            <TableHead className="font-semibold text-slate-700">
                              Min Stock
                            </TableHead>
                            <TableHead className="font-semibold text-slate-700">
                              Max Stock
                            </TableHead>
                            <TableHead className="font-semibold text-slate-700">
                              Status
                            </TableHead>
                            <TableHead className="font-semibold text-slate-700">
                              Unit
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.assets
                            .filter((item) => item.itemType === "CONSUMABLE")
                            .slice(0, 50)
                            .map((consumable) => {
                              const currentStock = getCurrentStock(consumable);
                              const minStock = getMinStock(consumable);
                              const maxStock = getMaxStock(consumable);
                              const status = getConsumableStatus(consumable);
                              const unit = getConsumableUnit(consumable);
                              const isLowStock = currentStock <= minStock;

                              return (
                                <TableRow
                                  key={consumable.$id}
                                  className="hover:bg-gray-50/50"
                                >
                                  <TableCell className="font-medium text-slate-700">
                                    {consumable.name}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className="text-cyan-600 border-cyan-200"
                                    >
                                      {consumable.category}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <span
                                      className={`font-semibold ${
                                        isLowStock
                                          ? "text-orange-600"
                                          : "text-green-600"
                                      }`}
                                    >
                                      {currentStock}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-slate-600">
                                    {minStock}
                                  </TableCell>
                                  <TableCell className="text-slate-600">
                                    {maxStock}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        status === "ACTIVE"
                                          ? "default"
                                          : "secondary"
                                      }
                                      className={
                                        status === "ACTIVE"
                                          ? "bg-green-100 text-green-700"
                                          : "bg-gray-100 text-gray-700"
                                      }
                                    >
                                      {status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-slate-600">
                                    {unit}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>
                    {reportData.assets.filter(
                      (item) => item.itemType === "CONSUMABLE"
                    ).length > 50 && (
                      <div className="p-4 border-t border-gray-200/30 bg-gray-50/50">
                        <p className="text-sm font-semibold text-slate-700 text-center">
                          Showing first 50 of{" "}
                          {
                            reportData.assets.filter(
                              (item) => item.itemType === "CONSUMABLE"
                            ).length
                          }{" "}
                          consumables. Export for full report.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Request Reports Tab */}
            <TabsContent value="requests">
              <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-200/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">
                          Request Activity Report
                        </h3>
                        <p className="text-slate-600 font-medium">
                          Asset request history and analytics
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() =>
                        exportToCSV(reportData.requests, "requests-report.csv")
                      }
                      className="relative bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 group"
                    >
                      <div className="flex items-center space-x-2">
                        <Download className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                        <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                          Export CSV
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-white/20 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
                    </Button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                          <TableHead className="font-semibold text-slate-700">
                            Request ID
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">
                            Requester
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">
                            Status
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">
                            Purpose
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">
                            Created
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">
                            Duration
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.requests.slice(0, 50).map((request) => (
                          <TableRow
                            key={request.$id}
                            className="hover:bg-gray-50/50 transition-colors duration-200 group border-b border-gray-100/50"
                          >
                            <TableCell className="font-mono text-slate-900 group-hover:text-orange-700">
                              #{request.$id.slice(-8)}
                            </TableCell>
                            <TableCell className="text-slate-600">
                              {request.requesterStaffId}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={getStatusBadgeColor(request.status)}
                              >
                                {request.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate text-slate-600">
                              {request.purpose}
                            </TableCell>
                            <TableCell className="text-slate-600">
                              {new Date(
                                request.$createdAt
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-semibold text-slate-900">
                              {request.issueDate && request.expectedReturnDate
                                ? `${Math.ceil(
                                    (new Date(request.expectedReturnDate) -
                                      new Date(request.issueDate)) /
                                      (1000 * 60 * 60 * 24)
                                  )} days`
                                : "N/A"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {reportData.requests.length > 50 && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                      <p className="text-sm font-semibold text-slate-700 text-center">
                        Showing first 50 of {reportData.requests.length}{" "}
                        requests. Export for full report.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* User Reports Tab */}
            <TabsContent value="users">
              <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-200/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">
                          User Activity Report
                        </h3>
                        <p className="text-slate-600 font-medium">
                          System users and their activity levels
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() =>
                        exportToCSV(reportData.users, "users-report.csv")
                      }
                      className="relative bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 group"
                    >
                      <div className="flex items-center space-x-2">
                        <Download className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                        <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                          Export CSV
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-white/20 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
                    </Button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                          <TableHead className="font-semibold text-slate-700">
                            Name
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">
                            Email
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">
                            Role
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">
                            Department
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">
                            Status
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">
                            Requests
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.users.map((user) => {
                          const userRequests = reportData.requests.filter(
                            (r) => r.requesterStaffId === user.$id
                          ).length;
                          return (
                            <TableRow
                              key={user.$id}
                              className="hover:bg-gray-50/50 transition-colors duration-200 group border-b border-gray-100/50"
                            >
                              <TableCell className="font-medium text-slate-900 group-hover:text-purple-700">
                                {user.name}
                              </TableCell>
                              <TableCell className="text-slate-600">
                                {user.email}
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
                                  {user.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-slate-600">
                                {user.department_id || "Unassigned"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    user.active
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : "bg-gray-50 text-gray-700 border-gray-200"
                                  }
                                >
                                  {user.active ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-semibold text-slate-900">
                                {userRequests}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
