/**
 * Alert Management API
 * Manages critical alerts and notifications for the admin dashboard
 * 
 * Features:
 * - Critical alert detection and management
 * - Alert acknowledgment and resolution workflows
 * - Escalation management
 * - Notification preferences
 * - Alert history and analytics
 */

import { NextResponse } from 'next/server'
import { databases } from '@/lib/appwrite/client'
import { DATABASE_ID, COLLECTIONS, ENUMS } from '@/lib/appwrite/config'
import { getCurrentStaff, permissions } from '@/lib/utils/auth'
import { Query, ID } from 'appwrite'
import { z } from 'zod'

// Alert types and priorities
const ALERT_TYPES = {
  MAINTENANCE_OVERDUE: 'maintenance_overdue',
  MAINTENANCE_DUE: 'maintenance_due',
  ASSET_DAMAGED: 'asset_damaged',
  ASSET_UNASSIGNED: 'asset_unassigned',
  REQUEST_PENDING: 'request_pending',
  RETURN_OVERDUE: 'return_overdue',
  LOW_AVAILABILITY: 'low_availability',
  HIGH_UTILIZATION: 'high_utilization',
  WARRANTY_EXPIRING: 'warranty_expiring',
  COMPLIANCE_VIOLATION: 'compliance_violation',
  SYSTEM_ERROR: 'system_error'
}

const ALERT_PRIORITIES = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info'
}

const ALERT_STATUSES = {
  NEW: 'new',
  ACKNOWLEDGED: 'acknowledged',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
  ESCALATED: 'escalated'
}

// Input validation schemas
const AlertQuerySchema = z.object({
  type: z.enum(Object.values(ALERT_TYPES)).optional(),
  priority: z.enum(Object.values(ALERT_PRIORITIES)).optional(),
  status: z.enum(Object.values(ALERT_STATUSES)).optional(),
  department: z.string().optional(),
  assignedTo: z.string().optional(),
  dateRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional()
  }).optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0)
})

const AlertActionSchema = z.object({
  alertId: z.string(),
  action: z.enum(['acknowledge', 'resolve', 'dismiss', 'escalate', 'assign']),
  notes: z.string().optional(),
  assignTo: z.string().optional(),
  resolution: z.string().optional()
})

const AlertPreferencesSchema = z.object({
  enableEmailNotifications: z.boolean(),
  enablePushNotifications: z.boolean(),
  enableSmsNotifications: z.boolean(),
  alertTypes: z.array(z.enum(Object.values(ALERT_TYPES))),
  priorities: z.array(z.enum(Object.values(ALERT_PRIORITIES))),
  quietHours: z.object({
    enabled: z.boolean(),
    start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
  }).optional(),
  escalationRules: z.array(z.object({
    priority: z.enum(Object.values(ALERT_PRIORITIES)),
    escalateAfterMinutes: z.number().min(1),
    escalateTo: z.array(z.string())
  })).optional()
})

// Alert storage (in production, this would be in a database)
const alertsCache = new Map()
const alertPreferences = new Map()

/**
 * GET /api/admin/dashboard/alerts
 * Retrieve alerts based on filters
 */
