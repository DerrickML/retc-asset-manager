/**
 * Optimized Dashboard Data Service
 * Implements efficient query patterns, caching, and data aggregation for dashboard KPIs
 */

import { databases } from "../appwrite/client.js"
import { DATABASE_ID, COLLECTIONS, ENUMS } from "../appwrite/config.js"
import { Query } from "appwrite"

// Cache configuration
const CACHE_TTL = {
  METRICS: 5 * 60 * 1000,      // 5 minutes for metrics
  CHARTS: 10 * 60 * 1000,     // 10 minutes for chart data
  TRENDS: 30 * 60 * 1000,     // 30 minutes for trend analysis
  DEPARTMENTS: 60 * 60 * 1000  // 1 hour for department data
}

class DashboardCache {
  constructor() {
    this.cache = new Map()
  }

  set(key, value, ttl = CACHE_TTL.METRICS) {
    const expires = Date.now() + ttl
    this.cache.set(key, { value, expires })
  }

  get(key) {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.value
  }

  clear(pattern) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  // Clean expired entries
  cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key)
      }
    }
  }
}

const dashboardCache = new DashboardCache()

// Clean cache every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => dashboardCache.cleanup(), 10 * 60 * 1000)
}

export class DashboardService {
  
  /**
   * Get comprehensive dashboard metrics with optimized queries
   * Uses single queries with aggregation instead of multiple round trips
   */
  static async getDashboardMetrics(departmentFilter = null, forceRefresh = false) {
    const cacheKey = `metrics_${departmentFilter || 'all'}`
    
    if (!forceRefresh) {
      const cached = dashboardCache.get(cacheKey)
      if (cached) return cached
    }

    try {
      // Build optimized queries with department filtering
      const baseQueries = departmentFilter 
        ? [Query.equal("department", departmentFilter)]
        : []

      // Use Promise.all for parallel queries instead of sequential
      const [assetsResult, requestsResult, staffResult] = await Promise.all([
        // Assets query with limit optimization
        databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSETS, [
          ...baseQueries,
          Query.limit(2000), // Increase limit for more complete data
          Query.select(["$id", "availableStatus", "currentCondition", "category", "department", "custodianStaffId"])
        ]),
        
        // Requests query with status filtering
        databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSET_REQUESTS, [
          Query.limit(1000),
          Query.select(["$id", "status", "requesterStaffId", "assetId", "$createdAt"])
        ]),
        
        // Staff query for user counts
        databases.listDocuments(DATABASE_ID, COLLECTIONS.STAFF, [
          ...baseQueries,
          Query.limit(500),
          Query.select(["$id", "department", "roles"])
        ])
      ])

      // Process data efficiently using single-pass algorithms
      const metrics = this._calculateMetrics(assetsResult.documents, requestsResult.documents, staffResult.documents)
      
      // Cache results
      dashboardCache.set(cacheKey, metrics, CACHE_TTL.METRICS)
      
