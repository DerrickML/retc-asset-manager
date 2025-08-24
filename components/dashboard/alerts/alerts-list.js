/**
 * Optimized Alerts List Component
 * Displays real-time alerts with efficient rendering
 */

"use client"

import React, { useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { Alert } from "../../ui/alert"
import { 
  AlertTriangle, 
  Clock, 
  Wrench, 
  UserX, 
  RefreshCw,
  ExternalLink,
  CheckCircle
} from "lucide-react"

const AlertItem = React.memo(({ alert, onAction }) => {
  const getAlertConfig = useCallback((type) => {
    switch (type) {
      case 'maintenanceOverdue':
        return {
          icon: AlertTriangle,
          color: 'destructive',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      case 'maintenanceDue':
        return {
          icon: Clock,
          color: 'warning',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        }
      case 'damagedAssets':
        return {
          icon: Wrench,
          color: 'destructive',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      case 'unassignedAssets':
        return {
          icon: UserX,
          color: 'secondary',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        }
      default:
        return {
          icon: AlertTriangle,
          color: 'secondary',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        }
    }
  }, [])

  const config = getAlertConfig(alert.type)
  const Icon = config.icon

  return (
    <div className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <Icon className={`h-5 w-5 mt-0.5 ${config.color === 'destructive' ? 'text-red-600' : 
                                              config.color === 'warning' ? 'text-yellow-600' : 
                                              config.color === 'secondary' ? 'text-blue-600' : 'text-gray-600'}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-sm">{alert.name}</h4>
              <Badge variant={config.color === 'destructive' ? 'destructive' : 'secondary'}>
                {alert.type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{alert.description}</p>
            {alert.metadata && (
              <div className="mt-2 text-xs text-gray-500">
                {Object.entries(alert.metadata).map(([key, value]) => (
                  <span key={key} className="mr-3">
                    {key}: <strong>{value}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex space-x-1">
          {onAction && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAction(alert)}
              className="h-8 w-8 p-0"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
})

AlertItem.displayName = 'AlertItem'

const AlertsCategory = React.memo(({ title, alerts, onAction, emptyMessage }) => {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-lg flex items-center">
        {title}
        <Badge variant="secondary" className="ml-2">
          {alerts.length}
        </Badge>
      </h3>
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <AlertItem 
            key={`${alert.assetId || alert.id || index}`} 
            alert={alert} 
            onAction={onAction}
          />
        ))}
      </div>
    </div>
  )
})

AlertsCategory.displayName = 'AlertsCategory'

const AlertsList = React.memo(({ alerts, onRefresh }) => {
  // Transform alerts data into categorized format
  const categorizedAlerts = useMemo(() => {
    if (!alerts) return {}

    return {
      critical: [
        ...((alerts.maintenanceOverdue || []).map(alert => ({
          ...alert,
          type: 'maintenanceOverdue',
          name: alert.name,
          description: `Maintenance overdue by ${alert.daysOverdue} day${alert.daysOverdue > 1 ? 's' : ''}`,
          metadata: { 'Days Overdue': alert.daysOverdue }
        }))),
        ...((alerts.damagedAssets || []).map(alert => ({
          ...alert,
          type: 'damagedAssets',
          name: alert.name,
          description: `Asset condition: ${alert.condition}`,
          metadata: { 'Condition': alert.condition }
        })))
      ],
      warning: [
        ...((alerts.maintenanceDue || []).map(alert => ({
          ...alert,
          type: 'maintenanceDue',
          name: alert.name,
          description: `Maintenance due in ${alert.daysUntilDue} day${alert.daysUntilDue > 1 ? 's' : ''}`,
          metadata: { 'Days Until Due': alert.daysUntilDue }
        })))
      ],
      info: [
        ...((alerts.unassignedAssets || []).map(alert => ({
          ...alert,
          type: 'unassignedAssets',
          name: alert.name,
          description: `Asset status: ${alert.status} but no custodian assigned`,
          metadata: { 'Status': alert.status }
        })))
      ]
    }
  }, [alerts])

  // Calculate total alerts count
  const totalAlerts = useMemo(() => {
    return Object.values(categorizedAlerts).reduce((total, category) => total + category.length, 0)
  }, [categorizedAlerts])

  // Handle alert action
  const handleAlertAction = useCallback((alert) => {
    // Navigate to asset or implement specific action
    if (alert.assetId) {
      window.open(`/admin/assets/${alert.assetId}`, '_blank')
    }
  }, [])

  if (!alerts) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Alerts...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                Alerts Overview
                {totalAlerts > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {totalAlerts}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Real-time system alerts and notifications
              </p>
            </div>
            {onRefresh && (
              <Button variant="outline" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
          </div>
        </CardHeader>
        {totalAlerts === 0 ? (
          <CardContent>
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
              <p className="text-gray-600">No active alerts or issues require attention.</p>
            </div>
          </CardContent>
        ) : (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">
                  {categorizedAlerts.critical?.length || 0}
                </div>
                <div className="text-sm text-red-700">Critical Issues</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">
                  {categorizedAlerts.warning?.length || 0}
                </div>
                <div className="text-sm text-yellow-700">Warnings</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {categorizedAlerts.info?.length || 0}
                </div>
                <div className="text-sm text-blue-700">Info</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Critical Alerts */}
      {categorizedAlerts.critical && categorizedAlerts.critical.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Critical Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AlertsCategory
              title="Requires Immediate Attention"
              alerts={categorizedAlerts.critical}
              onAction={handleAlertAction}
              emptyMessage="No critical issues"
            />
          </CardContent>
        </Card>
      )}

      {/* Warning Alerts */}
      {categorizedAlerts.warning && categorizedAlerts.warning.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-700 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AlertsCategory
              title="Upcoming Issues"
              alerts={categorizedAlerts.warning}
              onAction={handleAlertAction}
              emptyMessage="No warnings"
            />
          </CardContent>
        </Card>
      )}

      {/* Info Alerts */}
      {categorizedAlerts.info && categorizedAlerts.info.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-700 flex items-center">
              <UserX className="h-5 w-5 mr-2" />
              Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AlertsCategory
              title="Administrative Tasks"
              alerts={categorizedAlerts.info}
              onAction={handleAlertAction}
              emptyMessage="No administrative tasks"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
})

AlertsList.displayName = 'AlertsList'

export default AlertsList