export async function GET(request) {
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
        { error: 'Forbidden', message: 'Insufficient permissions to view alerts' },
        { status: 403 }
      )
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      type: searchParams.get('type'),
      priority: searchParams.get('priority'),
      status: searchParams.get('status'),
      department: searchParams.get('department'),
      assignedTo: searchParams.get('assignedTo'),
      dateRange: searchParams.get('dateRange') ? JSON.parse(searchParams.get('dateRange')) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')) : undefined
    }

    // Validate input
    const validatedParams = AlertQuerySchema.parse(queryParams)

    // Generate current alerts
    const currentAlerts = await generateCurrentAlerts(staff, validatedParams)
    
    // Get historical alerts from cache/database
    const historicalAlerts = await getHistoricalAlerts(validatedParams)
    
    // Combine and filter alerts
    let allAlerts = [...currentAlerts, ...historicalAlerts]
    
    // Apply filters
    if (validatedParams.type) {
      allAlerts = allAlerts.filter(a => a.type === validatedParams.type)
    }
    if (validatedParams.priority) {
      allAlerts = allAlerts.filter(a => a.priority === validatedParams.priority)
    }
    if (validatedParams.status) {
      allAlerts = allAlerts.filter(a => a.status === validatedParams.status)
    }
    if (validatedParams.department) {
      allAlerts = allAlerts.filter(a => a.department === validatedParams.department)
    }
    if (validatedParams.assignedTo) {
      allAlerts = allAlerts.filter(a => a.assignedTo === validatedParams.assignedTo)
    }
    
    // Sort by priority and timestamp
    allAlerts.sort((a, b) => {
      const priorityOrder = {
        [ALERT_PRIORITIES.CRITICAL]: 0,
        [ALERT_PRIORITIES.HIGH]: 1,
        [ALERT_PRIORITIES.MEDIUM]: 2,
        [ALERT_PRIORITIES.LOW]: 3,
        [ALERT_PRIORITIES.INFO]: 4
      }
      
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      
      return new Date(b.timestamp) - new Date(a.timestamp)
    })
    
    // Apply pagination
    const paginatedAlerts = allAlerts.slice(
      validatedParams.offset,
      validatedParams.offset + validatedParams.limit
    )
    
    // Calculate statistics
    const statistics = calculateAlertStatistics(allAlerts)
    
    return NextResponse.json({
      success: true,
      data: {
        alerts: paginatedAlerts,
        total: allAlerts.length,
        statistics,
        pagination: {
          limit: validatedParams.limit,
          offset: validatedParams.offset,
          hasMore: validatedParams.offset + validatedParams.limit < allAlerts.length
        }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        filters: validatedParams
      }
    })

  } catch (error) {
    console.error('[Alerts API] Error:', error)
    
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
        message: 'Failed to fetch alerts'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/dashboard/alerts
 * Perform action on an alert
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

    // Permission check
    if (!permissions.canManageAssets(staff)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions to manage alerts' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate request body
    const validatedData = AlertActionSchema.parse(body)
    
    // Process alert action
    const result = await processAlertAction(validatedData, staff)
    
    // Send notifications if needed
    await sendAlertNotifications(result, validatedData.action)
    
    return NextResponse.json({
      success: true,
      message: `Alert ${validatedData.action} successfully`,
      data: result
    })

  } catch (error) {
    console.error('[Alert Action] Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Bad Request', 
          message: 'Invalid action data',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'Failed to process alert action'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/dashboard/alerts/preferences
 * Update alert preferences
 */
export async function PUT(request) {
  try {
    // Authentication check
    const staff = await getCurrentStaff()
    if (!staff) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate preferences
    const validatedPreferences = AlertPreferencesSchema.parse(body)
    
    // Save preferences
    alertPreferences.set(staff.$id, validatedPreferences)
    
    // In production, save to database
    // await saveAlertPreferences(staff.$id, validatedPreferences)
    
    return NextResponse.json({
      success: true,
      message: 'Alert preferences updated successfully',
      data: validatedPreferences
    })

  } catch (error) {
    console.error('[Alert Preferences] Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Bad Request', 
          message: 'Invalid preferences data',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'Failed to update preferences'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/dashboard/alerts/:id
 * Delete or dismiss an alert
 */
export async function DELETE(request) {
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
    if (!permissions.canManageAssets(staff)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get alert ID from URL
    const url = new URL(request.url)
    const alertId = url.pathname.split('/').pop()
    
    if (!alertId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Alert ID required' },
        { status: 400 }
      )
    }

    // Delete/dismiss alert
    const result = await dismissAlert(alertId, staff.$id)
    
    return NextResponse.json({
      success: true,
      message: 'Alert dismissed successfully',
      data: result
    })

  } catch (error) {
    console.error('[Delete Alert] Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'Failed to dismiss alert'
      },
      { status: 500 }
    )
  }
}

/**
 * Generate current alerts based on system state
 */
async function generateCurrentAlerts(staff, params) {
  const alerts = []
  
  // Fetch data for alert generation
  const [assets, requests, issues, returns] = await Promise.all([
    databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSETS, [
      Query.limit(5000)
    ]),
    databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSET_REQUESTS, [
      Query.equal('status', ENUMS.REQUEST_STATUS.PENDING),
      Query.limit(1000)
    ]),
    databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSET_ISSUES, [
      Query.isNull('resolvedAt'),
      Query.limit(1000)
    ]),
    databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSET_RETURNS, [
      Query.isNull('actualReturnDate'),
      Query.limit(1000)
    ])
  ])
  
  const now = new Date()
  
  // Check for maintenance alerts
  for (const asset of assets.documents) {
    if (asset.nextMaintenanceDue) {
      const dueDate = new Date(asset.nextMaintenanceDue)
      const daysUntilDue = Math.ceil((dueDate - now) / (24 * 60 * 60 * 1000))
      
      if (daysUntilDue < 0) {
        alerts.push({
          id: `maint_overdue_${asset.$id}`,
          type: ALERT_TYPES.MAINTENANCE_OVERDUE,
          priority: ALERT_PRIORITIES.CRITICAL,
          status: ALERT_STATUSES.NEW,
          title: 'Maintenance Overdue',
          message: `Asset ${asset.name} (${asset.assetTag}) is ${Math.abs(daysUntilDue)} days overdue for maintenance`,
          assetId: asset.$id,
          assetName: asset.name,
          department: asset.department,
          daysOverdue: Math.abs(daysUntilDue),
          timestamp: new Date().toISOString(),
          actionRequired: 'Schedule immediate maintenance',
          link: `/admin/assets/${asset.$id}`
        })
      } else if (daysUntilDue <= 7) {
        alerts.push({
          id: `maint_due_${asset.$id}`,
          type: ALERT_TYPES.MAINTENANCE_DUE,
          priority: ALERT_PRIORITIES.HIGH,
          status: ALERT_STATUSES.NEW,
          title: 'Maintenance Due Soon',
          message: `Asset ${asset.name} (${asset.assetTag}) requires maintenance in ${daysUntilDue} days`,
          assetId: asset.$id,
          assetName: asset.name,
          department: asset.department,
          daysUntilDue,
          timestamp: new Date().toISOString(),
          actionRequired: 'Schedule maintenance',
          link: `/admin/assets/${asset.$id}`
        })
      }
    }
    
    // Check for damaged assets
    if ([ENUMS.CURRENT_CONDITION.DAMAGED, ENUMS.CURRENT_CONDITION.POOR].includes(asset.currentCondition)) {
      alerts.push({
        id: `damaged_${asset.$id}`,
        type: ALERT_TYPES.ASSET_DAMAGED,
        priority: asset.currentCondition === ENUMS.CURRENT_CONDITION.DAMAGED ? 
          ALERT_PRIORITIES.HIGH : ALERT_PRIORITIES.MEDIUM,
        status: ALERT_STATUSES.NEW,
        title: 'Asset in Poor Condition',
        message: `Asset ${asset.name} (${asset.assetTag}) is in ${asset.currentCondition} condition`,
        assetId: asset.$id,
        assetName: asset.name,
        department: asset.department,
        condition: asset.currentCondition,
        timestamp: new Date().toISOString(),
        actionRequired: 'Inspect and repair asset',
        link: `/admin/assets/${asset.$id}`
      })
    }
    
    // Check for unassigned in-use assets
    if (asset.availableStatus === ENUMS.AVAILABLE_STATUS.IN_USE && !asset.custodianStaffId) {
      alerts.push({
        id: `unassigned_${asset.$id}`,
        type: ALERT_TYPES.ASSET_UNASSIGNED,
        priority: ALERT_PRIORITIES.MEDIUM,
        status: ALERT_STATUSES.NEW,
        title: 'In-Use Asset Without Custodian',
        message: `Asset ${asset.name} (${asset.assetTag}) is marked as in-use but has no assigned custodian`,
        assetId: asset.$id,
        assetName: asset.name,
        department: asset.department,
        timestamp: new Date().toISOString(),
        actionRequired: 'Assign custodian to asset',
        link: `/admin/assets/${asset.$id}`
      })
    }
    
    // Check for warranty expiry
    if (asset.warrantyExpiry) {
      const expiryDate = new Date(asset.warrantyExpiry)
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (24 * 60 * 60 * 1000))
      
      if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
        alerts.push({
          id: `warranty_${asset.$id}`,
          type: ALERT_TYPES.WARRANTY_EXPIRING,
          priority: ALERT_PRIORITIES.LOW,
          status: ALERT_STATUSES.NEW,
          title: 'Warranty Expiring Soon',
          message: `Warranty for ${asset.name} (${asset.assetTag}) expires in ${daysUntilExpiry} days`,
          assetId: asset.$id,
          assetName: asset.name,
          department: asset.department,
          expiryDate: asset.warrantyExpiry,
          daysUntilExpiry,
          timestamp: new Date().toISOString(),
          actionRequired: 'Review warranty renewal options',
          link: `/admin/assets/${asset.$id}`
        })
      }
    }
  }
  
  // Check for pending requests
  const oldRequests = requests.documents.filter(r => {
    const daysPending = Math.ceil((now - new Date(r.$createdAt)) / (24 * 60 * 60 * 1000))
    return daysPending > 3
  })
  
  if (oldRequests.length > 0) {
    alerts.push({
      id: 'pending_requests',
      type: ALERT_TYPES.REQUEST_PENDING,
      priority: ALERT_PRIORITIES.MEDIUM,
      status: ALERT_STATUSES.NEW,
      title: 'Pending Requests Require Attention',
      message: `${oldRequests.length} asset requests have been pending for more than 3 days`,
      count: oldRequests.length,
      timestamp: new Date().toISOString(),
      actionRequired: 'Review and process pending requests',
      link: '/admin/requests'
    })
  }
  
  // Check for overdue returns
  const overdueReturns = returns.documents.filter(r => {
    const expectedDate = new Date(r.expectedReturnDate)
    return expectedDate < now
  })
  
  for (const returnItem of overdueReturns) {
    const daysOverdue = Math.ceil((now - new Date(returnItem.expectedReturnDate)) / (24 * 60 * 60 * 1000))
    
    alerts.push({
      id: `return_overdue_${returnItem.$id}`,
      type: ALERT_TYPES.RETURN_OVERDUE,
      priority: daysOverdue > 7 ? ALERT_PRIORITIES.HIGH : ALERT_PRIORITIES.MEDIUM,
      status: ALERT_STATUSES.NEW,
      title: 'Asset Return Overdue',
      message: `Asset return is ${daysOverdue} days overdue`,
      returnId: returnItem.$id,
      assetId: returnItem.assetId,
      daysOverdue,
      expectedDate: returnItem.expectedReturnDate,
      timestamp: new Date().toISOString(),
      actionRequired: 'Follow up on overdue return',
      link: `/admin/returns/${returnItem.$id}`
    })
  }
  
  // Check for low availability
  const availableCount = assets.documents.filter(a => 
    a.availableStatus === ENUMS.AVAILABLE_STATUS.AVAILABLE
  ).length
  const availabilityRate = (availableCount / assets.total) * 100
  
  if (availabilityRate < 20) {
    alerts.push({
      id: 'low_availability',
      type: ALERT_TYPES.LOW_AVAILABILITY,
      priority: ALERT_PRIORITIES.HIGH,
      status: ALERT_STATUSES.NEW,
      title: 'Low Asset Availability',
      message: `Only ${availabilityRate.toFixed(1)}% of assets are currently available`,
      availableCount,
      totalAssets: assets.total,
      availabilityRate: availabilityRate.toFixed(1),
      timestamp: new Date().toISOString(),
      actionRequired: 'Review asset allocation and returns',
      link: '/admin/dashboard'
    })
  }
  
  // Check for unresolved issues
  if (issues.documents.length > 10) {
    const criticalIssues = issues.documents.filter(i => 
      i.severity === 'CRITICAL' || i.issueType === 'BREAKDOWN'
    )
    
    alerts.push({
      id: 'unresolved_issues',
      type: ALERT_TYPES.SYSTEM_ERROR,
      priority: criticalIssues.length > 0 ? ALERT_PRIORITIES.CRITICAL : ALERT_PRIORITIES.MEDIUM,
      status: ALERT_STATUSES.NEW,
      title: 'Multiple Unresolved Issues',
      message: `${issues.documents.length} issues are awaiting resolution (${criticalIssues.length} critical)`,
      totalIssues: issues.documents.length,
      criticalCount: criticalIssues.length,
      timestamp: new Date().toISOString(),
      actionRequired: 'Review and resolve pending issues',
      link: '/admin/issues'
    })
  }
  
  return alerts
}

