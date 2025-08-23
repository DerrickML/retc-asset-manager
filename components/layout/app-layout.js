"use client"

import { useState, useEffect } from "react"
import Sidebar from "./sidebar"
import { getCurrentStaff } from "../../lib/utils/auth.js"

export default function AppLayout({ children }) {
  const [staff, setStaff] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const currentStaff = await getCurrentStaff()
      setStaff(currentStaff)
    } catch (error) {
      console.error("Auth check failed:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't show sidebar for unauthenticated users, login, or setup pages
  const showSidebar = staff && typeof window !== 'undefined' && 
    !window.location.pathname.includes('/login') && 
    !window.location.pathname.includes('/setup')

  return (
    <div className="flex h-screen bg-gray-50">
      {showSidebar && <Sidebar />}
      <div className="flex-1 overflow-auto">
        <div className="min-h-full">
          {children}
        </div>
      </div>
    </div>
  )
}