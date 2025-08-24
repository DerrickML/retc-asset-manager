/**
 * React Hook for Real-time Dashboard Updates
 * Integrates WebSocket service with React Query for seamless real-time data
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { dashboardWebSocket } from '../services/websocket-service.js'
import { DASHBOARD_QUERY_KEYS } from './use-dashboard-data.js'

/**
 * Hook for real-time dashboard connection management
 */
export function useRealtimeDashboard(options = {}) {
  const {
    autoConnect = true,
    departmentFilter = null,
    enableOptimisticUpdates = true
  } = options

  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [latency, setLatency] = useState(null)
  const queryClient = useQueryClient()
  const subscriptionsRef = useRef([])

  // Connect to WebSocket
  const connect = useCallback(() => {
    dashboardWebSocket.connect()
  }, [])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    dashboardWebSocket.disconnect()
  }, [])

  // Setup real-time subscriptions
  useEffect(() => {
    if (!autoConnect) return

    // Connect to WebSocket
    connect()

    // Subscribe to connection status changes
    const unsubscribeConnection = dashboardWebSocket.onConnectionChange((data) => {
      setConnectionStatus(data.status)
      
      if (data.status === 'connected') {
        console.log('Dashboard WebSocket connected')
      } else if (data.status === 'disconnected') {
        console.log('Dashboard WebSocket disconnected')
      } else if (data.status === 'failed') {
        console.error('Dashboard WebSocket connection failed after', data.attempts, 'attempts')
      }
    })

    // Subscribe to latency updates
    const unsubscribeLatency = dashboardWebSocket.manager.subscribe('latency', (data) => {
      setLatency(data.latency)
    })

    // Subscribe to dashboard metrics updates
    const unsubscribeMetrics = dashboardWebSocket.onMetricsUpdate((data) => {
      console.log('Real-time metrics update received:', data)
      
      if (enableOptimisticUpdates) {
        // Update specific query cache with new data
        queryClient.setQueryData(
          DASHBOARD_QUERY_KEYS.metrics(departmentFilter),
          (oldData) => {
            if (!oldData) return data
            return { ...oldData, ...data }
          }
        )
      } else {
        // Invalidate queries to refetch
        queryClient.invalidateQueries({
          queryKey: DASHBOARD_QUERY_KEYS.metrics(departmentFilter)
        })
      }
    })

    // Subscribe to asset updates
    const unsubscribeAssets = dashboardWebSocket.onAssetUpdate((data) => {
      console.log('Real-time asset update received:', data)
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: DASHBOARD_QUERY_KEYS.metrics(departmentFilter)
      })
      queryClient.invalidateQueries({
        queryKey: DASHBOARD_QUERY_KEYS.analytics(departmentFilter)
      })
      queryClient.invalidateQueries({
        queryKey: DASHBOARD_QUERY_KEYS.alerts(departmentFilter)
      })
    })

    // Subscribe to request updates
    const unsubscribeRequests = dashboardWebSocket.onRequestUpdate((data) => {
      console.log('Real-time request update received:', data)
      
      // Update request-related metrics
      queryClient.invalidateQueries({
        queryKey: DASHBOARD_QUERY_KEYS.metrics(departmentFilter)
      })
    })

    // Subscribe to alert updates
    const unsubscribeAlerts = dashboardWebSocket.onAlertUpdate((data) => {
      console.log('Real-time alert update received:', data)
      
      // Immediately update alerts cache
      queryClient.invalidateQueries({
        queryKey: DASHBOARD_QUERY_KEYS.alerts(departmentFilter)
      })
    })

    // Store subscriptions for cleanup
    subscriptionsRef.current = [
      unsubscribeConnection,
      unsubscribeLatency,
      unsubscribeMetrics,
      unsubscribeAssets,
      unsubscribeRequests,
      unsubscribeAlerts
    ]

    // Cleanup on unmount
    return () => {
      subscriptionsRef.current.forEach(unsubscribe => unsubscribe())
      subscriptionsRef.current = []
      disconnect()
    }
  }, [autoConnect, departmentFilter, enableOptimisticUpdates, connect, disconnect, queryClient])

  return {
    connectionStatus,
    latency,
    connect,
    disconnect,
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
    isDisconnected: connectionStatus === 'disconnected'
  }
}

/**
 * Hook for manual real-time event handling
 */