/**
 * Get historical alerts from storage
 */
async function getHistoricalAlerts(params) {
  // In production, this would query from database
  const historicalAlerts = Array.from(alertsCache.values())
  
  // Apply date range filter if provided
  if (params.dateRange) {
    return historicalAlerts.filter(alert => {
      const alertDate = new Date(alert.timestamp)
      const start = params.dateRange.start ? new Date(params.dateRange.start) : null
      const end = params.dateRange.end ? new Date(params.dateRange.end) : null
      
      if (start && alertDate < start) return false
      if (end && alertDate > end) return false
      return true
    })
  }
  
  return historicalAlerts
}

/**
 * Calculate alert statistics
 */
function calculateAlertStatistics(alerts) {
  const stats = {
    total: alerts.length,
    byPriority: {},
    byType: {},
    byStatus: {},
    criticalCount: 0,
    unresolvedCount: 0,
    todayCount: 0,
    weekCount: 0
  }
  
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  for (const alert of alerts) {
    // Count by priority
    stats.byPriority[alert.priority] = (stats.byPriority[alert.priority] || 0) + 1
    
    // Count by type
    stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1
    
    // Count by status
    stats.byStatus[alert.status] = (stats.byStatus[alert.status] || 0) + 1
    
    // Count critical
    if (alert.priority === ALERT_PRIORITIES.CRITICAL) {
      stats.criticalCount++
    }
    
    // Count unresolved
    if (![ALERT_STATUSES.RESOLVED, ALERT_STATUSES.DISMISSED].includes(alert.status)) {
      stats.unresolvedCount++
    }
    
    // Count by time
    const alertDate = new Date(alert.timestamp)
    if (alertDate >= today) {
      stats.todayCount++
    }
    if (alertDate >= weekAgo) {
      stats.weekCount++
    }
  }
  
  return stats
}

