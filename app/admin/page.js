"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Download, Users, Package, Clock, AlertTriangle } from "lucide-react";
import { databases } from "../../lib/appwrite/client.js";
import { DATABASE_ID, COLLECTIONS } from "../../lib/appwrite/config.js";
import { getCurrentStaff } from "../../lib/utils/auth.js";

export default function AdminDashboard() {
  const [staff, setStaff] = useState(null);
  const [metrics, setMetrics] = useState({
    totalAssets: 0,
    availableAssets: 0,
    inUseAssets: 0,
    pendingRequests: 0,
    totalUsers: 0,
    maintenanceAssets: 0,
  });
  const [assetsByCategory, setAssetsByCategory] = useState([]);
  const [requestTrends, setRequestTrends] = useState([]);
  const [utilizationData, setUtilizationData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load metrics
      const [assets, requests, users] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSETS),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.REQUESTS),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.STAFF),
      ]);

      const assetMetrics = {
        totalAssets: assets.total,
        availableAssets: assets.documents.filter(
          (a) => a.status === "Available"
        ).length,
        inUseAssets: assets.documents.filter((a) => a.status === "In Use")
          .length,
        maintenanceAssets: assets.documents.filter(
          (a) => a.status === "Maintenance"
        ).length,
        pendingRequests: requests.documents.filter(
          (r) => r.status === "Pending"
        ).length,
        totalUsers: users.total,
      };

      setMetrics(assetMetrics);

      // Process category data
      const categoryMap = {};
      assets.documents.forEach((asset) => {
        const category = asset.category || "Uncategorized";
        categoryMap[category] = (categoryMap[category] || 0) + 1;
      });

      const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
        name,
        value,
        percentage: ((value / assets.total) * 100).toFixed(1),
      }));

      setAssetsByCategory(categoryData);

      // Mock trend data (in real app, this would be calculated from historical data)
      const trendData = [
        { month: "Jan", requests: 45, approved: 38 },
        { month: "Feb", requests: 52, approved: 44 },
        { month: "Mar", requests: 48, approved: 41 },
        { month: "Apr", requests: 61, approved: 55 },
        { month: "May", requests: 55, approved: 48 },
        { month: "Jun", requests: 67, approved: 59 },
      ];

      setRequestTrends(trendData);

      // Mock utilization data
      const utilizationData = [
        { department: "Engineering", utilization: 85 },
        { department: "Research", utilization: 72 },
        { department: "Training", utilization: 68 },
        { department: "Maintenance", utilization: 91 },
        { department: "Administration", utilization: 45 },
      ];

      setUtilizationData(utilizationData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type) => {
    try {
      // In a real implementation, this would generate and download reports
      // Mock export functionality
      alert(`${type} report exported successfully!`);
    } catch (error) {
      // Silent fail for export
    }
  };

  const COLORS = [
    "#059669",
    "#0891b2",
    "#7c3aed",
    "#dc2626",
    "#ea580c",
    "#65a30d",
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-primary-100/40">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">System overview and analytics</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => exportData("Assets")} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Assets
            </Button>
            <Button onClick={() => exportData("Requests")} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Requests
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Assets
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalAssets}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.availableAssets} available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Registered staff members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Requests
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.pendingRequests}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.maintenanceAssets}
              </div>
              <p className="text-xs text-muted-foreground">
                Assets in maintenance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="utilization">Utilization</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Asset Distribution</CardTitle>
                  <CardDescription>Assets by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={assetsByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) =>
                          `${name} (${percentage}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {assetsByCategory.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Request Trends</CardTitle>
                  <CardDescription>
                    Monthly request and approval trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={requestTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="requests"
                        stroke="#059669"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="approved"
                        stroke="#0891b2"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Asset Status Overview</CardTitle>
                <CardDescription>Current status of all assets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Available</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={
                          (metrics.availableAssets / metrics.totalAssets) * 100
                        }
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">
                        {metrics.availableAssets}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>In Use</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={
                          (metrics.inUseAssets / metrics.totalAssets) * 100
                        }
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">
                        {metrics.inUseAssets}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Maintenance</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={
                          (metrics.maintenanceAssets / metrics.totalAssets) *
                          100
                        }
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">
                        {metrics.maintenanceAssets}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Request Analytics</CardTitle>
                <CardDescription>
                  Request patterns and approval rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={requestTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="requests" fill="#059669" />
                    <Bar dataKey="approved" fill="#0891b2" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="utilization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Department Utilization</CardTitle>
                <CardDescription>
                  Asset utilization by department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {utilizationData.map((dept, index) => (
                    <div
                      key={dept.department}
                      className="flex justify-between items-center"
                    >
                      <span className="font-medium">{dept.department}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={dept.utilization} className="w-32" />
                        <span className="text-sm text-muted-foreground w-12">
                          {dept.utilization}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
