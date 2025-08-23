"use client"

import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import Sidebar from "./sidebar"
import TopNav from "./top-nav"
import { getCurrentStaff, initSessionMonitoring } from "../../lib/utils/auth.js"
import { settingsService } from "../../lib/appwrite/provider.js"

export default function LayoutProvider({ children }) {
  const pathname = usePathname()
  const [staff, setStaff] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAppData()
    
    // Initialize session monitoring for authenticated users
    const cleanup = initSessionMonitoring()
    
    return cleanup
  }, [])

  const loadAppData = async () => {
    try {
      const [currentStaff, systemSettings] = await Promise.all([
        getCurrentStaff().catch(() => null),
        settingsService.get().catch(() => null)
      ])
      
      setStaff(currentStaff)
      setSettings(systemSettings)
    } catch (error) {
      console.error("Failed to load app data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Define routes that don't need any layout
  const noLayoutRoutes = ['/login', '/setup']
  
  // Define routes that only need top navigation (like guest portal)
  const topNavOnlyRoutes = ['/guest']
  
  // Define routes that need full sidebar layout (authenticated users)
  const sidebarRoutes = ['/dashboard', '/admin', '/assets', '/requests']

  const isNoLayout = noLayoutRoutes.some(route => pathname.startsWith(route))
  const isTopNavOnly = topNavOnlyRoutes.some(route => pathname.startsWith(route))
  const isSidebarRoute = sidebarRoutes.some(route => pathname.startsWith(route))

  // No layout for login/setup pages
  if (isNoLayout) {
    return <>{children}</>
  }

  // Top navigation only (guest portal)
  if (isTopNavOnly) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav 
          showBranding={true} 
          brandingData={settings?.branding} 
        />
        <main>{children}</main>
      </div>
    )
  }

  // Full sidebar layout for authenticated users
  if (staff && (isSidebarRoute || pathname === '/')) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Default: redirect to login if not authenticated, otherwise show with sidebar
  if (!staff) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return null
  }

  // Fallback layout
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav 
        showBranding={true} 
        brandingData={settings?.branding} 
      />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}