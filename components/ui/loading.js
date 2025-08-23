import React from "react"

/**
 * Loading Spinner Component
 * Reusable loading indicator with different sizes and styles
 */
export function LoadingSpinner({ size = "md", className = "", color = "blue-600", ...props }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }

  const sizeClass = sizeClasses[size] || sizeClasses.md

  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-200 border-t-${color} ${sizeClass} ${className}`}
      {...props}
    />
  )
}

/**
 * Page Loading Component
 * Full-screen loading indicator for page transitions
 */
export function PageLoading({ message = "Loading...", className = "" }) {
  return (
    <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="mt-4 text-gray-600">{message}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Section Loading Component
 * Loading indicator for specific sections/components
 */
export function SectionLoading({ message = "Loading...", className = "" }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="text-center">
        <LoadingSpinner />
        {message && (
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Inline Loading Component
 * Small loading indicator for buttons or inline elements
 */
export function InlineLoading({ className = "" }) {
  return (
    <LoadingSpinner 
      size="sm" 
      className={`inline-block ${className}`}
    />
  )
}

/**
 * Card Skeleton Component
 * Loading skeleton for card layouts
 */
export function CardSkeleton({ className = "" }) {
  return (
    <div className={`animate-pulse bg-white rounded-lg border shadow-sm p-6 ${className}`}>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded w-16"></div>
          <div className="h-6 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    </div>
  )
}

/**
 * Table Skeleton Component
 * Loading skeleton for table layouts
 */
export function TableSkeleton({ rows = 5, columns = 4, className = "" }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-white rounded-lg border shadow-sm">
        {/* Header skeleton */}
        <div className="px-6 py-4 border-b">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        
        {/* Row skeletons */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4 border-b last:border-b-0">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div 
                  key={colIndex} 
                  className="h-4 bg-gray-200 rounded"
                  style={{ width: colIndex === 0 ? '80%' : '60%' }}
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Grid Skeleton Component
 * Loading skeleton for card grid layouts
 */
export function GridSkeleton({ items = 8, columns = 4, className = "" }) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }

  const gridClass = gridCols[columns] || gridCols[4]

  return (
    <div className={`grid ${gridClass} gap-4 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}