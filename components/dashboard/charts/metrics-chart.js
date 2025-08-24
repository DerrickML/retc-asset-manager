/**
 * Optimized Metrics Chart Component
 * Uses memoization and efficient rendering for performance
 */

"use client"

import React, { useMemo } from "react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card"

const COLORS = {
  primary: '#3b82f6',   // blue-500
  secondary: '#10b981', // emerald-500
  warning: '#f59e0b',   // amber-500
  danger: '#ef4444',    // red-500
  info: '#8b5cf6',      // violet-500
  gray: '#6b7280'       // gray-500
}

const STATUS_COLORS = [
  '#10b981', // Available - green
  '#3b82f6', // In Use - blue  
  '#f59e0b', // Maintenance - amber
  '#8b5cf6', // Reserved - violet
  '#ef4444', // Retired - red
  '#6b7280'  // Other - gray
]

const MetricsChart = React.memo(({ data, departmentFilter }) => {
  // Memoize chart data transformations
  const statusChartData = useMemo(() => {
    if (!data?.categoryDistribution) return []
    
    return data.categoryDistribution.map((category) => ({
      name: category.name,
      assets: category.value,
      percentage: parseFloat(category.percentage)
    }))
  }, [data?.categoryDistribution])

  const costAnalysisData = useMemo(() => {
    if (!data?.costAnalysis?.valueByCategory) return []
    
    return Object.entries(data.costAnalysis.valueByCategory).map(([category, value]) => ({
      category,
      value: value,
      formattedValue: `$${(value / 1000).toFixed(1)}K`
    }))
  }, [data?.costAnalysis?.valueByCategory])

  // Custom tooltip for better UX
  const CustomTooltip = React.useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.payload?.percentage && ` (${entry.payload.percentage}%)`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }, [])

  const PieTooltip = React.useCallback(({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">Assets: {data.assets}</p>
          <p className="text-sm">Percentage: {data.percentage}%</p>
        </div>
      )
    }
    return null
  }, [])

  if (!data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-100 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Category Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Distribution by Category</CardTitle>
          <CardDescription>
            Total assets across different categories
            {departmentFilter && ` (${departmentFilter})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="assets" 
                fill={COLORS.primary} 
                name="Assets"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>
            Percentage distribution of assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="assets"
              >
                {statusChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={STATUS_COLORS[index % STATUS_COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cost Analysis Chart */}
      {costAnalysisData.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Asset Value by Category</CardTitle>
            <CardDescription>
              Total asset value distribution (in thousands)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costAnalysisData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
                />
                <Legend />
                <Bar 
                  dataKey="value" 
                  fill={COLORS.secondary} 
                  name="Total Value"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
})

MetricsChart.displayName = 'MetricsChart'

export default MetricsChart