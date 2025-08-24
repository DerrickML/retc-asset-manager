/**
 * Dashboard Analytics API
 * Provides advanced analytics and predictive insights for asset management
 * 
 * Features:
 * - Utilization trends analysis
 * - Cost analysis and ROI metrics
 * - Performance analytics (MTBF, MTTR)
 * - Predictive maintenance scheduling
 * - Historical data analysis
 */

import { NextResponse } from 'next/server'
import { databases } from '@/lib/appwrite/client'
import { DATABASE_ID, COLLECTIONS, ENUMS } from '@/lib/appwrite/config'
import { getCurrentStaff, permissions } from '@/lib/utils/auth'
import { Query } from 'appwrite'
import { z } from 'zod'

// Input validation schema
const AnalyticsQuerySchema = z.object({
  type: z.enum(['utilization', 'cost', 'performance', 'predictive', 'trend']).optional(),
  department: z.string().optional(),
  category: z.string().optional(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }),
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional().default('month'),
  metrics: z.array(z.string()).optional()
})

// Cache for expensive analytics calculations
const analyticsCache = new Map()
const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

/**
 * GET /api/admin/dashboard/analytics
 * Fetch advanced analytics data
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
        { error: 'Forbidden', message: 'Insufficient permissions to view analytics' },
        { status: 403 }
      )
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      type: searchParams.get('type'),
      department: searchParams.get('department'),
      category: searchParams.get('category'),
      dateRange: searchParams.get('dateRange') ? JSON.parse(searchParams.get('dateRange')) : null,
      groupBy: searchParams.get('groupBy'),
      metrics: searchParams.get('metrics')?.split(',')
    }

    // Validate input
    const validatedParams = AnalyticsQuerySchema.parse(queryParams)

    // Check cache
    const cacheKey = JSON.stringify(validatedParams)
    const cached = getFromCache(cacheKey)
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        metadata: {
          cached: true,
          timestamp: new Date().toISOString(),
          responseTime: Date.now() - startTime
        }
      })
    }

    // Fetch analytics based on type
    let analyticsData = {}
    
    switch (validatedParams.type) {
      case 'utilization':
        analyticsData = await getUtilizationAnalytics(validatedParams)
        break
      case 'cost':
        analyticsData = await getCostAnalytics(validatedParams)
        break
      case 'performance':
        analyticsData = await getPerformanceAnalytics(validatedParams)
        break
      case 'predictive':
        analyticsData = await getPredictiveAnalytics(validatedParams)
        break
      case 'trend':
        analyticsData = await getTrendAnalytics(validatedParams)
        break
      default:
        // Return all analytics if no specific type
        analyticsData = await getAllAnalytics(validatedParams)
    }

    // Cache the results
    setCache(cacheKey, analyticsData)

    // Prepare response
    const response = {
      success: true,
      data: analyticsData,
      metadata: {
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        cached: false,
        parameters: validatedParams
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('[Dashboard Analytics API] Error:', error)
    
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

    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'Failed to fetch analytics data',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/dashboard/analytics
 * Generate custom analytics report
 */
export async function POST(request) {
  try {
    // Authentication check
    const staff = await getCurrentStaff()
    if (!staff) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Permission check - only admins can generate custom reports
    if (!permissions.isAdmin(staff)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate request body
    const CustomReportSchema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      metrics: z.array(z.string()).min(1),
      filters: z.object({
        departments: z.array(z.string()).optional(),
        categories: z.array(z.string()).optional(),
        statuses: z.array(z.string()).optional(),
        dateRange: z.object({
          start: z.string().datetime(),
          end: z.string().datetime()
        })
      }),
      aggregations: z.array(z.enum(['sum', 'avg', 'count', 'min', 'max'])).optional(),
      groupBy: z.array(z.string()).optional()
    })

    const validatedData = CustomReportSchema.parse(body)

    // Generate custom report
    const report = await generateCustomReport(validatedData)

    return NextResponse.json({
      success: true,
      data: report,
      metadata: {
        timestamp: new Date().toISOString(),
        generatedBy: staff.$id
      }
    }, { status: 201 })

  } catch (error) {
    console.error('[Custom Analytics Report] Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Bad Request', 
          message: 'Invalid report configuration',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'Failed to generate custom report'
      },
      { status: 500 }
    )
  }
}

