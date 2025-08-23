"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Badge } from "../../../components/ui/badge"
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
  Filter
} from "lucide-react"
import { getCurrentStaff, permissions } from "../../../lib/utils/auth.js"
import { assetsService, assetRequestsService, staffService } from "../../../lib/appwrite/provider.js"
import { ENUMS } from "../../../lib/appwrite/config.js"
import { formatCategory, getStatusBadgeColor, getConditionBadgeColor } from "../../../lib/utils/mappings.js"

export default function AdminReports() {
  const [staff, setStaff] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState({
    assets: [],
    requests: [],
    users: []
  })
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
    avgRequestDuration: 0
  })

  // Filters
  const [dateRange, setDateRange] = useState("last30")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    checkPermissionsAndLoadData()
  }, [])

  useEffect(() => {
    if (reportData.assets.length > 0 || reportData.requests.length > 0) {
      calculateAnalytics()
    }
  }, [reportData, dateRange, categoryFilter, statusFilter])

  const checkPermissionsAndLoadData = async () => {
    try {
      const currentStaff = await getCurrentStaff()
      if (!currentStaff || !permissions.canViewReports(currentStaff)) {
        window.location.href = "/unauthorized"
        return
      }
      setStaff(currentStaff)
      await loadReportData()
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadReportData = async () => {
    try {
      const [assetsResult, requestsResult, usersResult] = await Promise.all([
        assetsService.list(),
        assetRequestsService.list(),
        staffService.list()
      ])

      setReportData({
        assets: assetsResult.documents || [],
        requests: requestsResult.documents || [],
        users: usersResult.documents || []
      })
    } catch (error) {
      console.error("Failed to load report data:", error)
    }
  }

  const calculateAnalytics = () => {
    const { assets, requests, users } = reportData
    
    // Filter data based on selected filters
    let filteredAssets = assets
    let filteredRequests = requests

    if (categoryFilter !== "all") {
      filteredAssets = assets.filter(asset => asset.category === categoryFilter)
    }

    if (statusFilter !== "all") {
      filteredAssets = assets.filter(asset => asset.availableStatus === statusFilter)
    }

    // Date range filtering for requests
    const now = new Date()
    let dateThreshold
    switch (dateRange) {
      case "last7":
        dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "last30":
        dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "last90":
        dateThreshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case "last365":
        dateThreshold = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        dateThreshold = new Date(0)
    }

    if (dateRange !== "all") {
      filteredRequests = requests.filter(request => 
        new Date(request.$createdAt) >= dateThreshold
      )
    }

    // Calculate metrics
    const assetsByCategory = {}
    const assetsByCondition = {}
    const assetsByStatus = {}
    let totalValue = 0

    filteredAssets.forEach(asset => {
      // Category distribution
      assetsByCategory[asset.category] = (assetsByCategory[asset.category] || 0) + 1
      
      // Condition distribution
      assetsByCondition[asset.currentCondition] = (assetsByCondition[asset.currentCondition] || 0) + 1
      
      // Status distribution
      assetsByStatus[asset.availableStatus] = (assetsByStatus[asset.availableStatus] || 0) + 1
      
      // Total value
      totalValue += asset.currentValue || 0
    })

    // Request analytics
    const requestsByStatus = {}
    const requestsByMonth = {}
    const requesterCounts = {}
    const assetRequestCounts = {}
    let totalDuration = 0
    let requestsWithDuration = 0

    filteredRequests.forEach(request => {
      // Status distribution
      requestsByStatus[request.status] = (requestsByStatus[request.status] || 0) + 1
      
      // Monthly distribution
      const month = new Date(request.$createdAt).toISOString().slice(0, 7)
      requestsByMonth[month] = (requestsByMonth[month] || 0) + 1
      
      // Top requesters
      const requesterId = request.requesterStaffId
      requesterCounts[requesterId] = (requesterCounts[requesterId] || 0) + 1
      
      // Most requested assets
      if (request.requestedItems && Array.isArray(request.requestedItems)) {
        request.requestedItems.forEach(assetId => {
          assetRequestCounts[assetId] = (assetRequestCounts[assetId] || 0) + 1
        })
      }
      
      // Average duration
      if (request.issueDate && request.expectedReturnDate) {
        const duration = (new Date(request.expectedReturnDate) - new Date(request.issueDate)) / (1000 * 60 * 60 * 24)
        totalDuration += duration
        requestsWithDuration++
      }
    })

    // Top requesters (need to map to user names)
    const topRequesters = Object.entries(requesterCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([userId, count]) => {
        const user = users.find(u => u.$id === userId)
        return {
          name: user?.name || "Unknown User",
          count,
          email: user?.email || ""
        }
      })

    // Most requested assets
    const mostRequestedAssets = Object.entries(assetRequestCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([assetId, count]) => {
        const asset = assets.find(a => a.$id === assetId)
        return {
          name: asset?.name || "Unknown Asset",
          count,
          category: asset?.category || ""
        }
      })

    setAnalytics({
      totalAssets: filteredAssets.length,
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
      avgRequestDuration: requestsWithDuration > 0 ? Math.round(totalDuration / requestsWithDuration) : 0
    })
  }

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return
    
    const headers = Object.keys(data[0]).join(',')
    const csvContent = [headers, ...data.map(row => Object.values(row).join(','))].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getDateRangeText = () => {
    switch (dateRange) {
      case "last7": return "Last 7 days"
      case "last30": return "Last 30 days"
      case "last90": return "Last 90 days"
      case "last365": return "Last year"
      default: return "All time"
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
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">System insights and data analysis</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => loadReportData()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last7">Last 7 days</SelectItem>
                  <SelectItem value="last30">Last 30 days</SelectItem>
                  <SelectItem value="last90">Last 90 days</SelectItem>
                  <SelectItem value="last365">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Asset Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.values(ENUMS.CATEGORY).map(category => (
                    <SelectItem key={category} value={category}>
                      {formatCategory(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Asset Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.values(ENUMS.AVAILABLE_STATUS).map(status => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalAssets}</div>
            <p className="text-xs text-muted-foreground">Active inventory items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalAssetValue)}</div>
            <p className="text-xs text-muted-foreground">Current asset value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalRequests}</div>
            <p className="text-xs text-muted-foreground">{getDateRangeText()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgRequestDuration}</div>
            <p className="text-xs text-muted-foreground">Days per request</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assets">Asset Reports</TabsTrigger>
          <TabsTrigger value="requests">Request Reports</TabsTrigger>
          <TabsTrigger value="users">User Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Assets by Category</CardTitle>
                <CardDescription>Distribution of assets across categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.assetsByCategory).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm">{formatCategory(category)}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(count / analytics.totalAssets) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Request Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Requests by Status</CardTitle>
                <CardDescription>Current status of asset requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.requestsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <Badge className={getStatusBadgeColor(status)}>
                        {status.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Requesters */}
            <Card>
              <CardHeader>
                <CardTitle>Top Requesters</CardTitle>
                <CardDescription>Most active users ({getDateRangeText()})</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topRequesters.map((requester, index) => (
                    <div key={requester.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">#{index + 1}</span>
                        <div>
                          <p className="text-sm font-medium">{requester.name}</p>
                          <p className="text-xs text-gray-500">{requester.email}</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium">{requester.count} requests</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Most Requested Assets */}
            <Card>
              <CardHeader>
                <CardTitle>Most Requested Assets</CardTitle>
                <CardDescription>Popular assets ({getDateRangeText()})</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.mostRequestedAssets.map((asset, index) => (
                    <div key={asset.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">#{index + 1}</span>
                        <div>
                          <p className="text-sm font-medium">{asset.name}</p>
                          <p className="text-xs text-gray-500">{formatCategory(asset.category)}</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium">{asset.count} requests</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Asset Reports Tab */}
        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Asset Inventory Report</CardTitle>
                  <CardDescription>Detailed asset information and status</CardDescription>
                </div>
                <Button onClick={() => exportToCSV(reportData.assets, 'assets-report.csv')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.assets.slice(0, 50).map((asset) => (
                      <TableRow key={asset.$id}>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatCategory(asset.category)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(asset.availableStatus)}>
                            {asset.availableStatus.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getConditionBadgeColor(asset.currentCondition)}>
                            {asset.currentCondition.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(asset.currentValue || 0)}</TableCell>
                        <TableCell>{asset.location || 'Not specified'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {reportData.assets.length > 50 && (
                <p className="text-sm text-gray-500 mt-2">
                  Showing first 50 of {reportData.assets.length} assets. Export for full report.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Request Reports Tab */}
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Request Activity Report</CardTitle>
                  <CardDescription>Asset request history and analytics</CardDescription>
                </div>
                <Button onClick={() => exportToCSV(reportData.requests, 'requests-report.csv')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.requests.slice(0, 50).map((request) => (
                      <TableRow key={request.$id}>
                        <TableCell className="font-mono">#{request.$id.slice(-8)}</TableCell>
                        <TableCell>{request.requesterStaffId}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(request.status)}>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{request.purpose}</TableCell>
                        <TableCell>{new Date(request.$createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {request.issueDate && request.expectedReturnDate ? 
                            `${Math.ceil((new Date(request.expectedReturnDate) - new Date(request.issueDate)) / (1000 * 60 * 60 * 24))} days` : 
                            'N/A'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {reportData.requests.length > 50 && (
                <p className="text-sm text-gray-500 mt-2">
                  Showing first 50 of {reportData.requests.length} requests. Export for full report.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Reports Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Activity Report</CardTitle>
                  <CardDescription>System users and their activity levels</CardDescription>
                </div>
                <Button onClick={() => exportToCSV(reportData.users, 'users-report.csv')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requests</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.users.map((user) => {
                      const userRequests = reportData.requests.filter(r => r.requesterStaffId === user.$id).length
                      return (
                        <TableRow key={user.$id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.role}</Badge>
                          </TableCell>
                          <TableCell>{user.department_id || 'Unassigned'}</TableCell>
                          <TableCell>
                            <Badge variant={user.active ? "default" : "secondary"}>
                              {user.active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>{userRequests}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}