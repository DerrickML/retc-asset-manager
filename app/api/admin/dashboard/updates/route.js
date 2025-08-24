/**
 * Real-time Updates API
 * WebSocket endpoint for live dashboard data streams
 * 
 * Features:
 * - WebSocket connection management
 * - Event-driven updates for asset status changes
 * - Request workflow notifications
 * - Alert system integration
 * - Connection health monitoring
 */

import { NextResponse } from 'next/server'
import { getCurrentStaff, permissions } from '@/lib/utils/auth'
import { databases, client } from '@/lib/appwrite/client'
import { DATABASE_ID, COLLECTIONS, ENUMS } from '@/lib/appwrite/config'
import { z } from 'zod'

// WebSocket connection pool
const connections = new Map()
const subscriptions = new Map()

// Connection configuration
const CONNECTION_CONFIG = {
  heartbeatInterval: 30000, // 30 seconds
  maxConnections: 1000,
  messageQueueSize: 100,
  reconnectDelay: 5000
}

// Message types
const MESSAGE_TYPES = {
  CONNECTION: 'connection',
  SUBSCRIPTION: 'subscription',
  UNSUBSCRIPTION: 'unsubscription',
  HEARTBEAT: 'heartbeat',
  UPDATE: 'update',
  ERROR: 'error'
}

// Input validation schemas
const SubscriptionSchema = z.object({
  channels: z.array(z.enum([
    'metrics',
    'assets',
    'requests',
    'alerts',
    'analytics',
    'all'
  ])),
  filters: z.object({
    department: z.string().optional(),
    category: z.string().optional(),
    status: z.array(z.string()).optional()
  }).optional()
})

const MessageSchema = z.object({
  type: z.enum(Object.values(MESSAGE_TYPES)),
  payload: z.any().optional(),
  timestamp: z.string().datetime().optional()
})

/**
 * GET /api/admin/dashboard/updates
 * Establish WebSocket connection for real-time updates
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
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Check if this is a WebSocket upgrade request
    const upgradeHeader = request.headers.get('upgrade')
    if (upgradeHeader !== 'websocket') {
      // Return connection info for non-WebSocket requests
      return NextResponse.json({
        success: true,
        message: 'WebSocket endpoint ready',
        connectionInfo: {
          endpoint: '/api/admin/dashboard/updates',
          protocol: 'ws',
          supportedChannels: ['metrics', 'assets', 'requests', 'alerts', 'analytics'],
          maxConnections: CONNECTION_CONFIG.maxConnections,
          currentConnections: connections.size
        }
      })
    }

    // For actual WebSocket upgrade, this would be handled by the WebSocket server
    // Next.js doesn't support WebSocket in API routes directly
    // Return instructions for WebSocket implementation
    return NextResponse.json({
      success: false,
      message: 'WebSocket upgrade must be handled by a separate WebSocket server',
      implementation: {
        suggestion: 'Use a custom server or Edge Runtime for WebSocket support',
        alternatives: ['Server-Sent Events (SSE)', 'Long polling', 'Socket.io with custom server']
      }
    }, { status: 501 })

  } catch (error) {
    console.error('[Updates API] Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to establish connection' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/dashboard/updates
 * Send updates to connected clients (webhook endpoint)
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

    // Permission check - only admins can broadcast updates
    if (!permissions.isAdmin(staff)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate message
    const validatedMessage = MessageSchema.parse(body)
    
    // Broadcast update to connected clients
    const broadcastResult = await broadcastUpdate(validatedMessage)
    
    return NextResponse.json({
      success: true,
      message: 'Update broadcasted',
      details: broadcastResult
    })

  } catch (error) {
    console.error('[Updates API] Broadcast error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid message format', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to broadcast update' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/dashboard/updates
 * Close connection and cleanup
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

    // Get connection ID from query params
    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get('connectionId')
    
    if (!connectionId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Connection ID required' },
        { status: 400 }
      )
    }

    // Close connection and cleanup
    const result = closeConnection(connectionId)
    
    return NextResponse.json({
      success: true,
      message: 'Connection closed',
      details: result
    })

  } catch (error) {
    console.error('[Updates API] Close connection error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to close connection' },
      { status: 500 }
    )
  }
}

/**
 * Setup Appwrite realtime subscriptions
 */