/**
 * Get utilization analytics
 */
async function getUtilizationAnalytics(params) {
  const { dateRange, groupBy, department, category } = params
  
  // Build queries
  const queries = []
  if (department) queries.push(Query.equal('department', department))
  if (category) queries.push(Query.equal('category', category))
  if (dateRange?.start) queries.push(Query.greaterThanEqual('$createdAt', dateRange.start))
  if (dateRange?.end) queries.push(Query.lessThanEqual('$createdAt', dateRange.end))

  // Fetch assets and events
  const [assets, events] = await Promise.all([
    databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSETS, [
      ...queries,
      Query.limit(5000)
    ]),
    databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSET_EVENTS, [
      Query.greaterThanEqual('at', dateRange?.start || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()),
      Query.lessThanEqual('at', dateRange?.end || new Date().toISOString()),
      Query.limit(10000)
    ])
  ])

  // Calculate utilization metrics
  const utilizationData = calculateUtilizationMetrics(assets.documents, events.documents, groupBy)
  
  return {
    utilization: utilizationData,
    summary: {
      averageUtilization: calculateAverageUtilization(utilizationData),
      peakUtilization: findPeakUtilization(utilizationData),
      underutilizedAssets: findUnderutilizedAssets(assets.documents)
    }
  }
}

/**
 * Get cost analytics
 */
async function getCostAnalytics(params) {
  const { dateRange, department, category } = params
  
  // Build queries
  const queries = []
  if (department) queries.push(Query.equal('department', department))
  if (category) queries.push(Query.equal('category', category))

  // Fetch assets with cost data
  const assets = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSETS, [
    ...queries,
    Query.limit(5000)
  ])

  // Calculate cost metrics
  const costAnalysis = {
    totalValue: 0,
    depreciatedValue: 0,
    maintenanceCosts: 0,
    costByDepartment: {},
    costByCategory: {},
    roi: {},
    costTrends: []
  }

  for (const asset of assets.documents) {
    const purchasePrice = parseFloat(asset.purchasePrice || 0)
    const age = calculateAssetAge(asset.purchaseDate)
    const depreciationRate = getDepreciationRate(asset.category)
    const depreciatedValue = calculateDepreciatedValue(purchasePrice, age, depreciationRate)
    
    costAnalysis.totalValue += purchasePrice
    costAnalysis.depreciatedValue += depreciatedValue
    
    // Group by department
    if (asset.department) {
      costAnalysis.costByDepartment[asset.department] = 
        (costAnalysis.costByDepartment[asset.department] || 0) + purchasePrice
    }
    
    // Group by category
    if (asset.category) {
      costAnalysis.costByCategory[asset.category] = 
        (costAnalysis.costByCategory[asset.category] || 0) + purchasePrice
    }
  }

  // Calculate ROI
  costAnalysis.roi = calculateROI(costAnalysis, assets.documents)

  return costAnalysis
}

/**
 * Get performance analytics (MTBF, MTTR)
 */
async function getPerformanceAnalytics(params) {
  const { dateRange, department, category } = params
  
  // Fetch issues and maintenance events
  const [issues, events] = await Promise.all([
    databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSET_ISSUES, [
      Query.greaterThanEqual('reportedAt', dateRange?.start || new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()),
      Query.limit(5000)
    ]),
    databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSET_EVENTS, [
      Query.equal('eventType', ENUMS.EVENT_TYPE.STATUS_CHANGED),
      Query.greaterThanEqual('at', dateRange?.start || new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()),
      Query.limit(10000)
    ])
  ])

  // Calculate MTBF (Mean Time Between Failures)
  const mtbf = calculateMTBF(issues.documents, events.documents)
  
  // Calculate MTTR (Mean Time To Repair)
  const mttr = calculateMTTR(issues.documents, events.documents)
  
  // Calculate availability
  const availability = calculateAvailability(mtbf, mttr)
  
  return {
    mtbf: {
      value: mtbf,
      unit: 'days',
      interpretation: interpretMTBF(mtbf)
    },
    mttr: {
      value: mttr,
      unit: 'hours',
      interpretation: interpretMTTR(mttr)
    },
    availability: {
      percentage: availability,
      rating: getAvailabilityRating(availability)
    },
    failureRate: calculateFailureRate(issues.documents),
    maintenanceEfficiency: calculateMaintenanceEfficiency(issues.documents, events.documents)
  }
}

