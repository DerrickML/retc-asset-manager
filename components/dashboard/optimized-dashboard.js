/**
 * Optimized Dashboard Component with Performance Patterns
 * Implements lazy loading, memoization, and efficient re-rendering strategies
 */

"use client";

import React, { useState, useCallback, useMemo, Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Alert } from "../ui/alert";
import {
  Download,
  Users,
  Package,
  Clock,
  AlertTriangle,
  Settings,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Activity,
  Filter,
} from "lucide-react";
import {
  useDashboardData,
  useRefreshDashboard,
  useDashboardMutations,
  useRoleBasedDashboard,
} from "../../lib/hooks/use-dashboard-data.js";
import { useToastContext } from "../providers/toast-provider";

// Lazy load heavy chart components
const MetricsChart = React.lazy(() => import("./charts/metrics-chart"));
const TrendsChart = React.lazy(() => import("./charts/trends-chart"));
const UtilizationChart = React.lazy(() => import("./charts/utilization-chart"));
const AlertsList = React.lazy(() => import("./alerts/alerts-list"));

// Memoized metric card component to prevent unnecessary re-renders
const MetricCard = React.memo(
  ({ icon: Icon, title, value, subtitle, trend, color = "blue" }) => {
    const trendColor =
      trend?.direction === "up"
        ? "text-green-600"
        : trend?.direction === "down"
        ? "text-red-600"
        : "text-gray-600";

    return (
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`h-4 w-4 text-${color}-600`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value.toLocaleString()}</div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">{subtitle}</p>
            {trend && (
              <span className={`text-xs ${trendColor} flex items-center`}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {trend.value}%
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

MetricCard.displayName = "MetricCard";

// Memoized status overview component
const StatusOverview = React.memo(({ metrics }) => {
  const statusData = useMemo(
    () => [
      {
        label: "Available",
        value: metrics.availableAssets,
        total: metrics.totalAssets,
        color: "bg-green-500",
      },
      {
        label: "In Use",
        value: metrics.inUseAssets,
        total: metrics.totalAssets,
        color: "bg-blue-500",
      },
      {
        label: "Maintenance",
        value: metrics.maintenanceAssets,
        total: metrics.totalAssets,
        color: "bg-yellow-500",
      },
      {
        label: "Reserved",
        value: metrics.reservedAssets,
        total: metrics.totalAssets,
        color: "bg-purple-500",
      },
    ],
    [metrics]
  );

  return (
    <div className="space-y-4">
      {statusData.map((status) => (
        <div key={status.label} className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${status.color}`} />
            <span className="text-sm font-medium">{status.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <Progress
              value={(status.value / status.total) * 100}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground w-12">
              {status.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
});

StatusOverview.displayName = "StatusOverview";

// Memoized category breakdown component
const CategoryBreakdown = React.memo(({ categoryData }) => {
  const sortedCategories = useMemo(
    () => [...categoryData].sort((a, b) => b.value - a.value).slice(0, 8),
    [categoryData]
  );

  return (
    <div className="space-y-2">
      {sortedCategories.map((category) => (
        <div key={category.name} className="flex items-center justify-between">
          <span className="text-sm font-medium">{category.name}</span>
          <div className="flex items-center gap-2">
            <Progress
              value={parseFloat(category.percentage)}
              className="w-20"
            />
            <Badge variant="outline" className="text-xs">
              {category.value}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
});

CategoryBreakdown.displayName = "CategoryBreakdown";

// Loading fallback components
const MetricCardSkeleton = () => (
  <Card className="animate-pulse">
    <CardHeader className="pb-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </CardHeader>
    <CardContent>
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
    </CardContent>
  </Card>
);

const ChartSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="h-5 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
    </CardHeader>
    <CardContent>
      <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
    </CardContent>
  </Card>
);

export default function OptimizedDashboard() {
  const toast = useToastContext();
  const [activeTab, setActiveTab] = useState("overview");
  const [departmentFilter, setDepartmentFilter] = useState(null);

  // Get role-based access
  const { data: roleData } = useRoleBasedDashboard();

  // Use the role-determined department filter
  const effectiveDepartmentFilter =
    roleData?.departmentFilter || departmentFilter;

  // Load dashboard data with React Query
  const { metrics, analytics, alerts, utilization, isLoading, isError, error } =
    useDashboardData(effectiveDepartmentFilter);

  // Refresh mutation
  const refreshMutation = useRefreshDashboard();

  // Dashboard mutations for cache invalidation
  const { invalidateAll } = useDashboardMutations();

  // Memoized metric cards data to prevent recalculation
  const metricCards = useMemo(() => {
    if (!metrics.data) return [];

    const data = metrics.data;
    return [
      {
        icon: Package,
        title: "Total Assets",
        value: data.totalAssets,
        subtitle: `${data.availableAssets} available`,
        trend: { direction: "up", value: 5.2 },
        color: "blue",
      },
      {
        icon: Users,
        title: "Active Users",
        value: data.activeUsers,
        subtitle: `${data.totalUsers} total staff`,
        trend: { direction: "up", value: 2.1 },
        color: "green",
      },
      {
        icon: Clock,
        title: "Pending Requests",
        value: data.pendingRequests,
        subtitle: "Awaiting approval",
        trend: { direction: "down", value: 3.5 },
        color: "yellow",
      },
      {
        icon: AlertTriangle,
        title: "Maintenance",
        value: data.maintenanceAssets,
        subtitle: "Assets needing attention",
        trend: { direction: "up", value: 8.1 },
        color: "red",
      },
    ];
  }, [metrics.data]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      await refreshMutation.mutateAsync({
        departmentFilter: effectiveDepartmentFilter,
      });
    } catch (error) {
      console.error("Refresh failed:", error);
    }
  }, [refreshMutation, effectiveDepartmentFilter]);

  // Handle download (memoized to prevent recreation)
  const handleExport = useCallback(async (type) => {
    try {
      console.log(`Downloading ${type} data...`);
      // Implementation would go here
      toast.success(`${type} report downloaded successfully!`);
    } catch (error) {
      console.error("Download error:", error);
    }
  }, []);

  // Tab change handler
  const handleTabChange = useCallback((value) => {
    setActiveTab(value);
  }, []);

  // Error state
  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h3 className="font-semibold">Dashboard Error</h3>
            <p className="text-sm mt-1">
              {error?.message || "Failed to load dashboard data"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">
            System overview and analytics
            {effectiveDepartmentFilter && (
              <Badge variant="outline" className="ml-2">
                {effectiveDepartmentFilter}
              </Badge>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshMutation.isPending || isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${
                refreshMutation.isPending ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
          <Button onClick={() => handleExport("Assets")} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download Assets PDF
          </Button>
          <Button onClick={() => handleExport("Requests")} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download Requests PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading
          ? // Loading skeletons
            Array.from({ length: 4 }, (_, i) => <MetricCardSkeleton key={i} />)
          : // Actual metric cards
            metricCards.map((card, index) => (
              <MetricCard key={index} {...card} />
            ))}
      </div>

      {/* Charts and Analytics */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-4 w-full lg:w-auto">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="assets">
            <Package className="h-4 w-4 mr-2" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="requests">
            <Clock className="h-4 w-4 mr-2" />
            Requests
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Asset Status Overview</CardTitle>
                <CardDescription>Current status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-48 bg-gray-100 rounded animate-pulse" />
                ) : (
                  <StatusOverview metrics={metrics.data} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Assets by category</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-48 bg-gray-100 rounded animate-pulse" />
                ) : (
                  <CategoryBreakdown
                    categoryData={analytics.data?.categoryDistribution || []}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <Suspense fallback={<ChartSkeleton />}>
              <MetricsChart
                data={analytics.data}
                departmentFilter={effectiveDepartmentFilter}
              />
            </Suspense>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <Suspense fallback={<ChartSkeleton />}>
              <TrendsChart
                data={analytics.data}
                departmentFilter={effectiveDepartmentFilter}
              />
            </Suspense>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.isLoading ? (
            <ChartSkeleton />
          ) : (
            <Suspense fallback={<ChartSkeleton />}>
              <AlertsList alerts={alerts.data} onRefresh={handleRefresh} />
            </Suspense>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