function setupRealtimeSubscriptions(userId, channels, filters = {}) {
  const userSubscriptions = []
  
  // Subscribe to asset changes
  if (channels.includes('assets') || channels.includes('all')) {
    const assetSub = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.ASSETS}.documents`,
      (response) => {
        handleAssetUpdate(userId, response, filters)
      }
    )
    userSubscriptions.push(assetSub)
  }
  
  // Subscribe to request changes
  if (channels.includes('requests') || channels.includes('all')) {
    const requestSub = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.ASSET_REQUESTS}.documents`,
      (response) => {
        handleRequestUpdate(userId, response, filters)
      }
    )
    userSubscriptions.push(requestSub)
  }
  
  // Subscribe to issue reports
  if (channels.includes('alerts') || channels.includes('all')) {
    const issueSub = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.ASSET_ISSUES}.documents`,
      (response) => {
        handleIssueUpdate(userId, response, filters)
      }
    )
    userSubscriptions.push(issueSub)
  }
  
  // Store subscriptions for cleanup
  subscriptions.set(userId, userSubscriptions)
  
  return userSubscriptions
}

/**
 * Handle asset update events
 */
function handleAssetUpdate(userId, response, filters) {
  const { events, payload } = response
  
  // Apply filters
  if (filters.department && payload.department !== filters.department) {
    return
  }
  if (filters.category && payload.category !== filters.category) {
    return
  }
  if (filters.status && !filters.status.includes(payload.availableStatus)) {
    return
  }
  
  // Prepare update message
  const update = {
    type: 'asset_update',
    event: events[0], // e.g., 'databases.*.collections.*.documents.*.create'
    payload: {
      assetId: payload.$id,
      name: payload.name,
      status: payload.availableStatus,
      condition: payload.currentCondition,
      department: payload.department,
      category: payload.category,
      custodian: payload.custodianStaffId
    },
    timestamp: new Date().toISOString()
  }
  
  // Send to user
  sendToUser(userId, update)
}

/**
 * Handle request update events
 */
function handleRequestUpdate(userId, response, filters) {
  const { events, payload } = response
  
  // Prepare update message
  const update = {
    type: 'request_update',
    event: events[0],
    payload: {
      requestId: payload.$id,
      status: payload.status,
      assetId: payload.assetId,
      requester: payload.requesterStaffId,
      approver: payload.approverStaffId,
      issueDate: payload.issueDate,
      returnDate: payload.expectedReturnDate
    },
    timestamp: new Date().toISOString()
  }
  
  // Send to user
  sendToUser(userId, update)
}

/**
 * Handle issue/alert update events
 */
function handleIssueUpdate(userId, response, filters) {
  const { events, payload } = response
  
  // Prepare alert message
  const update = {
    type: 'alert_update',
    event: events[0],
    payload: {
      issueId: payload.$id,
      assetId: payload.assetId,
      issueType: payload.issueType,
      severity: payload.severity,
      status: payload.status,
      description: payload.issueDescription,
      reportedBy: payload.reporterStaffId,
      reportedAt: payload.reportedAt,
      resolvedAt: payload.resolvedAt
    },
    timestamp: new Date().toISOString()
  }
  
  // Determine alert level
  if (payload.severity === 'CRITICAL' || payload.issueType === 'BREAKDOWN') {
    update.alertLevel = 'critical'
  } else if (payload.severity === 'HIGH') {
    update.alertLevel = 'warning'
  } else {
    update.alertLevel = 'info'
  }
  
  // Send to user
  sendToUser(userId, update)
}

/**
 * Send update to specific user
 */
function sendToUser(userId, message) {
  const connection = connections.get(userId)
  if (connection && connection.readyState === 'open') {
    try {
      connection.send(JSON.stringify(message))
      
      // Update last activity
      connection.lastActivity = Date.now()
      
      // Add to message queue if needed
      if (!connection.messageQueue) {
        connection.messageQueue = []
      }
      connection.messageQueue.push(message)
      
      // Trim queue if too large
      if (connection.messageQueue.length > CONNECTION_CONFIG.messageQueueSize) {
        connection.messageQueue.shift()
      }
    } catch (error) {
      console.error(`Failed to send message to user ${userId}:`, error)
    }
  }
}

/**
 * Broadcast update to all connected clients
 */
async function broadcastUpdate(message) {
  let successCount = 0
  let failureCount = 0
  const errors = []
  
  for (const [userId, connection] of connections.entries()) {
    try {
      if (connection.readyState === 'open') {
        connection.send(JSON.stringify(message))
        successCount++
      } else {
        failureCount++
      }
    } catch (error) {
      failureCount++
      errors.push({ userId, error: error.message })
    }
  }
  
  return {
    totalConnections: connections.size,
    successfulBroadcasts: successCount,
    failedBroadcasts: failureCount,
    errors: errors.length > 0 ? errors : undefined
  }
}

/**
 * Close connection and cleanup resources
 */
function closeConnection(connectionId) {
  const connection = connections.get(connectionId)
  
  if (!connection) {
    return { success: false, message: 'Connection not found' }
  }
  
  // Unsubscribe from Appwrite realtime
  const userSubscriptions = subscriptions.get(connectionId)
  if (userSubscriptions) {
    userSubscriptions.forEach(sub => {
      try {
        sub() // Call unsubscribe function
      } catch (error) {
        console.error('Error unsubscribing:', error)
      }
    })
    subscriptions.delete(connectionId)
  }
  
  // Close WebSocket connection
  if (connection.readyState === 'open') {
    connection.close(1000, 'Normal closure')
  }
  
  // Remove from connections map
  connections.delete(connectionId)
  
  return {
    success: true,
    message: 'Connection closed successfully',
    connectionId
  }
}

/**
 * Monitor connection health
 */
function startHealthMonitoring() {
  setInterval(() => {
    const now = Date.now()
    const staleConnections = []
    
    for (const [userId, connection] of connections.entries()) {
      // Check for stale connections (no activity for 5 minutes)
      if (now - connection.lastActivity > 5 * 60 * 1000) {
        staleConnections.push(userId)
      } else if (connection.readyState === 'open') {
        // Send heartbeat ping
        try {
          connection.send(JSON.stringify({
            type: MESSAGE_TYPES.HEARTBEAT,
            timestamp: new Date().toISOString()
          }))
        } catch (error) {
          console.error(`Heartbeat failed for ${userId}:`, error)
          staleConnections.push(userId)
        }
      }
    }
    
    // Clean up stale connections
    staleConnections.forEach(userId => {
      console.log(`Closing stale connection for user ${userId}`)
      closeConnection(userId)
    })
    
  }, CONNECTION_CONFIG.heartbeatInterval)
}

// Start health monitoring
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  startHealthMonitoring()
}

/**
 * Alternative: Server-Sent Events (SSE) implementation
 * Since Next.js API routes don't support WebSocket directly
 */
export async function getSSE(request) {
  try {
    // Authentication check
    const staff = await getCurrentStaff()
    if (!staff) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create SSE response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection message
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'connection',
            status: 'connected',
            timestamp: new Date().toISOString()
          })}\n\n`)
        )
        
        // Setup Appwrite subscriptions
        const subs = setupRealtimeSubscriptions(
          staff.$id,
          ['all'],
          { department: staff.department }
        )
        
        // Keep connection alive with periodic heartbeats
        const heartbeatInterval = setInterval(() => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'heartbeat',
                timestamp: new Date().toISOString()
              })}\n\n`)
            )
          } catch (error) {
            clearInterval(heartbeatInterval)
            controller.close()
          }
        }, 30000)
        
        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval)
          subs.forEach(sub => sub())
          controller.close()
        })
      }
    })
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
    
  } catch (error) {
    console.error('[SSE] Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}