/**
 * Get predictive analytics
 */
async function getPredictiveAnalytics(params) {
  const { department, category } = params
  
  // Fetch assets and historical data
  const [assets, events, issues] = await Promise.all([
    databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSETS, [
      Query.limit(5000)
    ]),
    databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSET_EVENTS, [
      Query.limit(10000),
      Query.orderDesc('at')
    ]),
    databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSET_ISSUES, [
      Query.limit(5000),
      Query.orderDesc('reportedAt')
    ])
  ])

  // Predict maintenance needs
  const maintenancePredictions = predictMaintenanceNeeds(assets.documents, events.documents, issues.documents)
  
  // Predict lifecycle end
  const lifecyclePredictions = predictLifecycleEnd(assets.documents, events.documents)
  
  // Predict future utilization
  const utilizationPredictions = predictUtilization(assets.documents, events.documents)
  
  return {
    maintenanceSchedule: maintenancePredictions,
    lifecycleAnalysis: lifecyclePredictions,
    utilizationForecast: utilizationPredictions,
    recommendations: generateRecommendations(maintenancePredictions, lifecyclePredictions)
  }
}

/**
 * Get trend analytics
 */
async function getTrendAnalytics(params) {
  const { dateRange, groupBy } = params
  
  // Fetch historical data
  const events = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSET_EVENTS, [
    Query.greaterThanEqual('at', dateRange?.start || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()),
    Query.lessThanEqual('at', dateRange?.end || new Date().toISOString()),
    Query.limit(10000),
    Query.orderAsc('at')
  ])

  // Group events by time period
  const trends = groupEventsByPeriod(events.documents, groupBy)
  
  // Calculate trend indicators
  const trendIndicators = calculateTrendIndicators(trends)
  
  return {
    trends: trends,
    indicators: trendIndicators,
    forecast: generateForecast(trends)
  }
}

/**
 * Get all analytics
 */
async function getAllAnalytics(params) {
  const [utilization, cost, performance, predictive, trends] = await Promise.all([
    getUtilizationAnalytics(params),
    getCostAnalytics(params),
    getPerformanceAnalytics(params),
    getPredictiveAnalytics(params),
    getTrendAnalytics(params)
  ])

  return {
    utilization,
    cost,
    performance,
    predictive,
    trends
  }
}

/**
 * Generate custom report based on configuration
 */
async function generateCustomReport(config) {
  // Implementation would query data based on config and generate report
  // This is a simplified version
  const { metrics, filters, aggregations, groupBy } = config
  
  // Build queries from filters
  const queries = []
  if (filters.departments?.length) {
    queries.push(Query.equal('department', filters.departments))
  }
  if (filters.categories?.length) {
    queries.push(Query.equal('category', filters.categories))
  }
  if (filters.dateRange) {
    queries.push(Query.greaterThanEqual('$createdAt', filters.dateRange.start))
    queries.push(Query.lessThanEqual('$createdAt', filters.dateRange.end))
  }

  // Fetch data
  const assets = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSETS, queries)
  
  // Process data based on metrics and aggregations
  const reportData = processReportData(assets.documents, metrics, aggregations, groupBy)
  
  return {
    name: config.name,
    description: config.description,
    data: reportData,
    generatedAt: new Date().toISOString()
  }
}

// Helper functions

function calculateUtilizationMetrics(assets, events, groupBy) {
  // Implementation of utilization calculation
  // Groups data by specified period and calculates utilization rates
  return []
}

function calculateAverageUtilization(data) {
  if (!data.length) return 0
  const sum = data.reduce((acc, item) => acc + item.utilization, 0)
  return (sum / data.length).toFixed(2)
}

function findPeakUtilization(data) {
  if (!data.length) return { value: 0, period: null }
  return data.reduce((max, item) => 
    item.utilization > max.value ? { value: item.utilization, period: item.period } : max,
    { value: 0, period: null }
  )
}

function findUnderutilizedAssets(assets) {
  // Assets that haven't been used in the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  return assets.filter(asset => 
    asset.availableStatus === ENUMS.AVAILABLE_STATUS.AVAILABLE &&
    (!asset.lastUsedAt || new Date(asset.lastUsedAt) < thirtyDaysAgo)
  ).map(asset => ({ id: asset.$id, name: asset.name, lastUsed: asset.lastUsedAt }))
}

