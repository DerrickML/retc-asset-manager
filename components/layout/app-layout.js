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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't show sidebar for unauthenticated users, login, or setup pages
  const showSidebar = staff && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/setup')

  return (
    <div className="flex h-screen bg-gray-100">
      {showSidebar && <Sidebar />}
      <div className={`flex-1 ${showSidebar ? 'ml-0' : ''} overflow-auto`}>
        {children}
      </div>
    </div>
  )
}