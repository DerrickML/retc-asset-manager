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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (reportData.assets.length > 0 || reportData.requests.length > 0) {
      calculateAnalytics();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const exportToCSV = (
    data,
    filename,
    formatData = null,
    summaryMatrix = null,
    breakdowns = null
  ) => {
    if (!data || data.length === 0) {
      alert("No data to download");
      return;
    }

    // Use custom formatter if provided, otherwise use default
    const formattedData = formatData ? formatData(data) : data;

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const now = new Date();
    const readableTitle = filename.replace(/-|_/g, " ");
    doc.setFontSize(16);
    doc.text(`${readableTitle} Report`, 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated on: ${now.toLocaleString()}`, 40, 60);
    doc.text(`Total Records: ${data.length}`, 40, 74);

    let currentY = 100;

    if (summaryMatrix) {
      const summaryRows = Object.entries(summaryMatrix);
      if (summaryRows.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [["Metric", "Value"]],
          body: summaryRows,
          styles: { fontSize: 10, cellPadding: 6 },
          headStyles: { fillColor: [5, 150, 105], textColor: 255 },
          margin: { left: 40, right: 40 },
        });
        currentY = doc.lastAutoTable.finalY + 20;
      }
    }

    if (breakdowns) {
      Object.entries(breakdowns).forEach(([title, breakdown]) => {
        const breakdownRows = Object.entries(breakdown);
        if (breakdownRows.length === 0) return;
        autoTable(doc, {
          startY: currentY,
          head: [[`${title} Category`, "Count"]],
          body: breakdownRows,
          styles: { fontSize: 9, cellPadding: 4 },
          headStyles: { fillColor: [37, 99, 235], textColor: 255 },
          margin: { left: 40, right: 40 },
        });
        currentY = doc.lastAutoTable.finalY + 20;
      });
    }

    if (formattedData.length > 0) {
      const headers = Object.keys(formattedData[0]);
      autoTable(doc, {
        startY: currentY,
        head: [headers],
        body: formattedData.map((row) =>
          headers.map((header) => {
            const value = row[header];
            if (value === null || value === undefined || value === "") {
              return "—";
            }
            if (typeof value === "number") {
              return value.toLocaleString();
            }
            return value;
          })
        ),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        margin: { left: 40, right: 40 },
      });
    }

    doc.save(`${filename}_${now.toISOString().split("T")[0]}.pdf`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Data formatters for CSV export
  const formatAssetsForCSV = (assets) => {
    return assets.map((asset) => ({
      "Asset Name": asset.name || "",
      "Asset Tag": asset.assetTag || "",
      Category: asset.category || "",
      Status: asset.availableStatus || "",
      Condition: asset.currentCondition || "",
      Value: asset.currentValue || 0,
      Location: asset.location || "",
      Department: asset.departmentId || "",
      "Created Date": asset.$createdAt
        ? new Date(asset.$createdAt).toLocaleDateString()
        : "",
    }));
  };

  const formatConsumablesForCSV = (consumables) => {
    return consumables.map((consumable) => ({
      "Consumable Name": consumable.name || "",
      "Asset Tag": consumable.assetTag || "",
      Category: consumable.category || "",
      "Current Stock": getCurrentStock(consumable),
      "Min Stock": getMinStock(consumable),
      "Max Stock": getMaxStock(consumable),
      Status: getConsumableStatus(consumable),
      Unit: getConsumableUnit(consumable),
      Location: consumable.locationName || "",
      "Room/Area": consumable.roomOrArea || "",
      "Created Date": consumable.$createdAt
        ? new Date(consumable.$createdAt).toLocaleDateString()
        : "",
    }));
  };

  const formatRequestsForCSV = (requests) => {
    return requests.map((request) => ({
      "Request ID": request.$id || "",
      Requester: request.requesterStaffId || "",
      Status: request.status || "",
      Purpose: request.purpose || "",
      "Created Date": request.$createdAt
        ? new Date(request.$createdAt).toLocaleDateString()
        : "",
      "Issue Date": request.issueDate
        ? new Date(request.issueDate).toLocaleDateString()
        : "",
      "Expected Return Date": request.expectedReturnDate
        ? new Date(request.expectedReturnDate).toLocaleDateString()
        : "",
    }));
  };

  const formatUsersForCSV = (users) => {
    return users.map((user) => ({
      Name: user.name || "",
      Email: user.email || "",
      Role: user.role || "",
      Department: user.department_id || "",
      Status: user.active ? "Active" : "Inactive",
      "Created Date": user.$createdAt
        ? new Date(user.$createdAt).toLocaleDateString()
        : "",
    }));
  };

  // Helper functions to generate summary matrices
  const generateAssetSummary = (assets) => {
    const totalValue = assets.reduce(
      (sum, asset) => sum + (asset.currentValue || 0),
      0
    );
    const assetsByCategory = {};
    const assetsByStatus = {};
    const assetsByCondition = {};

    assets.forEach((asset) => {
      assetsByCategory[asset.category || "Unknown"] =
        (assetsByCategory[asset.category || "Unknown"] || 0) + 1;
      assetsByStatus[asset.availableStatus || "Unknown"] =
        (assetsByStatus[asset.availableStatus || "Unknown"] || 0) + 1;
      assetsByCondition[asset.currentCondition || "Unknown"] =
        (assetsByCondition[asset.currentCondition || "Unknown"] || 0) + 1;
    });

    return {
      summary: {
        "Total Assets": assets.length,
        "Total Asset Value": formatCurrency(totalValue),
        "Average Asset Value": formatCurrency(
          totalValue / (assets.length || 1)
        ),
      },
      breakdowns: {
        "Assets by Category": assetsByCategory,
        "Assets by Status": assetsByStatus,
        "Assets by Condition": assetsByCondition,
      },
    };
  };

  const generateConsumableSummary = (consumables) => {
    const totalStock = consumables.reduce(
      (sum, c) => sum + getCurrentStock(c),
      0
    );
    const inStock = consumables.filter(
      (c) => getConsumableStatus(c) === ENUMS.CONSUMABLE_STATUS.IN_STOCK
    ).length;
    const lowStock = consumables.filter(
      (c) => getConsumableStatus(c) === ENUMS.CONSUMABLE_STATUS.LOW_STOCK
    ).length;
    const outOfStock = consumables.filter(
      (c) => getConsumableStatus(c) === ENUMS.CONSUMABLE_STATUS.OUT_OF_STOCK
    ).length;

    const consumablesByCategory = {};
    const consumablesByStatus = {};

    consumables.forEach((consumable) => {
      const category = consumable.category || "Unknown";
      consumablesByCategory[category] =
        (consumablesByCategory[category] || 0) + 1;

      const status = getConsumableStatus(consumable);
      consumablesByStatus[status] = (consumablesByStatus[status] || 0) + 1;
    });

    return {
      summary: {
        "Total Consumables": consumables.length,
        "Total Stock Units": totalStock,
        "In Stock Items": inStock,
        "Low Stock Items": lowStock,
        "Out of Stock Items": outOfStock,
      },
      breakdowns: {
        "Consumables by Category": consumablesByCategory,
        "Consumables by Status": consumablesByStatus,
      },
    };
  };

  const generateRequestSummary = (requests) => {
    const requestsByStatus = {};
    const requestsByMonth = {};

    requests.forEach((request) => {
      const status = request.status || "Unknown";
      requestsByStatus[status] = (requestsByStatus[status] || 0) + 1;

      if (request.$createdAt) {
        const month = new Date(request.$createdAt).toISOString().slice(0, 7);
        requestsByMonth[month] = (requestsByMonth[month] || 0) + 1;
      }
    });

    return {
      summary: {
        "Total Requests": requests.length,
        "Date Range": getDateRangeText(),
      },
      breakdowns: {
        "Requests by Status": requestsByStatus,
        "Requests by Month": requestsByMonth,
      },
    };
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
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600"></div>
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
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Reports & Analytics
                </h1>
                <p className="text-slate-600 mt-1">
                  System insights and data analysis
                </p>
              </div>
            </div>
            <Button
              onClick={() => loadReportData()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg font-semibold text-slate-900">
                Filters
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Date Range
                </Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
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

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Asset Category
                </Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
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

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Asset Status
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
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
          </CardContent>
        </Card>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Total Assets Card */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <Badge className="bg-blue-100 text-blue-700">Assets</Badge>
              </div>
              <h3 className="text-3xl font-bold text-slate-900">
                {analytics.totalAssets}
              </h3>
              <p className="text-sm font-medium text-slate-600 mt-1">
                Total Assets
              </p>
            </CardContent>
          </Card>

          {/* Total Consumables Card */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-orange-600" />
                </div>
                <Badge className="bg-orange-100 text-orange-700">Consumables</Badge>
              </div>
              <h3 className="text-3xl font-bold text-slate-900">
                {analytics.totalConsumables}
              </h3>
              <p className="text-sm font-medium text-slate-600 mt-1">
                Total Consumables
              </p>
            </CardContent>
          </Card>

          {/* Total Value Card */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <Badge className="bg-green-100 text-green-700">Value</Badge>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {formatCurrency(analytics.totalAssetValue)}
              </h3>
              <p className="text-sm font-medium text-slate-600 mt-1">
                Total Value
              </p>
            </CardContent>
          </Card>

          {/* Requests Card */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <Badge className="bg-purple-100 text-purple-700">Requests</Badge>
              </div>
              <h3 className="text-3xl font-bold text-slate-900">
                {analytics.totalRequests}
              </h3>
              <p className="text-sm font-medium text-slate-600 mt-1">
                {getDateRangeText()}
              </p>
            </CardContent>
          </Card>

          {/* Avg Duration Card */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <Clock className="h-6 w-6 text-indigo-600" />
                </div>
                <Badge className="bg-indigo-100 text-indigo-700">Duration</Badge>
              </div>
              <h3 className="text-3xl font-bold text-slate-900">
                {analytics.avgRequestDuration}
              </h3>
              <p className="text-sm font-medium text-slate-600 mt-1">
                Days Average
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5 bg-slate-100 p-1 rounded-lg">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="assets"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Assets
                </TabsTrigger>
                <TabsTrigger
                  value="consumables"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Consumables
                </TabsTrigger>
                <TabsTrigger
                  value="requests"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Requests
                </TabsTrigger>
                <TabsTrigger
                  value="users"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Users
                </TabsTrigger>
              </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Asset Distribution */}
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      <div>
                        <CardTitle className="text-lg font-semibold text-slate-900">
                          Assets by Category
                        </CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          Distribution of assets across categories
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {Object.entries(analytics.assetsByCategory).map(
                        ([category, count]) => {
                          const percentage = ((count / analytics.totalAssets) * 100).toFixed(1);
                          return (
                            <div
                              key={category}
                              className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                  <span className="text-sm font-semibold text-slate-900">
                                    {formatCategory(category)}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <span className="text-xs font-medium text-slate-500">
                                    {percentage}%
                                  </span>
                                  <div className="flex items-center space-x-1">
                                    <span className="text-lg font-bold text-blue-600">
                                      {count}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      {count === 1 ? 'asset' : 'assets'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-700 ease-out"
                                  style={{
                                    width: `${percentage}%`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Request Status Distribution */}
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      <div>
                        <CardTitle className="text-lg font-semibold text-slate-900">
                          Requests by Status
                        </CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          Current status of asset requests
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {Object.entries(analytics.requestsByStatus).map(
                        ([status, count]) => (
                          <div
                            key={status}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                          >
                            <Badge
                              className={`${getStatusBadgeColor(
                                status
                              )} font-medium`}
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
                  </CardContent>
                </Card>
              </div>

              {/* Top Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Requesters */}
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-green-600" />
                      <div>
                        <CardTitle className="text-lg font-semibold text-slate-900">
                          Top Requesters
                        </CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          Most active users ({getDateRangeText()})
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {analytics.topRequesters.map((requester, index) => (
                        <div
                          key={`${requester.name}-${index}`}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {requester.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {requester.email}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-700">
                            {requester.count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Most Requested Assets */}
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                      <div>
                        <CardTitle className="text-lg font-semibold text-slate-900">
                          Most Requested Assets
                        </CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          Popular assets ({getDateRangeText()})
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {analytics.mostRequestedAssets.map((asset, index) => (
                        <div
                          key={`${asset.name}-${index}`}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-7 h-7 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {asset.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatCategory(asset.category)}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-orange-100 text-orange-700">
                            {asset.count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Asset Reports Tab */}
            <TabsContent value="assets">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      <div>
                        <CardTitle className="text-lg font-semibold text-slate-900">
                          Asset Inventory Report
                        </CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          Detailed asset information and status
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        const filteredAssets = reportData.assets.filter(
                          (item) =>
                            item.itemType === "ASSET" ||
                            !item.itemType ||
                            item.itemType === undefined
                        );
                        const assetSummary =
                          generateAssetSummary(filteredAssets);
                        exportToCSV(
                          filteredAssets,
                          "assets-report",
                          formatAssetsForCSV,
                          assetSummary.summary,
                          assetSummary.breakdowns
                        );
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
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
                            className="hover:bg-slate-50 border-b border-slate-100"
                          >
                            <TableCell className="font-medium text-slate-900">
                              {asset.name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-blue-600 border-blue-200">
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
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-slate-700 text-center">
                        Showing first 50 of {reportData.assets.length} assets.
                        Download for full report.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Consumable Reports Tab */}
            <TabsContent value="consumables" className="space-y-6">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShoppingCart className="h-5 w-5 text-orange-600" />
                      <div>
                        <CardTitle className="text-lg font-semibold text-slate-900">
                          Consumable Reports
                        </CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          Detailed analysis of consumable inventory and usage
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        const filteredConsumables = reportData.assets.filter(
                          (item) => item.itemType === "CONSUMABLE"
                        );
                        const consumableSummary =
                          generateConsumableSummary(filteredConsumables);
                        exportToCSV(
                          filteredConsumables,
                          "consumables-report",
                          formatConsumablesForCSV,
                          consumableSummary.summary,
                          consumableSummary.breakdowns
                        );
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Consumable Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">
                          Total Consumables
                        </p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">
                          {analytics.totalConsumables}
                        </p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <ShoppingCart className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">
                          In Stock
                        </p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">
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
                      <div className="p-3 bg-green-100 rounded-lg">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">
                          Low Stock
                        </p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">
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
                      <div className="p-3 bg-red-100 rounded-lg">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Consumables by Category */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    Consumables by Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
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
                          <span className="text-sm font-medium text-slate-700">
                            {category}
                          </span>
                          <div className="flex items-center space-x-3">
                            <div className="w-24 bg-slate-200 rounded-full h-2">
                              <div
                                className="bg-orange-600 h-2 rounded-full"
                                style={{
                                  width: `${
                                    (count / analytics.totalConsumables) * 100
                                  }%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-slate-900 min-w-[2rem] text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Consumables Table */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    Consumable Inventory Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
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
                                className="hover:bg-slate-50 border-b border-slate-100"
                              >
                                <TableCell className="font-medium text-slate-900">
                                  {consumable.name}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="text-orange-600 border-orange-200"
                                  >
                                    {consumable.category}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={`font-semibold ${
                                      isLowStock
                                        ? "text-red-600"
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
                                    className={
                                      status === ENUMS.CONSUMABLE_STATUS.IN_STOCK
                                        ? "bg-green-100 text-green-700"
                                        : status === ENUMS.CONSUMABLE_STATUS.LOW_STOCK
                                        ? "bg-orange-100 text-orange-700"
                                        : "bg-red-100 text-red-700"
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
                    <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-sm font-medium text-slate-700 text-center">
                        Showing first 50 of{" "}
                        {
                          reportData.assets.filter(
                            (item) => item.itemType === "CONSUMABLE"
                          ).length
                        }{" "}
                        consumables. Download for full report.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Request Reports Tab */}
            <TabsContent value="requests">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      <div>
                        <CardTitle className="text-lg font-semibold text-slate-900">
                          Request Activity Report
                        </CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          Asset request history and analytics
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        const requestSummary = generateRequestSummary(
                          reportData.requests
                        );
                        exportToCSV(
                          reportData.requests,
                          "requests-report",
                          formatRequestsForCSV,
                          requestSummary.summary,
                          requestSummary.breakdowns
                        );
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
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
                            className="hover:bg-slate-50 border-b border-slate-100"
                          >
                            <TableCell className="font-mono text-sm text-slate-900">
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
                            <TableCell className="font-medium text-slate-900">
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
                    <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm font-medium text-slate-700 text-center">
                        Showing first 50 of {reportData.requests.length}{" "}
                        requests. Download for full report.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* User Reports Tab */}
            <TabsContent value="users">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-indigo-600" />
                      <div>
                        <CardTitle className="text-lg font-semibold text-slate-900">
                          User Activity Report
                        </CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          System users and their activity levels
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() =>
                        exportToCSV(
                          reportData.users,
                          "users-report",
                          formatUsersForCSV
                        )
                      }
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
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
                              className="hover:bg-slate-50 border-b border-slate-100"
                            >
                              <TableCell className="font-medium text-slate-900">
                                {user.name}
                              </TableCell>
                              <TableCell className="text-slate-600">
                                {user.email}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-indigo-600 border-indigo-200">
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
                                      ? "bg-green-100 text-green-700"
                                      : "bg-slate-100 text-slate-700"
                                  }
                                >
                                  {user.active ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium text-slate-900">
                                {userRequests}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