/**
 * Process alert action
 */
async function processAlertAction(actionData, staff) {
  const { alertId, action, notes, assignTo, resolution } = actionData
  
  // Get alert from cache (in production, from database)
  let alert = alertsCache.get(alertId)
  
  if (!alert) {
    // Try to find in current alerts
    const currentAlerts = await generateCurrentAlerts(staff, {})
    alert = currentAlerts.find(a => a.id === alertId)
    
    if (!alert) {
      throw new Error('Alert not found')
    }
  }
  
  // Update alert based on action
  const updatedAlert = { ...alert }
  const actionLog = {
    action,
    performedBy: staff.$id,
    performedAt: new Date().toISOString(),
    notes
  }
  
  switch (action) {
    case 'acknowledge':
      updatedAlert.status = ALERT_STATUSES.ACKNOWLEDGED
      updatedAlert.acknowledgedBy = staff.$id
      updatedAlert.acknowledgedAt = new Date().toISOString()
      break
      
    case 'resolve':
      updatedAlert.status = ALERT_STATUSES.RESOLVED
      updatedAlert.resolvedBy = staff.$id
      updatedAlert.resolvedAt = new Date().toISOString()
      updatedAlert.resolution = resolution || notes
      break
      
    case 'dismiss':
      updatedAlert.status = ALERT_STATUSES.DISMISSED
      updatedAlert.dismissedBy = staff.$id
      updatedAlert.dismissedAt = new Date().toISOString()
      updatedAlert.dismissalReason = notes
      break
      
    case 'escalate':
      updatedAlert.status = ALERT_STATUSES.ESCALATED
      updatedAlert.escalatedBy = staff.$id
      updatedAlert.escalatedAt = new Date().toISOString()
      updatedAlert.escalationNotes = notes
      // Increase priority if not already critical
      if (updatedAlert.priority !== ALERT_PRIORITIES.CRITICAL) {
        const priorities = Object.values(ALERT_PRIORITIES)
        const currentIndex = priorities.indexOf(updatedAlert.priority)
        if (currentIndex > 0) {
          updatedAlert.priority = priorities[currentIndex - 1]
        }
      }
      break
      
    case 'assign':
      updatedAlert.assignedTo = assignTo
      updatedAlert.assignedBy = staff.$id
      updatedAlert.assignedAt = new Date().toISOString()
      updatedAlert.status = ALERT_STATUSES.IN_PROGRESS
      break
      
    default:
      throw new Error('Invalid action')
  }
  
  // Add action to history
  if (!updatedAlert.history) {
    updatedAlert.history = []
  }
  updatedAlert.history.push(actionLog)
  
  // Save updated alert
  alertsCache.set(alertId, updatedAlert)
  
  // In production, save to database
  // await saveAlert(updatedAlert)
  
  return updatedAlert
}

