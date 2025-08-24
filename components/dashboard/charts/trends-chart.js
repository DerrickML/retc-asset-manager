/**
 * Optimized Trends Chart Component
 * Displays request trends and approval patterns
 */

"use client"

import React, { useMemo } from "react"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card"

const TrendsChart = React.memo(({ data, departmentFilter }) => {
  // Mock trend data - in real implementation, this would come from the analytics service
  const trendData = useMemo(() => [
    { month: "Jan", requests: 45, approved: 38, denied: 7, pending: 12 },
    { month: "Feb", requests: 52, approved: 44, denied: 8, pending: 15 },
    { month: "Mar", requests: 48, approved: 41, denied: 7, pending: 18 },
    { month: "Apr", requests: 61, approved: 55, denied: 6, pending: 22 },
    { month: "May", requests: 55, approved: 48, denied: 7, pending: 19 },
    { month: "Jun", requests: 67, approved: 59, denied: 8, pending: 25 },
    { month: "Jul", requests: 62, approved: 54, denied: 8, pending: 21 },
    { month: "Aug", requests: 58, approved: 51, denied: 7, pending: 18 }
  ], [])

  // Calculate efficiency metrics
  const efficiencyData = useMemo(() => {
    return trendData.map(item => ({
      ...item,
      approvalRate: ((item.approved / item.requests) * 100).toFixed(1),
      processingRate: (((item.approved + item.denied) / item.requests) * 100).toFixed(1)
    }))
  }, [trendData])

  // Asset status changes over time (mock data)
  const statusChangeData = useMemo(() => [
    { month: "Jan", deployed: 15, returned: 12, maintenance: 8 },
    { month: "Feb", deployed: 18, returned: 14, maintenance: 6 },
    { month: "Mar", deployed: 22, returned: 16, maintenance: 9 },
    { month: "Apr", deployed: 25, returned: 19, maintenance: 7 },
    { month: "May", deployed: 21, returned: 17, maintenance: 11 },
    { month: "Jun", deployed: 28, returned: 22, maintenance: 8 },
    { month: "Jul", deployed: 24, returned: 20, maintenance: 10 },
    { month: "Aug", deployed: 26, returned: 23, maintenance: 6 }
  ], [])

  const CustomTooltip = React.useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm flex items-center" style={{ color: entry.color }}>
              <span className="w-3 h-3 rounded mr-2" style={{ backgroundColor: entry.color }}></span>
              {entry.name}: {entry.value}
              {entry.dataKey === 'approvalRate' && '%'}
            </p>
          ))}
        </div>
      )
    }
    return null
  }, [])

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Request Volume Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Request Volume Trends</CardTitle>
          <CardDescription>
            Monthly request submissions and processing
            {departmentFilter && ` (${departmentFilter})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={efficiencyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="requestsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="approvedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="deniedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="requests"
                stackId="1"
                stroke="#3b82f6"
                fill="url(#requestsGradient)"
                name="Total Requests"
              />
              <Area
                type="monotone"
                dataKey="approved"
                stackId="2"
                stroke="#10b981"
                fill="url(#approvedGradient)"
                name="Approved"
              />
              <Area
                type="monotone"
                dataKey="denied"
                stackId="3"
                stroke="#ef4444"
                fill="url(#deniedGradient)"
                name="Denied"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approval Rate Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Approval Rate Trends</CardTitle>
            <CardDescription>
              Monthly approval and processing efficiency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={efficiencyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="approvalRate"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  name="Approval Rate"
                />
                <Line
                  type="monotone"
                  dataKey="processingRate"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  name="Processing Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Asset Activity Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Activity Trends</CardTitle>
            <CardDescription>
              Monthly asset deployments, returns, and maintenance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={statusChangeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="deployed"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  name="Deployed"
                />
                <Line
                  type="monotone"
                  dataKey="returned"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  name="Returned"
                />
                <Line
                  type="monotone"
                  dataKey="maintenance"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                  name="Maintenance"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
})

TrendsChart.displayName = 'TrendsChart'

export default TrendsChart