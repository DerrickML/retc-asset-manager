/**
 * React Query hooks for optimized dashboard data management
 * Implements intelligent caching, background updates, and error handling
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import DashboardService from '../services/dashboard-service.js'
import { getCurrentStaff } from '../utils/auth.js'

// Query Keys - centralized for easy cache management
export const DASHBOARD_QUERY_KEYS = {
  all: ['dashboard'],
  metrics: (departmentFilter) => ['dashboard', 'metrics', departmentFilter],
  analytics: (departmentFilter) => ['dashboard', 'analytics', departmentFilter],
  alerts: (departmentFilter) => ['dashboard', 'alerts', departmentFilter],
  utilization: () => ['dashboard', 'utilization'],
}

/**
 * Hook for dashboard metrics with intelligent caching
 */
export function useDashboardMetrics(departmentFilter = null, options = {}) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.metrics(departmentFilter),
    queryFn: () => DashboardService.getDashboardMetrics(departmentFilter),
    staleTime: 5 * 60 * 1000,  // 5 minutes - consider data fresh
    gcTime: 30 * 60 * 1000,    // 30 minutes - garbage collect time (was cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options
  })
}

/**
 * Hook for asset analytics and trends
 */
export function useAssetAnalytics(departmentFilter = null, options = {}) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.analytics(departmentFilter),
    queryFn: () => DashboardService.getAssetAnalytics(departmentFilter),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000,    // 1 hour
    refetchOnWindowFocus: false,
    retry: 2,
    ...options
  })
}

/**
 * Hook for real-time alerts - shorter cache time for freshness
 */
export function useDashboardAlerts(departmentFilter = null, options = {}) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.alerts(departmentFilter),
    queryFn: () => DashboardService.getAlerts(departmentFilter),
    staleTime: 2 * 60 * 1000,  // 2 minutes
    gcTime: 10 * 60 * 1000,    // 10 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
    refetchIntervalInBackground: true,
    retry: 2,
    ...options
  })
}

/**
 * Hook for department utilization
 */
export function useDepartmentUtilization(options = {}) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.utilization(),
    queryFn: () => DashboardService.getDepartmentUtilization(),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000,    // 1 hour
    refetchOnWindowFocus: false,
    retry: 2,
    ...options
  })
}

/**
 * Hook for comprehensive dashboard data - loads all dashboard data in parallel
 */
export function useDashboardData(departmentFilter = null, options = {}) {
  const metricsQuery = useDashboardMetrics(departmentFilter, options)
  const analyticsQuery = useAssetAnalytics(departmentFilter, options)
  const alertsQuery = useDashboardAlerts(departmentFilter, options)
  const utilizationQuery = useDepartmentUtilization(options)

  return {
    metrics: metricsQuery,
    analytics: analyticsQuery,
    alerts: alertsQuery,
    utilization: utilizationQuery,
    isLoading: metricsQuery.isLoading || analyticsQuery.isLoading,
    isError: metricsQuery.isError || analyticsQuery.isError || alertsQuery.isError || utilizationQuery.isError,
    error: metricsQuery.error || analyticsQuery.error || alertsQuery.error || utilizationQuery.error,
    isSuccess: metricsQuery.isSuccess && analyticsQuery.isSuccess && alertsQuery.isSuccess && utilizationQuery.isSuccess
  }
}

/**
 * Hook for role-based dashboard filtering
 */
export function useRoleBasedDashboard(options = {}) {
  return useQuery({
    queryKey: ['dashboard', 'role-based'],
    queryFn: async () => {
      const staff = await getCurrentStaff()
      if (!staff) throw new Error('No staff data available')
      
      // Determine department filter based on role
      let departmentFilter = null
      if (staff.roles?.includes('STAFF') && !staff.roles?.includes('ASSET_ADMIN') && !staff.roles?.includes('SYSTEM_ADMIN')) {
        departmentFilter = staff.department
      }
      
      return { staff, departmentFilter }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
    ...options
  })
}

/**
 * Mutation hook for refreshing dashboard data
 */
export function useRefreshDashboard() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ departmentFilter = null } = {}) => {
      // Clear relevant caches
      queryClient.removeQueries({
        queryKey: DASHBOARD_QUERY_KEYS.all
      })
      
      // Force refresh
      return await DashboardService.refreshAll(departmentFilter)
    },
    onSuccess: () => {
      // Invalidate all dashboard queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: DASHBOARD_QUERY_KEYS.all
      })
    },
    onError: (error) => {
      console.error('Failed to refresh dashboard:', error)
    }
  })
}

/**
 * Hook for optimistic dashboard updates
 */
export function useDashboardMutations() {
  const queryClient = useQueryClient()

  const invalidateMetrics = (departmentFilter = null) => {
    queryClient.invalidateQueries({
      queryKey: DASHBOARD_QUERY_KEYS.metrics(departmentFilter)
    })
    queryClient.invalidateQueries({
      queryKey: DASHBOARD_QUERY_KEYS.alerts(departmentFilter)
    })
  }

  const invalidateAnalytics = (departmentFilter = null) => {
    queryClient.invalidateQueries({
      queryKey: DASHBOARD_QUERY_KEYS.analytics(departmentFilter)
    })
  }

  const invalidateUtilization = () => {
    queryClient.invalidateQueries({
      queryKey: DASHBOARD_QUERY_KEYS.utilization()
    })
  }

  return {
    invalidateMetrics,
    invalidateAnalytics, 
    invalidateUtilization,
    invalidateAll: () => {
      queryClient.invalidateQueries({
        queryKey: DASHBOARD_QUERY_KEYS.all
      })
    }
  }
}

/**
 * Hook for prefetching dashboard data
 */
export function usePrefetchDashboard() {
  const queryClient = useQueryClient()

  const prefetchMetrics = (departmentFilter = null) => {
    queryClient.prefetchQuery({
      queryKey: DASHBOARD_QUERY_KEYS.metrics(departmentFilter),
      queryFn: () => DashboardService.getDashboardMetrics(departmentFilter),
      staleTime: 5 * 60 * 1000,
    })
  }

  const prefetchAnalytics = (departmentFilter = null) => {
    queryClient.prefetchQuery({
      queryKey: DASHBOARD_QUERY_KEYS.analytics(departmentFilter), 
      queryFn: () => DashboardService.getAssetAnalytics(departmentFilter),
      staleTime: 10 * 60 * 1000,
    })
  }

  return { prefetchMetrics, prefetchAnalytics }
}

/**
 * Custom hook for dashboard performance monitoring
 */
export function useDashboardPerformance() {
  const queryClient = useQueryClient()
  
  const getQueryStats = () => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    const dashboardQueries = queries.filter(query => 
      query.queryKey[0] === 'dashboard'
    )
    
    return {
      total: dashboardQueries.length,
      fresh: dashboardQueries.filter(q => q.isStale() === false).length,
      loading: dashboardQueries.filter(q => q.isFetching()).length,
      error: dashboardQueries.filter(q => q.state.status === 'error').length,
    }
  }

  const getCacheSize = () => {
    // Estimate cache size (simplified)
    const cache = queryClient.getQueryCache()
    return cache.getAll().reduce((size, query) => {
      return size + JSON.stringify(query.state.data || {}).length
    }, 0)
  }

  return { getQueryStats, getCacheSize }
}