/**
 * Send alert notifications
 */
async function sendAlertNotifications(alert, action) {
  // Get notification preferences
  const preferences = alertPreferences.get(alert.assignedTo) || 
                     alertPreferences.get(alert.resolvedBy) ||
                     getDefaultPreferences()
  
  // Check if notifications are enabled for this alert type and priority
  if (!preferences.alertTypes.includes(alert.type) ||
      !preferences.priorities.includes(alert.priority)) {
    return
  }
  
  // Check quiet hours
  if (preferences.quietHours?.enabled) {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const { start, end } = preferences.quietHours
    
    if (start <= end) {
      if (currentTime >= start && currentTime <= end) return
    } else {
      if (currentTime >= start || currentTime <= end) return
    }
  }
  
  // Prepare notification content
  const notification = {
    title: `Alert ${action}: ${alert.title}`,
    message: alert.message,
    priority: alert.priority,
    link: alert.link,
    timestamp: new Date().toISOString()
  }
  
  // Send notifications based on preferences
  const promises = []
  
  if (preferences.enableEmailNotifications) {
    // Send email notification
    // promises.push(sendEmailNotification(notification))
  }
  
  if (preferences.enablePushNotifications) {
    // Send push notification
    // promises.push(sendPushNotification(notification))
  }
  
  if (preferences.enableSmsNotifications && alert.priority === ALERT_PRIORITIES.CRITICAL) {
    // Send SMS for critical alerts only
    // promises.push(sendSmsNotification(notification))
  }
  
  await Promise.all(promises)
}

