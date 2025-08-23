"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Progress } from "../../components/ui/progress"
import { 
  Package, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Plus,
  FileText,
  TrendingUp
} from "lucide-react"
import { assetsService, assetRequestsService, staffService } from "../../lib/appwrite/provider.js"
import { getCurrentStaff } from "../../lib/utils/auth.js"
import { ENUMS } from "../../lib/appwrite/config.js"
import { formatCategory } from "../../lib/utils/mappings.js"

export default function Dashboard() {
  const [staff, setStaff] = useState(null)
  const [stats, setStats] = useState({
    totalAssets: 0,
    myAssets: 0,
    pendingRequests: 0,
    approvedRequests: 0,
  })
  const [recentRequests, setRecentRequests] = useState([])
  const [myAssets, setMyAssets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Get current staff member
      const currentStaff = await getCurrentStaff()
      if (!currentStaff) {
        window.location.href = "/login"
        return
      }
      setStaff(currentStaff)

      // Load dashboard data
      const [allAssetsResult, myRequestsResult, staffAssetsResult] = await Promise.all([
        assetsService.list(),
        assetRequestsService.getByStaff(currentStaff.$id),
        assetsService.getByStaff(currentStaff.$id)
      ])

      // Extract document arrays from service responses
      const allAssets = allAssetsResult.documents || []
      const myRequests = myRequestsResult.documents || []
      const staffAssets = staffAssetsResult.documents || []

      // Calculate stats
      const pendingRequests = myRequests.filter(r => r.status === ENUMS.REQUEST_STATUS.PENDING).length
      const approvedRequests = myRequests.filter(r => r.status === ENUMS.REQUEST_STATUS.APPROVED).length

      setStats({
        totalAssets: allAssetsResult.total || allAssets.length,
        myAssets: staffAssetsResult.total || staffAssets.length,
        pendingRequests,
        approvedRequests,
      })

      // Set recent requests (last 5)
      const sortedRequests = myRequests.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt))
      setRecentRequests(sortedRequests.slice(0, 5))

      // Set my assets (last 5)
      const sortedAssets = staffAssets.sort((a, b) => new Date(b.$updatedAt) - new Date(a.$updatedAt))
      setMyAssets(sortedAssets.slice(0, 5))

    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case ENUMS.REQUEST_STATUS.PENDING:
        return "bg-yellow-100 text-yellow-800"
      case ENUMS.REQUEST_STATUS.APPROVED:
        return "bg-green-100 text-green-800"
      case ENUMS.REQUEST_STATUS.DENIED:
        return "bg-red-100 text-red-800"
      case ENUMS.REQUEST_STATUS.FULFILLED:
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAvailabilityColor = (status) => {
    switch (status) {
      case ENUMS.AVAILABLE_STATUS.AVAILABLE:
        return "bg-green-100 text-green-800"
      case ENUMS.AVAILABLE_STATUS.IN_USE:
        return "bg-blue-100 text-blue-800"
      case ENUMS.AVAILABLE_STATUS.MAINTENANCE:
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {staff?.name}</p>
        </div>
        <Button asChild>
          <Link href="/requests/new">
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssets}</div>
            <p className="text-xs text-muted-foreground">Available in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Assets</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myAssets}</div>
            <p className="text-xs text-muted-foreground">Currently assigned to me</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Requests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedRequests}</div>
            <p className="text-xs text-muted-foreground">Ready for pickup</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
            <CardDescription>Your latest asset requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentRequests.length > 0 ? (
              recentRequests.map((request) => (
                <div key={request.$id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{request.assetName || 'Asset Request'}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(request.$createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={getStatusColor(request.status)}>
                    {request.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600">No recent requests</p>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link href="/requests">View All Requests</Link>
            </Button>
          </CardContent>
        </Card>

        {/* My Assets */}
        <Card>
          <CardHeader>
            <CardTitle>My Assets</CardTitle>
            <CardDescription>Assets currently assigned to you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {myAssets.length > 0 ? (
              myAssets.map((asset) => (
                <div key={asset.$id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{asset.name}</p>
                    <p className="text-xs text-gray-600">{formatCategory(asset.category)}</p>
                  </div>
                  <Badge className={getAvailabilityColor(asset.availableStatus)}>
                    {asset.availableStatus === ENUMS.AVAILABLE_STATUS.IN_USE ? 'In Use' : asset.availableStatus}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600">No assets currently assigned</p>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link href="/assets">Browse Assets</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/assets">
                <Package className="h-6 w-6 mb-2" />
                Browse Assets
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/requests/new">
                <Plus className="h-6 w-6 mb-2" />
                New Request
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/requests">
                <FileText className="h-6 w-6 mb-2" />
                My Requests
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/guest">
                <CheckCircle className="h-6 w-6 mb-2" />
                Guest Portal
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}