"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Button } from "../../../components/ui/button"
import { Progress } from "../../../components/ui/progress"
import { Download, Users, Package, Clock, AlertTriangle, Settings } from "lucide-react"
import { databases } from "../../../lib/appwrite/client.js"
import { DATABASE_ID, COLLECTIONS } from "../../../lib/appwrite/config.js"
import { getCurrentStaff, permissions } from "../../../lib/utils/auth.js"
import { ENUMS } from "../../../lib/appwrite/config.js"

export default function AdminDashboard() {
  const [staff, setStaff] = useState(null)
  const [metrics, setMetrics] = useState({
    totalAssets: 0,
    availableAssets: 0,
    inUseAssets: 0,
    pendingRequests: 0,
    totalUsers: 0,
    maintenanceAssets: 0,
  })
  const [assetsByCategory, setAssetsByCategory] = useState([])
  const [requestTrends, setRequestTrends] = useState([])
  const [utilizationData, setUtilizationData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Check admin permissions
      const currentStaff = await getCurrentStaff()
      if (!currentStaff || !permissions.isAdmin(currentStaff)) {
        window.location.href = "/unauthorized"
        return
      }
      setStaff(currentStaff)

      // Load metrics
      const [assets, requests, users] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSETS),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSET_REQUESTS),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.STAFF),
      ])

      const assetMetrics = {
        totalAssets: assets.total,
        availableAssets: assets.documents.filter((a) => a.availableStatus === ENUMS.AVAILABLE_STATUS.AVAILABLE).length,
        inUseAssets: assets.documents.filter((a) => a.availableStatus === ENUMS.AVAILABLE_STATUS.IN_USE).length,
        maintenanceAssets: assets.documents.filter((a) => a.availableStatus === ENUMS.AVAILABLE_STATUS.MAINTENANCE).length,
        pendingRequests: requests.documents.filter((r) => r.status === ENUMS.REQUEST_STATUS.PENDING).length,
        totalUsers: users.total,
      }

      setMetrics(assetMetrics)

      // Process category data
      const categoryMap = {}
      assets.documents.forEach((asset) => {
        const category = asset.category || "Uncategorized"
        categoryMap[category] = (categoryMap[category] || 0) + 1
      })

      const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
        name,
        value,
        percentage: ((value / assets.total) * 100).toFixed(1),
      }))

      setAssetsByCategory(categoryData)

      // Mock trend data (in real app, this would be calculated from historical data)
      const trendData = [
        { month: "Jan", requests: 45, approved: 38 },
        { month: "Feb", requests: 52, approved: 44 },
        { month: "Mar", requests: 48, approved: 41 },
        { month: "Apr", requests: 61, approved: 55 },
        { month: "May", requests: 55, approved: 48 },
        { month: "Jun", requests: 67, approved: 59 },
      ]

      setRequestTrends(trendData)

      // Mock utilization data
      const utilizationData = [
        { department: "Engineering", utilization: 85 },
        { department: "Research", utilization: 72 },
        { department: "Training", utilization: 68 },
        { department: "Maintenance", utilization: 91 },
        { department: "Administration", utilization: 45 },
      ]

      setUtilizationData(utilizationData)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportData = async (type) => {
    try {
      // In a real implementation, this would generate and download reports
      console.log(`Exporting ${type} data...`)
      // Mock export functionality
      alert(`${type} report exported successfully!`)
    } catch (error) {
      console.error("Export error:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
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
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAssets}</div>
            <p className="text-xs text-muted-foreground">{metrics.availableAssets} available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered staff members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.maintenanceAssets}</div>
            <p className="text-xs text-muted-foreground">Assets in maintenance</p>
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
                <div className="space-y-2">
                  {assetsByCategory.map((category, index) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category.name}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={parseFloat(category.percentage)} className="w-20" />
                        <span className="text-sm text-gray-600">{category.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Request Trends</CardTitle>
                <CardDescription>Monthly request and approval trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {requestTrends.map((trend) => (
                    <div key={trend.month} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{trend.month}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-blue-600">{trend.requests} requests</span>
                        <span className="text-sm text-green-600">{trend.approved} approved</span>
                      </div>
                    </div>
                  ))}
                </div>
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
                    <Progress value={(metrics.availableAssets / metrics.totalAssets) * 100} className="w-32" />
                    <span className="text-sm text-muted-foreground">{metrics.availableAssets}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>In Use</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(metrics.inUseAssets / metrics.totalAssets) * 100} className="w-32" />
                    <span className="text-sm text-muted-foreground">{metrics.inUseAssets}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Maintenance</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(metrics.maintenanceAssets / metrics.totalAssets) * 100} className="w-32" />
                    <span className="text-sm text-muted-foreground">{metrics.maintenanceAssets}</span>
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
              <CardDescription>Request patterns and approval rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {requestTrends.map((trend) => (
                  <div key={trend.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{trend.month}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-blue-600">{trend.requests}</span>
                      <span className="text-green-600">{trend.approved}</span>
                      <span className="text-sm text-gray-600">
                        {Math.round((trend.approved / trend.requests) * 100)}% approval
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Utilization</CardTitle>
              <CardDescription>Asset utilization by department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {utilizationData.map((dept, index) => (
                  <div key={dept.department} className="flex justify-between items-center">
                    <span className="font-medium">{dept.department}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={dept.utilization} className="w-32" />
                      <span className="text-sm text-muted-foreground w-12">{dept.utilization}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}