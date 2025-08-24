/**
 * Utilization Chart Component
 * Displays department utilization metrics with interactive charts
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
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card"

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

const UtilizationChart = React.memo(({ data, departmentFilter }) => {
  // Transform utilization data for different chart types
  const utilizationData = useMemo(() => {
    if (!data) return []
    
    // Mock utilization data - in real implementation, this would come from the service
    return [
      { department: "Engineering", utilization: 85, totalAssets: 45, assetsInUse: 38, available: 7 },
      { department: "Research", utilization: 72, totalAssets: 32, assetsInUse: 23, available: 9 },
      { department: "Training", utilization: 68, totalAssets: 28, assetsInUse: 19, available: 9 },
      { department: "Maintenance", utilization: 91, totalAssets: 22, assetsInUse: 20, available: 2 },
      { department: "Administration", utilization: 45, totalAssets: 20, assetsInUse: 9, available: 11 },
      { department: "Safety", utilization: 78, totalAssets: 18, assetsInUse: 14, available: 4 }
    ].filter(dept => !departmentFilter || dept.department === departmentFilter)
  }, [data, departmentFilter])

  // Prepare data for radial chart
  const radialData = useMemo(() => {
    return utilizationData.map((dept, index) => ({
      ...dept,
      fill: COLORS[index % COLORS.length]
    }))
  }, [utilizationData])

  // Prepare efficiency metrics
  const efficiencyData = useMemo(() => {
    return utilizationData.map(dept => ({
      department: dept.department,
      efficiency: dept.utilization,
      capacity: 100 - dept.utilization,
      score: dept.utilization >= 80 ? 'Excellent' : dept.utilization >= 60 ? 'Good' : 'Needs Improvement'
    }))
  }, [utilizationData])

  const CustomTooltip = React.useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p style={{ color: payload[0].color }}>
              Utilization: <strong>{data.utilization}%</strong>
            </p>
            <p>Total Assets: <strong>{data.totalAssets}</strong></p>
            <p>In Use: <strong>{data.assetsInUse}</strong></p>
            <p>Available: <strong>{data.available}</strong></p>
          </div>
        </div>
      )
    }
    return null
  }, [])

  const RadialTooltip = React.useCallback(({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium mb-2">{data.department}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: data.fill }}
              ></div>
              <span>Utilization: <strong>{data.utilization}%</strong></span>
            </div>
            <p>Assets: {data.assetsInUse}/{data.totalAssets}</p>
          </div>
        </div>
      )
    }
    return null
  }, [])

  if (!utilizationData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Utilization Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Utilization Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Department Utilization</CardTitle>
            <CardDescription>
              Asset utilization percentage by department
              {departmentFilter && ` (${departmentFilter})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={utilizationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="department" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="utilization" 
                  fill="#3b82f6"
                  name="Utilization %"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Radial Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Utilization Distribution</CardTitle>
            <CardDescription>
              Comparative view of department utilization rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="30%" 
                outerRadius="80%" 
                data={radialData}
              >
                <RadialBar
                  minAngle={15}
                  label={{ position: 'insideStart', fill: 'white', fontSize: 12 }}
                  background
                  clockWise
                  dataKey="utilization"
                />
                <Legend 
                  iconSize={12}
                  wrapperStyle={{ fontSize: '12px' }}
                  verticalAlign="bottom"
                  align="center"
                />
                <Tooltip content={<RadialTooltip />} />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Asset Distribution by Department */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Distribution & Availability</CardTitle>
          <CardDescription>
            Breakdown of asset allocation across departments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart 
              data={utilizationData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              layout="horizontal"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis 
                dataKey="department" 
                type="category" 
                tick={{ fontSize: 12 }}
                width={100}
              />
              <Tooltip 
                formatter={(value, name) => [value, name]}
                labelFormatter={(label) => `Department: ${label}`}
              />
              <Legend />
              <Bar 
                dataKey="assetsInUse" 
                stackId="assets" 
                fill="#10b981" 
                name="In Use"
                radius={[0, 2, 2, 0]}
              />
              <Bar 
                dataKey="available" 
                stackId="assets" 
                fill="#94a3b8" 
                name="Available"
                radius={[0, 2, 2, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Efficiency Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {efficiencyData.map((dept, index) => (
          <Card key={dept.department}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{dept.department}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div 
                  className={`text-3xl font-bold mb-2 ${
                    dept.efficiency >= 80 ? 'text-green-600' : 
                    dept.efficiency >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}
                >
                  {dept.efficiency}%
                </div>
                <div 
                  className={`text-sm px-2 py-1 rounded-full inline-block ${
                    dept.efficiency >= 80 ? 'bg-green-100 text-green-800' : 
                    dept.efficiency >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {dept.score}
                </div>
                
                {/* Mini progress indicator */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        dept.efficiency >= 80 ? 'bg-green-500' : 
                        dept.efficiency >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${dept.efficiency}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Utilization Rate
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
})

UtilizationChart.displayName = 'UtilizationChart'

export default UtilizationChart