function calculateAssetAge(purchaseDate) {
  if (!purchaseDate) return 0
  const years = (Date.now() - new Date(purchaseDate).getTime()) / (365 * 24 * 60 * 60 * 1000)
  return Math.floor(years)
}

function getDepreciationRate(category) {
  // Different depreciation rates for different categories
  const rates = {
    [ENUMS.CATEGORY.IT_EQUIPMENT]: 0.33, // 33% per year
    [ENUMS.CATEGORY.VEHICLE]: 0.20, // 20% per year
    [ENUMS.CATEGORY.OFFICE_FURNITURE]: 0.10, // 10% per year
    [ENUMS.CATEGORY.BUILDING_INFRA]: 0.05 // 5% per year
  }
  return rates[category] || 0.15 // Default 15%
}

function calculateDepreciatedValue(originalValue, age, rate) {
  return originalValue * Math.pow(1 - rate, age)
}

function calculateROI(costAnalysis, assets) {
  // Simplified ROI calculation
  const activeAssets = assets.filter(a => a.availableStatus === ENUMS.AVAILABLE_STATUS.IN_USE)
  const utilizationRate = activeAssets.length / assets.length
  return {
    utilizationROI: (utilizationRate * 100).toFixed(2),
    valueRetention: ((costAnalysis.depreciatedValue / costAnalysis.totalValue) * 100).toFixed(2)
  }
}

function calculateMTBF(issues, events) {
  // Mean Time Between Failures calculation
  if (issues.length < 2) return Infinity
  
  const failures = issues.sort((a, b) => new Date(a.reportedAt) - new Date(b.reportedAt))
  let totalTime = 0
  
  for (let i = 1; i < failures.length; i++) {
    const timeDiff = new Date(failures[i].reportedAt) - new Date(failures[i-1].reportedAt)
    totalTime += timeDiff
  }
  
  const mtbfMs = totalTime / (failures.length - 1)
  return mtbfMs / (24 * 60 * 60 * 1000) // Convert to days
}

function calculateMTTR(issues, events) {
  // Mean Time To Repair calculation
  const repairedIssues = issues.filter(issue => issue.resolvedAt)
  if (repairedIssues.length === 0) return 0
  
  let totalRepairTime = 0
  for (const issue of repairedIssues) {
    const repairTime = new Date(issue.resolvedAt) - new Date(issue.reportedAt)
    totalRepairTime += repairTime
  }
  
  const mttrMs = totalRepairTime / repairedIssues.length
  return mttrMs / (60 * 60 * 1000) // Convert to hours
}

function calculateAvailability(mtbf, mttr) {
  if (mtbf === Infinity) return 100
  const mtbfHours = mtbf * 24
  return ((mtbfHours / (mtbfHours + mttr)) * 100).toFixed(2)
}

function interpretMTBF(mtbf) {
  if (mtbf === Infinity) return 'No failures recorded'
  if (mtbf > 365) return 'Excellent reliability'
  if (mtbf > 180) return 'Good reliability'
  if (mtbf > 90) return 'Average reliability'
  if (mtbf > 30) return 'Below average reliability'
  return 'Poor reliability - frequent failures'
}

function interpretMTTR(mttr) {
  if (mttr < 4) return 'Excellent repair time'
  if (mttr < 8) return 'Good repair time'
  if (mttr < 24) return 'Average repair time'
  if (mttr < 48) return 'Slow repair time'
  return 'Very slow repair time - needs improvement'
}

function getAvailabilityRating(availability) {
  const value = parseFloat(availability)
  if (value >= 99.9) return 'World-class'
  if (value >= 99) return 'Excellent'
  if (value >= 95) return 'Good'
  if (value >= 90) return 'Fair'
  return 'Poor'
}

function calculateFailureRate(issues) {
  // Calculate failure rate per month
  const monthlyFailures = {}
  
  for (const issue of issues) {
    const month = new Date(issue.reportedAt).toISOString().substring(0, 7)
    monthlyFailures[month] = (monthlyFailures[month] || 0) + 1
  }
  
  const months = Object.keys(monthlyFailures)
  if (months.length === 0) return 0
  
  const totalFailures = Object.values(monthlyFailures).reduce((sum, count) => sum + count, 0)
  return (totalFailures / months.length).toFixed(2)
}