/**
 * Dismiss an alert
 */
async function dismissAlert(alertId, userId) {
  const alert = alertsCache.get(alertId)
  
  if (!alert) {
    throw new Error('Alert not found')
  }
  
  alert.status = ALERT_STATUSES.DISMISSED
  alert.dismissedBy = userId
  alert.dismissedAt = new Date().toISOString()
  
  alertsCache.set(alertId, alert)
  
  return alert
}

/**
 * Get default notification preferences
 */
function getDefaultPreferences() {
  return {
    enableEmailNotifications: true,
    enablePushNotifications: false,
    enableSmsNotifications: false,
    alertTypes: Object.values(ALERT_TYPES),
    priorities: [ALERT_PRIORITIES.CRITICAL, ALERT_PRIORITIES.HIGH],
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00'
    },
    escalationRules: [
      {
        priority: ALERT_PRIORITIES.CRITICAL,
        escalateAfterMinutes: 15,
        escalateTo: []
      },
      {
        priority: ALERT_PRIORITIES.HIGH,
        escalateAfterMinutes: 60,
        escalateTo: []
      }
    ]
  }
}

/**
 * Check and process escalations
 */
export async function processEscalations() {
  const now = new Date()
  
  for (const [alertId, alert] of alertsCache.entries()) {
    // Skip if already escalated or resolved
    if ([ALERT_STATUSES.ESCALATED, ALERT_STATUSES.RESOLVED, ALERT_STATUSES.DISMISSED].includes(alert.status)) {
      continue
    }
    
    // Get escalation rules
    const preferences = getDefaultPreferences()
    const rule = preferences.escalationRules?.find(r => r.priority === alert.priority)
    
    if (!rule) continue
    
    // Check if escalation time has passed
    const alertAge = (now - new Date(alert.timestamp)) / (60 * 1000) // minutes
    
    if (alertAge >= rule.escalateAfterMinutes) {
      // Escalate the alert
      alert.status = ALERT_STATUSES.ESCALATED
      alert.escalatedAt = now.toISOString()
      alert.escalationReason = `Auto-escalated after ${rule.escalateAfterMinutes} minutes`
      
      // Increase priority
      const priorities = Object.values(ALERT_PRIORITIES)
      const currentIndex = priorities.indexOf(alert.priority)
      if (currentIndex > 0) {
        alert.priority = priorities[currentIndex - 1]
      }
      
      // Send escalation notifications
      for (const recipient of rule.escalateTo) {
        // Send notification to escalation recipient
        // await sendEscalationNotification(recipient, alert)
      }
      
      alertsCache.set(alertId, alert)
    }
  }
}

// Run escalation check periodically
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  setInterval(processEscalations, 5 * 60 * 1000) // Check every 5 minutes
}