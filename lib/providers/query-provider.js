/**
 * React Query Provider with optimized configuration for dashboard performance
 */

"use client"

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Create a client with optimized configuration
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - how long data is considered fresh
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Garbage collection time - how long data stays in cache
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      
      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Background refetch configuration
      refetchOnWindowFocus: false, // Disable for better performance
      refetchOnReconnect: true,    // Refetch when connection restored
      refetchOnMount: 'always',    // Always refetch on component mount
      
      // Network mode - fail fast on offline
      networkMode: 'online',
    },
    mutations: {
      retry: 1, // Only retry mutations once
      networkMode: 'online',
    },
  },
  
  // Custom error handler
  queryCache: {
    onError: (error, query) => {
      console.error('Query error:', error, 'Query key:', query.queryKey)
      
      // Log performance metrics
      if (typeof window !== 'undefined' && window.performance) {
        console.warn('Performance timing:', {
          navigation: window.performance.timing,
          memory: window.performance.memory
        })
      }
    },
    
    onSuccess: (data, query) => {
      // Optional: Track successful queries for analytics
      if (process.env.NODE_ENV === 'development') {
        console.log('Query success:', query.queryKey, 'Data size:', JSON.stringify(data).length)
      }
    }
  },
  
  // Mutation cache configuration
  mutationCache: {
    onError: (error, variables, context, mutation) => {
      console.error('Mutation error:', error, 'Variables:', variables)
    },
    
    onSuccess: (data, variables, context, mutation) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Mutation success:', mutation.options.mutationKey || 'unknown')
      }
    }
  }
})

let queryClient

// Singleton pattern for client
const getQueryClient = () => {
  if (typeof window === 'undefined') {
    // Server-side: always create a new client
    return createQueryClient()
  }
  
  // Client-side: create client once and reuse
  if (!queryClient) {
    queryClient = createQueryClient()
  }
  
  return queryClient
}

export default function QueryProvider({ children }) {
  const client = getQueryClient()

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}

// Export for external use
export { getQueryClient }