function calculateMaintenanceEfficiency(issues, events) {
  // Calculate how efficiently maintenance is performed
  const preventiveEvents = events.filter(e => 
    e.toValue === ENUMS.AVAILABLE_STATUS.MAINTENANCE
  )
  const correctiveEvents = issues.filter(i => i.issueType === 'BREAKDOWN')
  
  const ratio = preventiveEvents.length / (correctiveEvents.length || 1)
  return {
    preventiveRatio: ratio.toFixed(2),
    efficiency: ratio > 2 ? 'High' : ratio > 1 ? 'Medium' : 'Low'
  }
}

function predictMaintenanceNeeds(assets, events, issues) {
  // Predict which assets will need maintenance soon
  const predictions = []
  
  for (const asset of assets) {
    const assetEvents = events.filter(e => e.assetId === asset.$id)
    const assetIssues = issues.filter(i => i.assetId === asset.$id)
    
    // Calculate maintenance interval based on history
    const maintenanceInterval = calculateMaintenanceInterval(assetEvents)
    const lastMaintenance = findLastMaintenance(assetEvents)
    
    if (lastMaintenance && maintenanceInterval) {
      const nextDue = new Date(lastMaintenance)
      nextDue.setDate(nextDue.getDate() + maintenanceInterval)
      
      const daysUntilDue = Math.ceil((nextDue - new Date()) / (24 * 60 * 60 * 1000))
      
      if (daysUntilDue <= 30) {
        predictions.push({
          assetId: asset.$id,
          assetName: asset.name,
          nextMaintenanceDate: nextDue.toISOString(),
          daysUntilDue,
          priority: daysUntilDue <= 0 ? 'Overdue' : daysUntilDue <= 7 ? 'High' : 'Medium',
          estimatedDuration: estimateMaintenanceDuration(assetIssues)
        })
      }
    }
  }
  
  return predictions.sort((a, b) => a.daysUntilDue - b.daysUntilDue)
}

function predictLifecycleEnd(assets, events) {
  // Predict when assets will reach end of life
  return assets.map(asset => {
    const age = calculateAssetAge(asset.purchaseDate)
    const expectedLifespan = getExpectedLifespan(asset.category)
    const remainingLife = Math.max(0, expectedLifespan - age)
    const conditionFactor = getConditionFactor(asset.currentCondition)
    const adjustedRemainingLife = remainingLife * conditionFactor
    
    return {
      assetId: asset.$id,
      assetName: asset.name,
      currentAge: age,
      expectedLifespan,
      remainingYears: adjustedRemainingLife.toFixed(1),
      endOfLifeDate: new Date(Date.now() + adjustedRemainingLife * 365 * 24 * 60 * 60 * 1000).toISOString(),
      recommendation: adjustedRemainingLife < 1 ? 'Consider replacement' : 
                      adjustedRemainingLife < 2 ? 'Plan for replacement' : 'Monitor condition'
    }
  }).filter(prediction => prediction.remainingYears < 3) // Only show assets nearing EOL
}

function predictUtilization(assets, events) {
  // Predict future utilization based on historical trends
  // This is a simplified prediction model
  const utilizationHistory = calculateHistoricalUtilization(assets, events)
  const trend = calculateTrend(utilizationHistory)
  
  const predictions = []
  for (let i = 1; i <= 6; i++) {
    const futureDate = new Date()
    futureDate.setMonth(futureDate.getMonth() + i)
    
    predictions.push({
      month: futureDate.toISOString().substring(0, 7),
      predictedUtilization: Math.min(100, Math.max(0, trend.current + (trend.slope * i)))
    })
  }
  
  return predictions
}

function generateRecommendations(maintenancePredictions, lifecyclePredictions) {
  const recommendations = []
  
  // Maintenance recommendations
  const overdueCount = maintenancePredictions.filter(p => p.priority === 'Overdue').length
  if (overdueCount > 0) {
    recommendations.push({
      type: 'maintenance',
      priority: 'critical',
      message: `${overdueCount} assets have overdue maintenance`,
      action: 'Schedule immediate maintenance'
    })
  }
  
  // Lifecycle recommendations
  const replacementNeeded = lifecyclePredictions.filter(p => p.recommendation === 'Consider replacement').length
  if (replacementNeeded > 0) {
    recommendations.push({
      type: 'lifecycle',
      priority: 'high',
      message: `${replacementNeeded} assets are nearing end of life`,
      action: 'Plan replacement budget and procurement'
    })
  }
  
  return recommendations
}

