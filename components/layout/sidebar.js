"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home,
  Package,
  FileText,
  Users,
  Settings,
  BarChart3,
  Bell,
  Shield,
  LogOut,
  ChevronDown,
  ChevronRight,
  Eye,
  UserCog,
  Globe
} from "lucide-react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { getCurrentStaff, permissions, logout } from "../../lib/utils/auth.js"

export default function Sidebar() {
  const [staff, setStaff] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [viewMode, setViewMode] = useState("user") // "user" or "admin"
  const [expandedSections, setExpandedSections] = useState({
    admin: false,
    assets: false,
    requests: false
  })
  const pathname = usePathname()

  useEffect(() => {
    loadStaffData()
  }, [])

  const loadStaffData = async () => {
    try {
      const currentStaff = await getCurrentStaff()
      if (currentStaff) {
        setStaff(currentStaff)
        const adminStatus = permissions.isAdmin(currentStaff)
        setIsAdmin(adminStatus)
        
        // Auto-set view mode based on current path
        if (pathname.startsWith('/admin')) {
          setViewMode("admin")
          setExpandedSections(prev => ({ ...prev, admin: true }))
        } else {
          setViewMode("user")
        }
      }
    } catch (error) {
      console.error("Failed to load staff data:", error)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const switchViewMode = (mode) => {
    setViewMode(mode)
    if (mode === "admin") {
      window.location.href = "/admin/dashboard"
    } else {
      window.location.href = "/dashboard"
    }
  }

  const isActivePath = (path) => {
    if (path === "/" && pathname === "/") return true
    if (path !== "/" && pathname.startsWith(path)) return true
    return false
  }

  // User navigation items
  const userNavItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: Home
    },
    {
      label: "Browse Assets",
      href: "/assets",
      icon: Package
    },
    {
      label: "My Requests",
      href: "/requests",
      icon: FileText
    },
    {
      label: "Guest Portal",
      href: "/guest",
      icon: Globe
    }
  ]

  // Admin navigation items
  const adminNavItems = [
    {
      label: "Admin Dashboard",
      href: "/admin/dashboard",
      icon: BarChart3
    },
    {
      label: "Asset Management",
      href: "/admin/assets",
      icon: Package,
      children: [
        { label: "All Assets", href: "/assets" },
        { label: "Add Asset", href: "/assets/new" }
      ]
    },
    {
      label: "Request Management",
      href: "/admin/requests",
      icon: FileText
    },
    {
      label: "User Management",
      href: "/admin/users",
      icon: Users
    },
    {
      label: "Reports",
      href: "/admin/reports",
      icon: BarChart3
    },
    {
      label: "Notifications",
      href: "/admin/notifications",
      icon: Bell
    },
    {
      label: "System Settings",
      href: "/admin/settings",
      icon: Settings
    }
  ]

  if (!staff) {
    return null // Don't render sidebar if not authenticated
  }

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      {/* Header */}
        <div className="flex items-center px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden bg-blue-600">
            <img
          src="https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a&mode=admin"
          alt="Logo"
          className="h-full w-full object-cover"
            />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold">Asset Manager</h1>
          </div>
        </div>

        {/* User Info & Role Switch */}
      <div className="border-b border-gray-700 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600">
            <span className="text-sm font-medium">
              {staff.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{staff.name}</p>
            <p className="text-xs text-gray-400">{staff.email}</p>
          </div>
        </div>

        {/* Role Switch for Admins */}
        {isAdmin && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-400">Switch View:</p>
            <div className="flex space-x-2">
              <Button
                variant={viewMode === "user" ? "default" : "outline"}
                size="sm"
                className={`text-xs ${
                  viewMode === "user" 
                    ? "bg-blue-600 hover:bg-blue-700" 
                    : "border-gray-600 text-gray-300 hover:bg-gray-800"
                }`}
                onClick={() => switchViewMode("user")}
              >
                <Eye className="w-3 h-3 mr-1" />
                User View
              </Button>
              <Button
                variant={viewMode === "admin" ? "default" : "outline"}
                size="sm"
                className={`text-xs ${
                  viewMode === "admin" 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "border-gray-600 text-gray-300 hover:bg-gray-800"
                }`}
                onClick={() => switchViewMode("admin")}
              >
                <Shield className="w-3 h-3 mr-1" />
                Admin View
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-2">
          {/* Current View Label */}
          <div className="px-2 py-1">
            <Badge className={`text-xs ${
              viewMode === "admin" 
                ? "bg-red-600 text-white" 
                : "bg-blue-600 text-white"
            }`}>
              {viewMode === "admin" ? "Admin Mode" : "User Mode"}
            </Badge>
          </div>

          {/* User Navigation */}
          {viewMode === "user" && (
            <>
              <div className="px-2 py-1">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  User Menu
                </p>
              </div>
              {userNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActivePath(item.href)
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </>
          )}

          {/* Admin Navigation */}
          {viewMode === "admin" && isAdmin && (
            <>
              <div className="px-2 py-1">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Admin Menu
                </p>
              </div>
              {adminNavItems.map((item) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActivePath(item.href)
                        ? "bg-red-600 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.label}
                    {item.children && (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </Link>
                </div>
              ))}
            </>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-700 px-4 py-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}