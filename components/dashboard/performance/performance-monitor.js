/**
 * Performance Monitoring Component for Dashboard
 * Tracks and displays real-time performance metrics
 */

"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { Progress } from "../../ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs"
import { 
  Activity, 
  Zap, 
  Database, 
  Wifi, 
  Clock, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from "lucide-react"
import { useRealtimePerformance } from "../../../lib/hooks/use-realtime-dashboard.js"
import { useDashboardPerformance } from "../../../lib/hooks/use-dashboard-data.js"

const PerformanceMetric = React.memo(({ 
  icon: Icon, 
  label, 
  value, 
  unit = '', 
  status = 'good', 
  trend,
  description 
}) => {
  const statusColors = {
    good: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    error: 'text-red-600 bg-red-50 border-red-200'
  }

  const StatusIcon = status === 'good' ? CheckCircle : AlertCircle

  return (
    <div className={`p-4 rounded-lg border ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Icon className="h-5 w-5" />
          <span className="font-medium text-sm">{label}</span>
        </div>
        <StatusIcon className="h-4 w-4" />
      </div>
      
      <div className="mb-1">
        <span className="text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-sm ml-1">{unit}</span>}
      </div>
      
      {trend && (
        <div className="flex items-center text-xs mb-1">
          <TrendingUp className="h-3 w-3 mr-1" />
          <span>{trend}</span>
        </div>
      )}
      
      {description && (
        <p className="text-xs opacity-75">{description}</p>
      )}
    </div>
  )
})

PerformanceMetric.displayName = 'PerformanceMetric'

const NetworkStatus = React.memo(({ connectionStatus, latency }) => {
  const getNetworkStatus = useCallback(() => {
    if (connectionStatus === 'connected') {
      if (latency === null) return { status: 'good', label: 'Connected' }
      if (latency < 100) return { status: 'good', label: 'Excellent' }
      if (latency < 300) return { status: 'warning', label: 'Good' }
      return { status: 'error', label: 'Slow' }
    } else if (connectionStatus === 'connecting') {
      return { status: 'warning', label: 'Connecting' }
    } else {
      return { status: 'error', label: 'Disconnected' }
    }
  }, [connectionStatus, latency])

  const networkStatus = getNetworkStatus()

  return (
    <PerformanceMetric
      icon={Wifi}
      label="Network"
      value={networkStatus.label}
      status={networkStatus.status}
      description={latency ? `${latency}ms latency` : undefined}
    />
  )
})

NetworkStatus.displayName = 'NetworkStatus'

const CachePerformance = React.memo(({ queryStats, cacheSize }) => {
  const hitRate = useMemo(() => {
    if (!queryStats || queryStats.total === 0) return 0
    return Math.round(((queryStats.fresh / queryStats.total) * 100))
  }, [queryStats])

  const getCacheStatus = useCallback(() => {
    if (hitRate >= 80) return 'good'
    if (hitRate >= 60) return 'warning'
    return 'error'
  }, [hitRate])

  const formatCacheSize = useCallback((bytes) => {
    if (!bytes) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
  }, [])

  return (
    <PerformanceMetric
      icon={Database}
      label="Cache Hit Rate"
      value={hitRate}
      unit="%"
      status={getCacheStatus()}
      description={`${formatCacheSize(cacheSize)} cached`}
    />
  )
})

CachePerformance.displayName = 'CachePerformance'

const RenderPerformance = React.memo(() => {
  const [renderMetrics, setRenderMetrics] = useState({
    fps: 0,
    renderTime: 0,
    memoryUsage: 0
  })

  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let renderTimes = []

    const measurePerformance = (currentTime) => {
      frameCount++
      const deltaTime = currentTime - lastTime
      
      if (deltaTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / deltaTime)
        const avgRenderTime = renderTimes.length > 0 
          ? Math.round(renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length)
          : 0
        
        const memoryUsage = performance.memory 
          ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
          : 0

        setRenderMetrics({
          fps,
          renderTime: avgRenderTime,
          memoryUsage
        })
        
        frameCount = 0
        lastTime = currentTime
        renderTimes = []
      }

      // Measure render time
      const renderStart = performance.now()
      requestIdleCallback(() => {
        const renderEnd = performance.now()
        renderTimes.push(renderEnd - renderStart)
      })

      requestAnimationFrame(measurePerformance)
    }

    const animationId = requestAnimationFrame(measurePerformance)
    
    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])

  const getFpsStatus = useCallback(() => {
    if (renderMetrics.fps >= 50) return 'good'
    if (renderMetrics.fps >= 30) return 'warning'
    return 'error'
  }, [renderMetrics.fps])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <PerformanceMetric
        icon={Activity}
        label="Frame Rate"
        value={renderMetrics.fps}
        unit="fps"
        status={getFpsStatus()}
        description="Rendering performance"
      />
      
      <PerformanceMetric
        icon={Clock}
        label="Render Time"
        value={renderMetrics.renderTime}
        unit="ms"
        status={renderMetrics.renderTime < 16 ? 'good' : renderMetrics.renderTime < 33 ? 'warning' : 'error'}
        description="Per frame render time"
      />
      
      <PerformanceMetric
        icon={Zap}
        label="Memory Usage"
        value={renderMetrics.memoryUsage}
        unit="MB"
        status={renderMetrics.memoryUsage < 50 ? 'good' : renderMetrics.memoryUsage < 100 ? 'warning' : 'error'}
        description="JavaScript heap size"
      />
    </div>
  )
})

RenderPerformance.displayName = 'RenderPerformance'

const QueryPerformanceChart = React.memo(({ queryStats }) => {
  if (!queryStats) return null

  const { total, fresh, loading, error } = queryStats

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-blue-600">{total}</div>
          <div className="text-sm text-gray-600">Total Queries</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">{fresh}</div>
          <div className="text-sm text-gray-600">Fresh</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-yellow-600">{loading}</div>
          <div className="text-sm text-gray-600">Loading</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-600">{error}</div>
          <div className="text-sm text-gray-600">Error</div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Fresh Queries</span>
          <span>{total > 0 ? Math.round((fresh / total) * 100) : 0}%</span>
        </div>
        <Progress value={total > 0 ? (fresh / total) * 100 : 0} className="h-2" />
        
        <div className="flex justify-between text-sm">
          <span>Loading Queries</span>
          <span>{total > 0 ? Math.round((loading / total) * 100) : 0}%</span>
        </div>
        <Progress value={total > 0 ? (loading / total) * 100 : 0} className="h-2" />
      </div>
    </div>
  )
})

QueryPerformanceChart.displayName = 'QueryPerformanceChart'

export default function PerformanceMonitor({ 
  connectionStatus, 
  latency,
  onRefresh
}) {
  const [isVisible, setIsVisible] = useState(false)
  const realtimeMetrics = useRealtimePerformance()
  const { getQueryStats, getCacheSize } = useDashboardPerformance()

  const [performanceData, setPerformanceData] = useState({
    queryStats: null,
    cacheSize: 0
  })

  // Update performance data periodically
  useEffect(() => {
    const updatePerformanceData = () => {
      setPerformanceData({
        queryStats: getQueryStats(),
        cacheSize: getCacheSize()
      })
    }

    updatePerformanceData()
    const interval = setInterval(updatePerformanceData, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [getQueryStats, getCacheSize])

  const handleToggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev)
  }, [])

  const handleResetMetrics = useCallback(() => {
    realtimeMetrics.resetMetrics()
  }, [realtimeMetrics])

  // Show performance indicator in corner
  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={handleToggleVisibility}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg"
        >
          <Activity className="h-4 w-4 mr-2" />
          Performance
          {connectionStatus === 'connected' && (
            <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
              Live
            </Badge>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-screen max-h-96 overflow-y-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-base">
              <Activity className="h-5 w-5 mr-2" />
              Performance Monitor
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                onClick={onRefresh}
                variant="ghost"
                size="sm"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleToggleVisibility}
                variant="ghost"
                size="sm"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <Tabs defaultValue="realtime" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="realtime">Real-time</TabsTrigger>
              <TabsTrigger value="cache">Cache</TabsTrigger>
              <TabsTrigger value="render">Render</TabsTrigger>
            </TabsList>
            
            <TabsContent value="realtime" className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <NetworkStatus 
                  connectionStatus={connectionStatus} 
                  latency={latency} 
                />
                
                <PerformanceMetric
                  icon={Activity}
                  label="Messages"
                  value={realtimeMetrics.messageCount}
                  status="good"
                  description="WebSocket messages received"
                />
                
                <PerformanceMetric
                  icon={Clock}
                  label="Avg Latency"
                  value={realtimeMetrics.avgLatency || 0}
                  unit="ms"
                  status={realtimeMetrics.avgLatency < 100 ? 'good' : realtimeMetrics.avgLatency < 300 ? 'warning' : 'error'}
                />
              </div>
              
              <div className="flex justify-between">
                <Button
                  onClick={handleResetMetrics}
                  variant="outline"
                  size="sm"
                >
                  Reset Metrics
                </Button>
                
                <div className="text-xs text-gray-500">
                  Updates: {realtimeMetrics.updateFrequency}/min
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="cache" className="space-y-4">
              <CachePerformance 
                queryStats={performanceData.queryStats}
                cacheSize={performanceData.cacheSize}
              />
              
              <QueryPerformanceChart 
                queryStats={performanceData.queryStats}
              />
            </TabsContent>
            
            <TabsContent value="render">
              <RenderPerformance />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}