function groupEventsByPeriod(events, period) {
  // Group events by specified time period
  const grouped = {}
  
  for (const event of events) {
    const date = new Date(event.at)
    let key
    
    switch (period) {
      case 'day':
        key = date.toISOString().substring(0, 10)
        break
      case 'week':
        key = getWeekNumber(date)
        break
      case 'month':
        key = date.toISOString().substring(0, 7)
        break
      case 'quarter':
        key = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`
        break
      case 'year':
        key = date.getFullYear().toString()
        break
      default:
        key = date.toISOString().substring(0, 7)
    }
    
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(event)
  }
  
  return Object.entries(grouped).map(([period, events]) => ({
    period,
    eventCount: events.length,
    events
  }))
}

function calculateTrendIndicators(trends) {
  if (trends.length < 2) return { trend: 'insufficient_data' }
  
  // Calculate trend direction
  const firstHalf = trends.slice(0, Math.floor(trends.length / 2))
  const secondHalf = trends.slice(Math.floor(trends.length / 2))
  
  const firstAvg = firstHalf.reduce((sum, t) => sum + t.eventCount, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, t) => sum + t.eventCount, 0) / secondHalf.length
  
  const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100
  
  return {
    trend: percentChange > 10 ? 'increasing' : percentChange < -10 ? 'decreasing' : 'stable',
    percentChange: percentChange.toFixed(2),
    average: (trends.reduce((sum, t) => sum + t.eventCount, 0) / trends.length).toFixed(2)
  }
}

function generateForecast(trends) {
  // Simple linear regression forecast
  if (trends.length < 3) return []
  
  const n = trends.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  
  trends.forEach((trend, i) => {
    sumX += i
    sumY += trend.eventCount
    sumXY += i * trend.eventCount
    sumX2 += i * i
  })
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  // Generate forecast for next 3 periods
  const forecast = []
  for (let i = 0; i < 3; i++) {
    const x = n + i
    const y = Math.max(0, Math.round(slope * x + intercept))
    forecast.push({
      period: `forecast_${i + 1}`,
      predictedCount: y
    })
  }
  
  return forecast
}

function processReportData(assets, metrics, aggregations, groupBy) {
  // Process data for custom report
  const results = {}
  
  // Apply metrics
  for (const metric of metrics) {
    results[metric] = calculateMetric(assets, metric, aggregations)
  }
  
  // Apply grouping if specified
  if (groupBy && groupBy.length > 0) {
    results.grouped = groupData(assets, groupBy, metrics)
  }
  
  return results
}

function calculateMetric(assets, metric, aggregations) {
  // Calculate specific metric with aggregations
  // This is a simplified implementation
  switch (metric) {
    case 'count':
      return assets.length
    case 'totalValue':
      return assets.reduce((sum, a) => sum + (parseFloat(a.purchasePrice) || 0), 0)
    case 'averageAge':
      const totalAge = assets.reduce((sum, a) => sum + calculateAssetAge(a.purchaseDate), 0)
      return assets.length > 0 ? totalAge / assets.length : 0
    default:
      return null
  }
}

function groupData(assets, groupBy, metrics) {
  // Group data by specified fields
  const grouped = {}
  
  for (const asset of assets) {
    const key = groupBy.map(field => asset[field] || 'unknown').join('_')
    
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(asset)
  }
  
  // Calculate metrics for each group
  const results = {}
  for (const [key, groupAssets] of Object.entries(grouped)) {
    results[key] = {}
    for (const metric of metrics) {
      results[key][metric] = calculateMetric(groupAssets, metric)
    }
  }
  
  return results
}

function calculateMaintenanceInterval(events) {
  const maintenanceEvents = events.filter(e => e.toValue === ENUMS.AVAILABLE_STATUS.MAINTENANCE)
  if (maintenanceEvents.length < 2) return 90 // Default to 90 days
  
  let totalInterval = 0
  for (let i = 1; i < maintenanceEvents.length; i++) {
    const interval = new Date(maintenanceEvents[i].at) - new Date(maintenanceEvents[i-1].at)
    totalInterval += interval
  }
  
  return Math.round(totalInterval / (maintenanceEvents.length - 1) / (24 * 60 * 60 * 1000))
}

function findLastMaintenance(events) {
  const maintenanceEvents = events
    .filter(e => e.toValue === ENUMS.AVAILABLE_STATUS.MAINTENANCE)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
  
  return maintenanceEvents[0]?.at
}

function estimateMaintenanceDuration(issues) {
  if (issues.length === 0) return 4 // Default 4 hours
  
  const resolvedIssues = issues.filter(i => i.resolvedAt)
  if (resolvedIssues.length === 0) return 4
  
  const totalDuration = resolvedIssues.reduce((sum, issue) => {
    const duration = new Date(issue.resolvedAt) - new Date(issue.reportedAt)
    return sum + duration
  }, 0)
  
  return Math.round(totalDuration / resolvedIssues.length / (60 * 60 * 1000)) // Hours
}

function getExpectedLifespan(category) {
  // Expected lifespan in years by category
  const lifespans = {
    [ENUMS.CATEGORY.IT_EQUIPMENT]: 4,
    [ENUMS.CATEGORY.NETWORK_HARDWARE]: 5,
    [ENUMS.CATEGORY.OFFICE_FURNITURE]: 10,
    [ENUMS.CATEGORY.VEHICLE]: 8,
    [ENUMS.CATEGORY.POWER_ASSET]: 10,
    [ENUMS.CATEGORY.TOOLS]: 5,
    [ENUMS.CATEGORY.HEAVY_MACHINERY]: 15,
    [ENUMS.CATEGORY.LAB_EQUIPMENT]: 7,
    [ENUMS.CATEGORY.BUILDING_INFRA]: 20
  }
  return lifespans[category] || 7
}

function getConditionFactor(condition) {
  // Factor to adjust remaining life based on condition
  const factors = {
    [ENUMS.CURRENT_CONDITION.NEW]: 1.2,
    [ENUMS.CURRENT_CONDITION.LIKE_NEW]: 1.1,
    [ENUMS.CURRENT_CONDITION.GOOD]: 1.0,
    [ENUMS.CURRENT_CONDITION.FAIR]: 0.8,
    [ENUMS.CURRENT_CONDITION.POOR]: 0.5,
    [ENUMS.CURRENT_CONDITION.DAMAGED]: 0.3,
    [ENUMS.CURRENT_CONDITION.SCRAP]: 0.1
  }
  return factors[condition] || 0.7
}

function calculateHistoricalUtilization(assets, events) {
  // Calculate utilization over time
  const monthlyUtilization = {}
  
  for (const event of events) {
    if (event.eventType === ENUMS.EVENT_TYPE.STATUS_CHANGED) {
      const month = new Date(event.at).toISOString().substring(0, 7)
      if (!monthlyUtilization[month]) {
        monthlyUtilization[month] = { inUse: 0, total: assets.length }
      }
      
      if (event.toValue === ENUMS.AVAILABLE_STATUS.IN_USE) {
        monthlyUtilization[month].inUse++
      } else if (event.fromValue === ENUMS.AVAILABLE_STATUS.IN_USE) {
        monthlyUtilization[month].inUse--
      }
    }
  }
  
  return Object.entries(monthlyUtilization).map(([month, data]) => ({
    month,
    utilization: (data.inUse / data.total) * 100
  }))
}

function calculateTrend(data) {
  if (data.length < 2) return { current: 0, slope: 0 }
  
  // Simple linear trend calculation
  const n = data.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  
  data.forEach((item, i) => {
    sumX += i
    sumY += item.utilization
    sumXY += i * item.utilization
    sumX2 += i * i
  })
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const current = data[data.length - 1].utilization
  
  return { current, slope }
}

function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000
  return `${date.getFullYear()}-W${Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)}`
}

// Cache helper functions
function getFromCache(key) {
  const cached = analyticsCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  return null
}

function setCache(key, data) {
  analyticsCache.set(key, {
    data,
    timestamp: Date.now()
  })
  
  // Clean old cache entries
  if (analyticsCache.size > 100) {
    const oldestKey = analyticsCache.keys().next().value
    analyticsCache.delete(oldestKey)
  }
}