      return metrics
    } catch (error) {
      console.error("Failed to fetch dashboard metrics:", error)
      throw error
    }
  }

  /**
   * Get asset analytics and trends
   */
  static async getAssetAnalytics(departmentFilter = null, forceRefresh = false) {
    const cacheKey = `analytics_${departmentFilter || 'all'}`
    
    if (!forceRefresh) {
      const cached = dashboardCache.get(cacheKey)
      if (cached) return cached
    }

    try {
      const queries = departmentFilter 
        ? [Query.equal("department", departmentFilter)]
        : []

      // Get assets and events in parallel
      const [assetsResult, eventsResult] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSETS, [
          ...queries,
          Query.limit(2000),
          Query.select(["$id", "category", "availableStatus", "currentCondition", "department", "purchasePrice", "$createdAt"])
        ]),
        
        // Get recent events for trend analysis
        databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSET_EVENTS, [
          Query.limit(1000),
          Query.orderDesc("at"),
          Query.greaterThan("at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()), // Last 90 days
          Query.select(["assetId", "eventType", "at", "fromValue", "toValue"])
        ])
      ])

      const analytics = this._calculateAnalytics(assetsResult.documents, eventsResult.documents)
      
      dashboardCache.set(cacheKey, analytics, CACHE_TTL.CHARTS)
      return analytics
    } catch (error) {
      console.error("Failed to fetch asset analytics:", error)
      throw error
    }
  }

  /**
   * Get real-time alerts and notifications
   */
  static async getAlerts(departmentFilter = null) {
    const cacheKey = `alerts_${departmentFilter || 'all'}`
    const cached = dashboardCache.get(cacheKey)
    if (cached) return cached

    try {
      const queries = departmentFilter 
        ? [Query.equal("department", departmentFilter)]
        : []

      // Get assets needing attention
      const assetsResult = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSETS, [
        ...queries,
        Query.limit(500),
        Query.select(["$id", "name", "availableStatus", "currentCondition", "nextMaintenanceDue", "custodianStaffId"])
      ])

      const alerts = this._calculateAlerts(assetsResult.documents)
      
      // Cache alerts for shorter time due to real-time nature
      dashboardCache.set(cacheKey, alerts, 2 * 60 * 1000) // 2 minutes
      return alerts
    } catch (error) {
      console.error("Failed to fetch alerts:", error)
      throw error
    }
  }

  /**
   * Get department utilization data
   */
  static async getDepartmentUtilization(forceRefresh = false) {
    const cacheKey = 'department_utilization'
    
    if (!forceRefresh) {
      const cached = dashboardCache.get(cacheKey)
      if (cached) return cached
    }

    try {
      // Get departments and assets in parallel
      const [departmentsResult, assetsResult] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.DEPARTMENTS, [
          Query.limit(100),
          Query.select(["$id", "name"])
        ]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSETS, [
          Query.limit(2000),
          Query.select(["department", "availableStatus", "custodianStaffId"])
        ])
      ])

      const utilization = this._calculateDepartmentUtilization(
        departmentsResult.documents, 
        assetsResult.documents
      )
      
      dashboardCache.set(cacheKey, utilization, CACHE_TTL.DEPARTMENTS)
      return utilization
    } catch (error) {
      console.error("Failed to fetch department utilization:", error)
      throw error
    }
  }

  /**
   * Efficient metrics calculation using single-pass algorithms
   */
  static _calculateMetrics(assets, requests, staff) {
    const metrics = {
      totalAssets: assets.length,
      availableAssets: 0,
      inUseAssets: 0,
      maintenanceAssets: 0,
      reservedAssets: 0,
      retiredAssets: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      deniedRequests: 0,
      totalUsers: staff.length,
      activeUsers: 0,
      assetsByCategory: {},
      assetsByCondition: {},
      requestsByStatus: {}
    }

    // Single pass through assets
    for (const asset of assets) {
      // Count by status
      switch (asset.availableStatus) {
        case ENUMS.AVAILABLE_STATUS.AVAILABLE:
          metrics.availableAssets++
          break
        case ENUMS.AVAILABLE_STATUS.IN_USE:
          metrics.inUseAssets++
          break
        case ENUMS.AVAILABLE_STATUS.MAINTENANCE:
        case ENUMS.AVAILABLE_STATUS.REPAIR_REQUIRED:
        case ENUMS.AVAILABLE_STATUS.OUT_FOR_SERVICE:
          metrics.maintenanceAssets++
          break
        case ENUMS.AVAILABLE_STATUS.RESERVED:
          metrics.reservedAssets++
          break
        case ENUMS.AVAILABLE_STATUS.RETIRED:
        case ENUMS.AVAILABLE_STATUS.DISPOSED:
          metrics.retiredAssets++
          break
      }

      // Count by category
      const category = asset.category || 'Uncategorized'
      metrics.assetsByCategory[category] = (metrics.assetsByCategory[category] || 0) + 1

      // Count by condition
      const condition = asset.currentCondition || 'Unknown'
      metrics.assetsByCondition[condition] = (metrics.assetsByCondition[condition] || 0) + 1
    }

    // Single pass through requests
    for (const request of requests) {
      switch (request.status) {
        case ENUMS.REQUEST_STATUS.PENDING:
          metrics.pendingRequests++
          break
        case ENUMS.REQUEST_STATUS.APPROVED:
        case ENUMS.REQUEST_STATUS.FULFILLED:
          metrics.approvedRequests++
          break
        case ENUMS.REQUEST_STATUS.DENIED:
          metrics.deniedRequests++
          break
      }
      
      metrics.requestsByStatus[request.status] = (metrics.requestsByStatus[request.status] || 0) + 1
    }

    // Count active users (those with custodian assignments)
    const activeCustodians = new Set(assets.map(a => a.custodianStaffId).filter(Boolean))
    metrics.activeUsers = activeCustodians.size

    return metrics
  }

  /**
   * Calculate analytics and trends
   */
  static _calculateAnalytics(assets, events) {
    const analytics = {
      categoryDistribution: [],
      statusTrends: {},
      conditionTrends: {},
      costAnalysis: {
        totalValue: 0,
        avgAssetValue: 0,
        valueByCategory: {}
      },
      utilizationTrends: []
    }

    // Process assets for distribution and cost analysis
    const categoryMap = {}
    let totalValue = 0

    for (const asset of assets) {
      const category = asset.category || 'Uncategorized'
      categoryMap[category] = (categoryMap[category] || 0) + 1
      
      if (asset.purchasePrice) {
        totalValue += parseFloat(asset.purchasePrice)
        analytics.costAnalysis.valueByCategory[category] = 
          (analytics.costAnalysis.valueByCategory[category] || 0) + parseFloat(asset.purchasePrice)
      }
    }

    // Convert category map to array with percentages
    analytics.categoryDistribution = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / assets.length) * 100).toFixed(1)
    }))

    analytics.costAnalysis.totalValue = totalValue
    analytics.costAnalysis.avgAssetValue = assets.length > 0 ? totalValue / assets.length : 0

    // Process events for trends (simplified - in real implementation, you'd group by time periods)
    const eventsByMonth = {}
    for (const event of events) {
      const month = new Date(event.at).toISOString().substring(0, 7) // YYYY-MM format
      if (!eventsByMonth[month]) {
        eventsByMonth[month] = { statusChanges: 0, conditionChanges: 0 }
      }
      
      if (event.eventType === ENUMS.EVENT_TYPE.STATUS_CHANGED) {
        eventsByMonth[month].statusChanges++
      } else if (event.eventType === ENUMS.EVENT_TYPE.CONDITION_CHANGED) {
        eventsByMonth[month].conditionChanges++
      }
    }

    return analytics
  }

  /**
   * Calculate real-time alerts
   */
  static _calculateAlerts(assets) {
    const alerts = {
      maintenanceDue: [],
      maintenanceOverdue: [],
      damagedAssets: [],
      unassignedAssets: []
    }

    const now = new Date()

    for (const asset of assets) {
      // Maintenance alerts
      if (asset.nextMaintenanceDue) {
        const dueDate = new Date(asset.nextMaintenanceDue)
        const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24))
        
        if (daysUntilDue < 0) {
          alerts.maintenanceOverdue.push({
            assetId: asset.$id,
            name: asset.name,
            daysOverdue: Math.abs(daysUntilDue)
          })
        } else if (daysUntilDue <= 7) {
          alerts.maintenanceDue.push({
            assetId: asset.$id,
            name: asset.name,
            daysUntilDue
          })
        }
      }

      // Condition alerts
      if ([ENUMS.CURRENT_CONDITION.DAMAGED, ENUMS.CURRENT_CONDITION.POOR].includes(asset.currentCondition)) {
        alerts.damagedAssets.push({
          assetId: asset.$id,
          name: asset.name,
          condition: asset.currentCondition
        })
      }

      // Assignment alerts
      if ([ENUMS.AVAILABLE_STATUS.IN_USE, ENUMS.AVAILABLE_STATUS.AWAITING_DEPLOY].includes(asset.availableStatus) && !asset.custodianStaffId) {
        alerts.unassignedAssets.push({
          assetId: asset.$id,
          name: asset.name,
          status: asset.availableStatus
        })
      }
    }

    return alerts
  }

  /**
   * Calculate department utilization
   */
  static _calculateDepartmentUtilization(departments, assets) {
    const utilization = []
    
    // Group assets by department
    const assetsByDept = {}
    for (const asset of assets) {
      const dept = asset.department || 'Unassigned'
      if (!assetsByDept[dept]) {
        assetsByDept[dept] = { total: 0, inUse: 0 }
      }
      assetsByDept[dept].total++
      if (asset.availableStatus === ENUMS.AVAILABLE_STATUS.IN_USE) {
        assetsByDept[dept].inUse++
      }
    }

    // Calculate utilization percentages
    for (const dept of departments) {
      const deptAssets = assetsByDept[dept.name] || { total: 0, inUse: 0 }
      const utilizationRate = deptAssets.total > 0 ? (deptAssets.inUse / deptAssets.total) * 100 : 0
      
      utilization.push({
        department: dept.name,
        totalAssets: deptAssets.total,
        assetsInUse: deptAssets.inUse,
        utilizationRate: Math.round(utilizationRate)
      })
    }

    return utilization.sort((a, b) => b.utilizationRate - a.utilizationRate)
  }

  /**
   * Clear cache by pattern
   */
  static clearCache(pattern) {
    dashboardCache.clear(pattern)
  }

  /**
   * Force refresh all dashboard data
   */
  static async refreshAll(departmentFilter = null) {
    this.clearCache()
    
    return Promise.all([
      this.getDashboardMetrics(departmentFilter, true),
      this.getAssetAnalytics(departmentFilter, true),
      this.getAlerts(departmentFilter),
      this.getDepartmentUtilization(true)
    ])
  }
}

export default DashboardService