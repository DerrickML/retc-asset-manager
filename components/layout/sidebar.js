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
  Globe,
  Menu,
  X,
  ChevronLeft
} from "lucide-react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { getCurrentStaff, permissions, logout } from "../../lib/utils/auth.js"

export default function Sidebar() {
  const [staff, setStaff] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [viewMode, setViewMode] = useState("user") // "user" or "admin"
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    admin: false,
    assets: false,
    requests: false
  })
  const pathname = usePathname()

  useEffect(() => {
    loadStaffData()
    
    // Check if should be collapsed on mobile by default
    const handleResize = () => {
      const isMobile = window.innerWidth < 768
      if (isMobile) {
        setIsCollapsed(true)
        setIsMobileOpen(false)
      }
    }

    // Set initial state
    handleResize()
    window.addEventListener('resize', handleResize)

    // Restore sidebar state from localStorage
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('sidebar-collapsed')
      if (savedState !== null && window.innerWidth >= 768) {
        setIsCollapsed(JSON.parse(savedState))
      }
    }

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Save sidebar state
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
    }
  }, [isCollapsed])

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

  const toggleSidebar = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) {
        setIsMobileOpen(!isMobileOpen)
      } else {
        setIsCollapsed(!isCollapsed)
      }
    }
  }

  const toggleSection = (section) => {
    if (isCollapsed) return // Don't expand sections when collapsed
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
      icon: Home,
      badge: null
    },
    {
      label: "Browse Assets",
      href: "/assets",
      icon: Package,
      badge: null
    },
    {
      label: "My Requests",
      href: "/requests",
      icon: FileText,
      badge: null
    },
    {
      label: "Guest Portal",
      href: "/guest",
      icon: Globe,
      badge: null
    }
  ]

  // Admin navigation items
  const adminNavItems = [
    {
      label: "Admin Dashboard",
      href: "/admin/dashboard",
      icon: BarChart3,
      badge: null
    },
    {
      label: "Asset Management",
      href: "/admin/assets",
      icon: Package,
      badge: null,
      children: [
        { label: "All Assets", href: "/assets" },
        { label: "Add Asset", href: "/assets/new" }
      ]
    },
    {
      label: "Request Management",
      href: "/admin/requests",
      icon: FileText,
      badge: "3"
    },
    {
      label: "User Management",
      href: "/admin/users",
      icon: Users,
      badge: null
    },
    {
      label: "Reports",
      href: "/admin/reports",
      icon: BarChart3,
      badge: null
    },
    {
      label: "Notifications",
      href: "/admin/notifications",
      icon: Bell,
      badge: "2"
    },
    {
      label: "System Settings",
      href: "/admin/settings",
      icon: Settings,
      badge: null
    }
  ]

  const NavigationItem = ({ item, isActive, level = 0 }) => {
    const ItemContent = (
      <>
        <div className="flex items-center flex-1 min-w-0">
          <item.icon className={`flex-shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4 mr-3'} ${
            isActive 
              ? 'text-white' 
              : 'text-orange-400 group-hover:text-orange-300'
          }`} />
          {!isCollapsed && (
            <>
              <span className="truncate font-medium text-sm">{item.label}</span>
              {item.badge && (
                <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5">
                  {item.badge}
                </Badge>
              )}
            </>
          )}
        </div>
        {!isCollapsed && item.children && (
          <ChevronRight className={`w-4 h-4 transition-transform ${
            expandedSections[item.href] ? 'rotate-90' : ''
          }`} />
        )}
      </>
    )

    if (isCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                className={`group flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
                  isActive
                    ? viewMode === "admin" 
                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25"
                      : "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                    : "text-orange-400 hover:text-orange-300 hover:bg-orange-800/50"
                } ${level > 0 ? 'ml-4' : ''}`}
              >
                {ItemContent}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              <p>{item.label}</p>
              {item.badge && (
                <Badge className="ml-2 bg-red-500 text-white text-xs">
                  {item.badge}
                </Badge>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return (
      <Link
        href={item.href}
        className={`group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
          isActive
            ? viewMode === "admin" 
              ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25"
              : "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
            : "text-orange-300 hover:text-white hover:bg-orange-800/50"
        } ${level > 0 ? 'ml-6' : ''}`}
      >
        {ItemContent}
      </Link>
    )
  }

  if (!staff) {
    return null // Don't render sidebar if not authenticated
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Floating Menu Button - Bottom Left */}
      <button
        className={`fixed bottom-6 left-6 z-50 md:hidden w-14 h-14 rounded-full text-white shadow-2xl border-0 transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 flex items-center justify-center ${
          isMobileOpen 
            ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/25" 
            : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-500/25"
        }`}
        onClick={() => {
          console.log('Mobile button clicked, current state:', isMobileOpen)
          setIsMobileOpen(!isMobileOpen)
        }}
        type="button"
      >
        {isMobileOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
        
        {/* Subtle floating animation pulse */}
        {!isMobileOpen && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 opacity-20 animate-ping pointer-events-none"></div>
        )}
        
        {/* Notification badge for mobile */}
        {!isMobileOpen && isAdmin && viewMode === "admin" && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white shadow-lg pointer-events-none">
            5
          </div>
        )}
      </button>

      {/* Desktop Sidebar - Inline */}
      <div className={`hidden md:flex flex-col bg-gradient-to-br from-orange-900 via-gray-900 to-gray-800 border-r border-gray-800/50 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-6">
            {!isCollapsed ? (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <img
                    src="https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a&mode=admin"
                    alt="Logo"
                    className="w-6 h-6 object-cover rounded-lg"
                  />
                </div>
                <div>
                  <h1 className="text-white font-bold text-lg">Asset Manager</h1>
                  <p className="text-orange-400 text-xs">RETC Management</p>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg mx-auto">
                <img
                  src="https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a&mode=admin"
                  alt="Logo"
                  className="w-6 h-6 object-cover rounded-lg"
                />
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex text-orange-400 hover:text-white hover:bg-orange-800/50 p-2"
              onClick={toggleSidebar}
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* User Info */}
          <div className="px-4 pb-6">
            {isCollapsed ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex justify-center">
                      <Avatar className="w-10 h-10 ring-2 ring-gray-700">
                        <AvatarFallback className="bg-gradient-to-br from-orange-600 to-orange-700 text-white font-semibold">
                          {staff.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <div>
                      <p className="font-medium">{staff.name}</p>
                      <p className="text-xs text-orange-400">{staff.email}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar className="w-12 h-12 ring-2 ring-gray-600">
                    <AvatarFallback className="bg-gradient-to-br from-orange-600 to-orange-700 text-white font-semibold">
                      {staff.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{staff.name}</p>
                    <p className="text-orange-400 text-xs truncate">{staff.email}</p>
                    <p className="text-orange-500 text-xs">{staff.department || "Staff"}</p>
                  </div>
                </div>

                {/* Role Switch for Admins */}
                {isAdmin && (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Button
                        variant={viewMode === "user" ? "default" : "ghost"}
                        size="sm"
                        className={`flex-1 text-xs h-8 ${
                          viewMode === "user" 
                            ? "bg-blue-600 hover:bg-blue-700 text-white" 
                            : "text-orange-300 hover:text-white hover:bg-orange-700/50 border border-orange-600/50"
                        }`}
                        onClick={() => switchViewMode("user")}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        User
                      </Button>
                      <Button
                        variant={viewMode === "admin" ? "default" : "ghost"}
                        size="sm"
                        className={`flex-1 text-xs h-8 ${
                          viewMode === "admin" 
                            ? "bg-red-600 hover:bg-red-700 text-white" 
                            : "text-orange-300 hover:text-white hover:bg-orange-700/50 border border-orange-600/50"
                        }`}
                        onClick={() => switchViewMode("admin")}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 pb-4 overflow-y-auto">
            <div className="space-y-2">
              {/* Mode indicator for collapsed sidebar */}
              {isCollapsed && (
                <div className="flex justify-center pb-2">
                  <div className={`w-8 h-1 rounded-full ${
                    viewMode === "admin" ? "bg-red-500" : "bg-blue-500"
                  }`} />
                </div>
              )}

              {/* Current View Label */}
              {!isCollapsed && (
                <div className="px-3 py-2">
                  <Badge className={`text-xs font-medium ${
                    viewMode === "admin" 
                      ? "bg-red-500/20 text-red-300 border-red-500/30" 
                      : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                  }`}>
                    {viewMode === "admin" ? "Admin Mode" : "User Mode"}
                  </Badge>
                </div>
              )}

              {/* User Navigation */}
              {viewMode === "user" && (
                <div className="space-y-1">
                  {!isCollapsed && (
                    <div className="px-3 py-2">
                      <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                        User Menu
                      </p>
                    </div>
                  )}
                  {userNavItems.map((item) => (
                    <NavigationItem
                      key={item.href}
                      item={item}
                      isActive={isActivePath(item.href)}
                    />
                  ))}
                </div>
              )}

              {/* Admin Navigation */}
              {viewMode === "admin" && isAdmin && (
                <div className="space-y-1">
                  {!isCollapsed && (
                    <div className="px-3 py-2">
                      <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                        Admin Menu
                      </p>
                    </div>
                  )}
                  {adminNavItems.map((item) => (
                    <NavigationItem
                      key={item.href}
                      item={item}
                      isActive={isActivePath(item.href)}
                    />
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-orange-800/50">
            {isCollapsed ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-12 h-12 mx-auto flex items-center justify-center text-orange-400 hover:text-white hover:bg-orange-800/50 rounded-xl"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Sign Out</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start text-orange-300 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-200"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-4 w-4 text-orange-300" />
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar - Fixed Overlay */}
      <div className={`fixed left-0 top-0 z-40 h-full w-72 md:hidden bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-r border-gray-800/50 transition-transform duration-300 ease-in-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex items-center justify-between px-4 py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <img
                  src="https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a&mode=admin"
                  alt="Logo"
                  className="w-6 h-6 object-cover rounded-lg"
                />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">Asset Manager</h1>
                <p className="text-orange-400 text-xs">RETC Management</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-orange-400 hover:text-white hover:bg-orange-800/50 p-2"
              onClick={() => setIsMobileOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile User Info */}
          <div className="px-4 pb-6">
            <div className="bg-orange-800/30 backdrop-blur-sm rounded-xl p-4 border border-orange-700/50">
              <div className="flex items-center space-x-3 mb-4">
                <Avatar className="w-12 h-12 ring-2 ring-orange-600">
                  <AvatarFallback className="bg-gradient-to-br from-orange-600 to-orange-700 text-white font-semibold">
                    {staff.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{staff.name}</p>
                  <p className="text-orange-400 text-xs truncate">{staff.email}</p>
                  <p className="text-orange-500 text-xs">{staff.department || "Staff"}</p>
                </div>
              </div>

              {/* Mobile Role Switch for Admins */}
              {isAdmin && (
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Button
                      variant={viewMode === "user" ? "default" : "ghost"}
                      size="sm"
                      className={`flex-1 text-xs h-8 ${
                        viewMode === "user" 
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
                          : "text-orange-300 hover:text-white hover:bg-orange-700/50 border border-orange-600/50"
                      }`}
                      onClick={() => switchViewMode("user")}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      User
                    </Button>
                    <Button
                      variant={viewMode === "admin" ? "default" : "ghost"}
                      size="sm"
                      className={`flex-1 text-xs h-8 ${
                        viewMode === "admin" 
                          ? "bg-red-600 hover:bg-red-700 text-white" 
                          : "text-orange-300 hover:text-white hover:bg-orange-700/50 border border-orange-600/50"
                      }`}
                      onClick={() => switchViewMode("admin")}
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 px-4 pb-4 overflow-y-auto">
            <div className="space-y-2">
              {/* Current View Label */}
              <div className="px-3 py-2">
                <Badge className={`text-xs font-medium ${
                  viewMode === "admin" 
                    ? "bg-red-500/20 text-red-300 border-red-500/30" 
                    : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                }`}>
                  {viewMode === "admin" ? "Admin Mode" : "User Mode"}
                </Badge>
              </div>

              {/* User Navigation */}
              {viewMode === "user" && (
                <div className="space-y-1">
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                      User Menu
                    </p>
                  </div>
                  {userNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isActivePath(item.href)
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                          : "text-orange-300 hover:text-white hover:bg-orange-800/50"
                      }`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <item.icon className="w-4 h-4 mr-3 text-orange-400 group-hover:text-orange-300" />
                      <span className="truncate font-medium text-sm">{item.label}</span>
                      {item.badge && (
                        <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {/* Admin Navigation */}
              {viewMode === "admin" && isAdmin && (
                <div className="space-y-1">
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                      Admin Menu
                    </p>
                  </div>
                  {adminNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isActivePath(item.href)
                          ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25"
                          : "text-orange-300 hover:text-white hover:bg-orange-800/50"
                      }`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <item.icon className="w-4 h-4 mr-3 text-orange-400 group-hover:text-orange-300" />
                      <span className="truncate font-medium text-sm">{item.label}</span>
                      {item.badge && (
                        <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Mobile Footer */}
          <div className="p-4 border-t border-orange-800/50">
            <Button
              variant="ghost"
              className="w-full justify-start text-orange-300 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-200"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4 text-orange-300" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}