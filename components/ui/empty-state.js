import React from "react"
import { Button } from "./button"
import { Card, CardContent } from "./card"
import { 
  Package, 
  FileText, 
  Users, 
  Search,
  Plus,
  AlertCircle,
  Database
} from "lucide-react"

// Predefined empty state configurations
const emptyStateConfigs = {
  assets: {
    icon: Package,
    title: "No assets found",
    description: "Get started by adding your first asset to the system.",
    actionLabel: "Add Asset",
    actionHref: "/assets/new"
  },
  requests: {
    icon: FileText,
    title: "No requests found",
    description: "You haven't submitted any asset requests yet.",
    actionLabel: "New Request",
    actionHref: "/requests/new"
  },
  users: {
    icon: Users,
    title: "No users found",
    description: "No users match your current search criteria.",
    actionLabel: "Add User",
    actionHref: "/admin/users/new"
  },
  search: {
    icon: Search,
    title: "No results found",
    description: "Try adjusting your search criteria or filters.",
    actionLabel: "Clear Filters",
    showAction: false
  },
  generic: {
    icon: Database,
    title: "No data available",
    description: "There's no data to display at the moment.",
    showAction: false
  },
  error: {
    icon: AlertCircle,
    title: "Something went wrong",
    description: "We encountered an error loading this data.",
    actionLabel: "Try Again",
    showAction: false
  }
}

/**
 * EmptyState Component
 * Reusable empty state component with different presets and full customization
 */
export function EmptyState({ 
  type = "generic",
  icon: CustomIcon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  showAction = true,
  actionVariant = "default",
  className = "",
  children,
  ...props 
}) {
  // Get config from preset or use custom values
  const config = emptyStateConfigs[type] || emptyStateConfigs.generic
  
  const Icon = CustomIcon || config.icon
  const finalTitle = title || config.title
  const finalDescription = description || config.description
  const finalActionLabel = actionLabel || config.actionLabel
  const finalActionHref = actionHref || config.actionHref
  const finalShowAction = showAction && (config.showAction !== false)

  const handleAction = () => {
    if (onAction) {
      onAction()
    } else if (finalActionHref) {
      window.location.href = finalActionHref
    }
  }

  return (
    <Card className={className} {...props}>
      <CardContent className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {finalTitle}
        </h3>
        
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {finalDescription}
        </p>

        {children}

        {finalShowAction && finalActionLabel && (
          <Button 
            onClick={handleAction}
            variant={actionVariant}
            className="mt-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            {finalActionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Pre-configured empty state variants
 */
export const EmptyAssets = (props) => (
  <EmptyState type="assets" {...props} />
)

export const EmptyRequests = (props) => (
  <EmptyState type="requests" {...props} />
)

export const EmptyUsers = (props) => (
  <EmptyState type="users" {...props} />
)

export const EmptySearchResults = (props) => (
  <EmptyState type="search" {...props} />
)

export const ErrorState = (props) => (
  <EmptyState type="error" {...props} />
)

/**
 * FilteredEmptyState Component
 * Special empty state for when filters are applied
 */
export function FilteredEmptyState({ 
  onClearFilters, 
  filterCount = 0,
  resourceName = "items",
  className = "",
  ...props 
}) {
  return (
    <EmptyState
      type="search"
      title="No results found"
      description={`No ${resourceName} match your current search criteria${filterCount > 0 ? ` (${filterCount} filters applied)` : ''}.`}
      actionLabel="Clear Filters"
      onAction={onClearFilters}
      showAction={!!onClearFilters}
      actionVariant="outline"
      className={className}
      {...props}
    />
  )
}

/**
 * LoadingEmptyState Component
 * Empty state shown while data is being loaded for the first time
 */
export function LoadingEmptyState({ message = "Loading data...", className = "" }) {
  return (
    <Card className={className}>
      <CardContent className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {message}
        </h3>
        
        <p className="text-gray-600">
          Please wait while we fetch your data.
        </p>
      </CardContent>
    </Card>
  )
}