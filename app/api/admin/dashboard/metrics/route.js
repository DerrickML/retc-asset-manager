/**
 * Dashboard Metrics API
 * Provides comprehensive KPIs and metrics for the admin dashboard
 * 
 * Features:
 * - Real-time asset statistics
 * - Department-wise analytics
 * - Role-based data filtering
 * - Caching for performance optimization
 * - Input validation and sanitization
 */

import { NextResponse } from 'next/server'
import { DashboardService } from '@/lib/services/dashboard-service'
import { getCurrentStaff, permissions } from '@/lib/utils/auth'
import { ENUMS } from '@/lib/appwrite/config'
import { z } from 'zod'

// Input validation schema
const MetricsQuerySchema = z.object({
  department: z.string().optional(),
  forceRefresh: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
  dateRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional()
  }).optional(),
  granularity: z.enum(['hour', 'day', 'week', 'month']).optional().default('day')
})

// Rate limiting configuration
const rateLimiter = new Map()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30

/**
 * Check rate limit for a user
 */
function checkRateLimit(userId) {
  const now = Date.now()
  const userLimit = rateLimiter.get(userId) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW }
  
  if (now > userLimit.resetTime) {
    userLimit.count = 1
    userLimit.resetTime = now + RATE_LIMIT_WINDOW
  } else {
    userLimit.count++
  }
  
  rateLimiter.set(userId, userLimit)
  
  if (userLimit.count > RATE_LIMIT_MAX_REQUESTS) {
    return false
  }
  
  return true
}

/**
 * GET /api/admin/dashboard/metrics
 * Fetch comprehensive dashboard metrics
 */
export async function GET(request) {
  const startTime = Date.now()
  
  try {
    // Authentication check
    const staff = await getCurrentStaff()
    if (!staff) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Permission check
    if (!permissions.canViewReports(staff)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions to view metrics' },
        { status: 403 }
      )
    }

    // Rate limiting
    if (!checkRateLimit(staff.$id)) {
      return NextResponse.json(
        { error: 'Too Many Requests', message: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      department: searchParams.get('department'),
      forceRefresh: searchParams.get('forceRefresh'),
      dateRange: searchParams.get('dateRange') ? JSON.parse(searchParams.get('dateRange')) : undefined,
      granularity: searchParams.get('granularity')
    }

    // Validate input
    const validatedParams = MetricsQuerySchema.parse(queryParams)

    // Apply role-based filtering
    let departmentFilter = validatedParams.department
    
    // Senior managers can only see their department's data
    if (hasRole(staff, ENUMS.ROLES.SENIOR_MANAGER) && 
        !hasRole(staff, ENUMS.ROLES.SYSTEM_ADMIN) && 
        !hasRole(staff, ENUMS.ROLES.ASSET_ADMIN)) {
      departmentFilter = staff.department
    }

    // Fetch metrics from service
    const [metrics, analytics, alerts, utilization] = await Promise.all([
      DashboardService.getDashboardMetrics(departmentFilter, validatedParams.forceRefresh),
      DashboardService.getAssetAnalytics(departmentFilter, validatedParams.forceRefresh),
      DashboardService.getAlerts(departmentFilter),
      DashboardService.getDepartmentUtilization(validatedParams.forceRefresh)
    ])

    // Calculate additional KPIs
    const kpis = calculateKPIs(metrics, analytics)

    // Prepare response with comprehensive metrics
    const response = {
      success: true,
      data: {
        metrics: {
          assets: {
            total: metrics.totalAssets,
            available: metrics.availableAssets,
            inUse: metrics.inUseAssets,
            maintenance: metrics.maintenanceAssets,
            reserved: metrics.reservedAssets,
            retired: metrics.retiredAssets
          },
          requests: {
            pending: metrics.pendingRequests,
            approved: metrics.approvedRequests,
            denied: metrics.deniedRequests,
            byStatus: metrics.requestsByStatus
          },
          users: {
            total: metrics.totalUsers,
            active: metrics.activeUsers
          },
          categories: metrics.assetsByCategory,
          conditions: metrics.assetsByCondition
        },
        analytics: {
          categoryDistribution: analytics.categoryDistribution,
          statusTrends: analytics.statusTrends,
          conditionTrends: analytics.conditionTrends,
          costAnalysis: analytics.costAnalysis,
          utilizationTrends: analytics.utilizationTrends
        },
        alerts: {
          critical: alerts.maintenanceOverdue.length + alerts.damagedAssets.length,
          warning: alerts.maintenanceDue.length + alerts.unassignedAssets.length,
          details: alerts
        },
        utilization: {
          byDepartment: utilization,
          overall: calculateOverallUtilization(utilization)
        },
        kpis: kpis
      },
      metadata: {
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        cached: !validatedParams.forceRefresh,
        department: departmentFilter,
        userRole: staff.roles
      }
    }

    // Set cache headers
    const headers = {
      'Cache-Control': validatedParams.forceRefresh ? 'no-cache' : 'private, max-age=300',
      'X-Response-Time': `${Date.now() - startTime}ms`
    }

    return NextResponse.json(response, { status: 200, headers })

  } catch (error) {
    console.error('[Dashboard Metrics API] Error:', error)
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Bad Request', 
          message: 'Invalid query parameters',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    // Handle other errors
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'Failed to fetch dashboard metrics',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate Key Performance Indicators
 */
function calculateKPIs(metrics, analytics) {
  const totalAssets = metrics.totalAssets || 1 // Prevent division by zero
  
  return {
    assetUtilizationRate: ((metrics.inUseAssets / totalAssets) * 100).toFixed(2),
    maintenanceRate: ((metrics.maintenanceAssets / totalAssets) * 100).toFixed(2),
    availabilityRate: ((metrics.availableAssets / totalAssets) * 100).toFixed(2),
    requestFulfillmentRate: metrics.pendingRequests + metrics.approvedRequests > 0
      ? ((metrics.approvedRequests / (metrics.pendingRequests + metrics.approvedRequests)) * 100).toFixed(2)
      : 0,
    averageAssetValue: analytics.costAnalysis?.avgAssetValue?.toFixed(2) || 0,
    totalAssetValue: analytics.costAnalysis?.totalValue?.toFixed(2) || 0,
    assetsPerUser: metrics.totalUsers > 0 
      ? (totalAssets / metrics.totalUsers).toFixed(2) 
      : 0,
    activeUserRate: metrics.totalUsers > 0
      ? ((metrics.activeUsers / metrics.totalUsers) * 100).toFixed(2)
      : 0
  }
}

/**
 * Calculate overall utilization across all departments
 */
function calculateOverallUtilization(departmentUtilization) {
  if (!departmentUtilization || departmentUtilization.length === 0) {
    return { rate: 0, totalAssets: 0, assetsInUse: 0 }
  }
  
  const totals = departmentUtilization.reduce(
    (acc, dept) => ({
      totalAssets: acc.totalAssets + dept.totalAssets,
      assetsInUse: acc.assetsInUse + dept.assetsInUse
    }),
    { totalAssets: 0, assetsInUse: 0 }
  )
  
  return {
    rate: totals.totalAssets > 0 
      ? ((totals.assetsInUse / totals.totalAssets) * 100).toFixed(2)
      : 0,
    ...totals
  }
}

/**
 * Helper function to check user roles
 */
function hasRole(staff, role) {
  return staff.roles && staff.roles.includes(role)
}