export function useRealtimeEvents(eventHandlers = {}) {
  const subscriptionsRef = useRef([])

  useEffect(() => {
    const subscriptions = []

    // Subscribe to each event type with its handler
    Object.entries(eventHandlers).forEach(([eventType, handler]) => {
      let unsubscribe
      
      switch (eventType) {
        case 'metricsUpdate':
          unsubscribe = dashboardWebSocket.onMetricsUpdate(handler)
          break
        case 'assetUpdate':
          unsubscribe = dashboardWebSocket.onAssetUpdate(handler)
          break
        case 'requestUpdate':
          unsubscribe = dashboardWebSocket.onRequestUpdate(handler)
          break
        case 'alertUpdate':
          unsubscribe = dashboardWebSocket.onAlertUpdate(handler)
          break
        case 'connectionChange':
          unsubscribe = dashboardWebSocket.onConnectionChange(handler)
          break
        default:
          console.warn('Unknown event type:', eventType)
      }
      
      if (unsubscribe) {
        subscriptions.push(unsubscribe)
      }
    })

    subscriptionsRef.current = subscriptions

    return () => {
      subscriptions.forEach(unsubscribe => unsubscribe())
      subscriptionsRef.current = []
    }
  }, [eventHandlers])

  return {
    send: dashboardWebSocket.send.bind(dashboardWebSocket),
    getStatus: dashboardWebSocket.getStatus.bind(dashboardWebSocket)
  }
}

/**
 * Hook for optimistic dashboard updates
 */
export function useOptimisticDashboard(departmentFilter = null) {
  const queryClient = useQueryClient()

  const updateMetrics = useCallback((updates) => {
    queryClient.setQueryData(
      DASHBOARD_QUERY_KEYS.metrics(departmentFilter),
      (oldData) => {
        if (!oldData) return updates
        return { ...oldData, ...updates }
      }
    )
  }, [queryClient, departmentFilter])

  const updateAnalytics = useCallback((updates) => {
    queryClient.setQueryData(
      DASHBOARD_QUERY_KEYS.analytics(departmentFilter),
      (oldData) => {
        if (!oldData) return updates
        return { ...oldData, ...updates }
      }
    )
  }, [queryClient, departmentFilter])

  const updateAlerts = useCallback((updates) => {
    queryClient.setQueryData(
      DASHBOARD_QUERY_KEYS.alerts(departmentFilter),
      (oldData) => {
        if (!oldData) return updates
        return { ...oldData, ...updates }
      }
    )
  }, [queryClient, departmentFilter])

  const addAlert = useCallback((alert) => {
    queryClient.setQueryData(
      DASHBOARD_QUERY_KEYS.alerts(departmentFilter),
      (oldData) => {
        if (!oldData) return { [alert.type]: [alert] }
        
        const newData = { ...oldData }
        const alertType = alert.type
        
        if (!newData[alertType]) {
          newData[alertType] = []
        }
        
        newData[alertType] = [...newData[alertType], alert]
        return newData
      }
    )
  }, [queryClient, departmentFilter])

  const removeAlert = useCallback((alertId, alertType) => {
    queryClient.setQueryData(
      DASHBOARD_QUERY_KEYS.alerts(departmentFilter),
      (oldData) => {
        if (!oldData || !oldData[alertType]) return oldData
        
        const newData = { ...oldData }
        newData[alertType] = newData[alertType].filter(alert => alert.id !== alertId)
        return newData
      }
    )
  }, [queryClient, departmentFilter])

  return {
    updateMetrics,
    updateAnalytics,
    updateAlerts,
    addAlert,
    removeAlert
  }
}

/**
 * Hook for dashboard performance monitoring
 */
export function useRealtimePerformance() {
  const [metrics, setMetrics] = useState({
    messageCount: 0,
    totalLatency: 0,
    avgLatency: 0,
    lastUpdateTime: null,
    updateFrequency: 0
  })

  const metricsRef = useRef(metrics)
  metricsRef.current = metrics

  useEffect(() => {
    let messageCount = 0
    let totalLatency = 0
    let lastUpdateTime = Date.now()

    const updatePerformanceMetrics = () => {
      const now = Date.now()
      const timeSinceLastUpdate = now - lastUpdateTime
      
      setMetrics(prev => ({
        ...prev,
        messageCount,
        totalLatency,
        avgLatency: messageCount > 0 ? Math.round(totalLatency / messageCount) : 0,
        lastUpdateTime: now,
        updateFrequency: timeSinceLastUpdate > 0 ? Math.round(60000 / timeSinceLastUpdate) : 0 // Updates per minute
      }))
      
      lastUpdateTime = now
    }

    // Track WebSocket messages
    const unsubscribeMessages = dashboardWebSocket.manager.subscribe('message', () => {
      messageCount++
    })

    // Track latency
    const unsubscribeLatency = dashboardWebSocket.manager.subscribe('latency', (data) => {
      totalLatency += data.latency
    })

    // Update metrics every 10 seconds
    const interval = setInterval(updatePerformanceMetrics, 10000)

    return () => {
      unsubscribeMessages()
      unsubscribeLatency()
      clearInterval(interval)
    }
  }, [])

  const resetMetrics = useCallback(() => {
    setMetrics({
      messageCount: 0,
      totalLatency: 0,
      avgLatency: 0,
      lastUpdateTime: Date.now(),
      updateFrequency: 0
    })
  }, [])

  return {
    ...metrics,
    resetMetrics
  }
}