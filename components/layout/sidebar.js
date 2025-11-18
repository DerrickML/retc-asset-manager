"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  ChevronLeft,
  ShoppingCart,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { getCurrentStaff, permissions, logout } from "../../lib/utils/auth.js";
import { assetRequestsService } from "../../lib/appwrite/provider.js";
import { Query } from "appwrite";
import { ENUMS } from "../../lib/appwrite/config.js";
import { useOrgTheme } from "../providers/org-theme-provider";

export default function Sidebar() {
  const [staff, setStaff] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("viewMode") || "user";
    }
    return "user";
  }); // "user" or "admin"
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    admin: false,
    assets: false,
    consumables: false,
    requests: false,
  });
  const pathname = usePathname();
  const { theme } = useOrgTheme();
  const orgLogo =
    theme?.branding?.logoProxy ||
    theme?.branding?.logo ||
    "https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a";
  const orgName = theme?.name || "Asset Manager";
  const orgTagline = theme?.branding?.tagline || "Asset Management";
  const systemName = "Assets Manager";
  const orgCode = theme?.code || "RETC";
  const isAdminView = viewMode === "admin";

  // Function to update view mode and persist it
  const updateViewMode = (mode) => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("viewMode", mode);
      // Dispatch custom event so other components can react immediately
      window.dispatchEvent(new CustomEvent("viewModeChanged", { detail: { mode } }));
    }
  };

  useEffect(() => {
    loadStaffData();

    // Check if should be collapsed on mobile by default
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setIsCollapsed(true);
        setIsMobileOpen(false);
      }
    };

    // Set initial state
    handleResize();
    window.addEventListener("resize", handleResize);

    // Restore sidebar state from localStorage
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("sidebar-collapsed");
      if (savedState !== null && window.innerWidth >= 768) {
        setIsCollapsed(JSON.parse(savedState));
      }
    }

    return () => window.removeEventListener("resize", handleResize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh pending requests count every 30 seconds for admins
  useEffect(() => {
    if (isAdmin && viewMode === "admin") {
      const interval = setInterval(() => {
        loadPendingRequestsCount();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [isAdmin, viewMode]);

  // Save sidebar state
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed));
    }
  }, [isCollapsed]);

  const loadStaffData = async () => {
    try {
      const currentStaff = await getCurrentStaff();
      if (currentStaff) {
        setStaff(currentStaff);
        const adminStatus = permissions.isAdmin(currentStaff);
        setIsAdmin(adminStatus);

        // Load pending request count for admins
        if (adminStatus) {
          loadPendingRequestsCount();
        }

        // Auto-set view mode based on current path
        if (pathname.startsWith("/admin")) {
          setViewMode("admin");
          setExpandedSections((prev) => ({ ...prev, admin: true }));
        } else {
          setViewMode("user");
        }
      }
    } catch (error) {
      // Silent fail for staff data loading
    }
  };

  const loadPendingRequestsCount = async () => {
    try {
      const response = await assetRequestsService.list([
        Query.equal("status", ENUMS.REQUEST_STATUS.PENDING),
        Query.orderDesc("$createdAt"),
      ]);
      setPendingRequestsCount(response.documents?.length || 0);
    } catch (error) {
      console.error("Error loading pending requests count:", error);
      setPendingRequestsCount(0);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/login";
    } catch (error) {
      // Silent fail for logout
    }
  };

  const toggleSidebar = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 768) {
        setIsMobileOpen(!isMobileOpen);
      } else {
        setIsCollapsed(!isCollapsed);
      }
    }
  };

  const toggleSection = (section) => {
    if (isCollapsed) return; // Don't expand sections when collapsed
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const switchViewMode = (mode) => {
    updateViewMode(mode);
    if (mode === "admin") {
      window.location.href = "/admin/dashboard";
    } else {
      window.location.href = "/dashboard";
    }
  };

  const isActivePath = (path) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  // User navigation items
  const userNavItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: Home,
      badge: null,
    },
    {
      label: "Browse Assets",
      href: "/assets",
      icon: Package,
      badge: null,
    },
    {
      label: "Browse Consumables",
      href: "/consumables",
      icon: ShoppingCart,
      badge: null,
    },
    {
      label: "My Requests",
      href: "/requests",
      icon: FileText,
      badge: null,
    },
    {
      label: "Guest Portal",
      href: "/guest",
      icon: Globe,
      badge: null,
    },
  ];

  // Admin navigation items
  const adminNavItems = [
    {
      label: "Admin Dashboard",
      href: "/admin/dashboard",
      icon: BarChart3,
      badge: null,
    },
    {
      label: "Asset Management",
      href: "/admin/assets",
      icon: Package,
      badge: null,
      children: [
        { label: "All Assets", href: "/admin/assets" },
        { label: "Add Asset", href: "/admin/assets/new" },
      ],
    },
    {
      label: "Consumable Management",
      href: "/admin/consumables",
      icon: ShoppingCart,
      badge: null,
      children: [
        { label: "All Consumables", href: "/admin/consumables" },
        { label: "Add Consumable", href: "/admin/consumables/new" },
      ],
    },
    {
      label: "Request Management",
      href: "/admin/requests",
      icon: FileText,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount.toString() : null,
    },
    {
      label: "User Management",
      href: "/admin/users",
      icon: Users,
      badge: null,
    },
    {
      label: "Reports",
      href: "/admin/reports",
      icon: BarChart3,
      badge: null,
    },
    {
      label: "Notifications",
      href: "/admin/notifications",
      icon: Bell,
      badge: null, // No notification system implemented yet
    },
    {
      label: "System Settings",
      href: "/admin/settings",
      icon: Settings,
      badge: null,
    },
  ];

  const NavigationItem = ({ item, isActive, level = 0 }) => {
    // Use the same blue to green gradient for both active and hover
    const activeClass = "bg-gradient-to-r from-sky-400/70 to-emerald-300/60 text-white shadow-lg scale-[1.02]"; // Blue to green gradient for active
    const hoverClass = "hover:bg-gradient-to-r hover:from-sky-400/60 hover:to-emerald-300/50 hover:text-white hover:shadow-lg hover:scale-[1.02]"; // Bright blue to light green gradient hover

    const ItemContent = (
      <>
        <div className="flex items-center flex-1 min-w-0">
          <item.icon
            className={`flex-shrink-0 ${
              isCollapsed ? "w-5 h-5" : "w-4 h-4 mr-3"
            } ${isActive ? "text-white" : "text-white group-hover:text-white"}`}
          />
          {!isCollapsed && (
            <>
              <span className="truncate font-medium text-sm text-white">
                {item.label}
              </span>
              {item.badge && (
                <Badge
                  className="ml-auto text-xs px-2 py-0.5 min-w-[1.45rem] h-5 font-semibold text-[var(--org-primary)] shadow"
                  style={{ background: "rgba(255,255,255,0.95)" }}
                >
                  {item.badge}
                </Badge>
              )}
            </>
          )}
        </div>
        {!isCollapsed && item.children && (
          <ChevronRight
            className={`w-4 h-4 transition-transform ${
              expandedSections[item.href] ? "rotate-90" : ""
            } text-white/70`}
          />
        )}
      </>
    );

    if (isCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                className={`group flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
                  isActive
                    ? `${activeClass}`
                    : `text-white/80 ${hoverClass}`
                } ${level > 0 ? "ml-4" : ""}`}
              >
                {ItemContent}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              <p>{item.label}</p>
              {item.badge && (
                <Badge
                  className="ml-2 text-xs font-semibold text-[var(--org-primary)] shadow"
                  style={{ background: "rgba(255,255,255,0.95)" }}
                >
                  {item.badge}
                </Badge>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <Link
        href={item.href}
        className={`group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
          isActive
            ? `${activeClass}`
            : `text-white/80 ${hoverClass}`
        } ${level > 0 ? "ml-6" : ""}`}
      >
        {ItemContent}
      </Link>
    );
  };

  if (!staff) {
    return null; // Don't render sidebar if not authenticated
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
        className="fixed bottom-6 left-6 z-50 md:hidden w-14 h-14 rounded-full text-white shadow-2xl border-0 transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 flex items-center justify-center"
        onClick={() => {
          setIsMobileOpen(!isMobileOpen);
        }}
        type="button"
        style={
          isMobileOpen
            ? undefined
            : {
                background: "linear-gradient(135deg, var(--org-primary), var(--org-primary-dark))",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.25)",
              }
        }
      >
        {isMobileOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}

        {/* Subtle floating animation pulse */}
        {!isMobileOpen && (
          <div
            className="absolute inset-0 rounded-full opacity-20 animate-ping pointer-events-none"
            style={{
              background: "linear-gradient(135deg, var(--org-primary), var(--org-primary-dark))",
            }}
          ></div>
        )}

        {/* Notification badge for mobile */}
        {!isMobileOpen && isAdmin && viewMode === "admin" && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white shadow-lg pointer-events-none">
            5
          </div>
        )}
      </button>

      {/* Desktop Sidebar - Inline */}
      <div
        className={`hidden md:flex flex-col border-r transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-72"
        }`}
        style={{
          background: "linear-gradient(180deg, var(--org-primary-dark), var(--org-primary))",
          borderColor: "var(--org-primary-dark)",
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-6">
            {!isCollapsed ? (
              <div
                className="flex items-center space-x-3 px-3 py-2 rounded-2xl shadow-lg"
                style={{
                  background: "linear-gradient(135deg, var(--org-primary), var(--org-primary-dark))",
                }}
              >
                <div className="relative w-12 h-12 overflow-hidden rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <img
                    src={orgLogo}
                    alt={`${systemName} logo`}
                    className="absolute inset-0 w-full h-full object-contain p-1.5"
                    style={{ objectPosition: "center" }}
                  />
                </div>
                <div>
                  <h1 className="text-white font-bold text-xl leading-tight">
                    {systemName}
                  </h1>
                </div>
              </div>
            ) : (
              <div className="relative w-12 h-12 mx-auto overflow-hidden rounded-full bg-white shadow-sm">
                <img
                  src={orgLogo}
                  alt={`${orgName} logo`}
                  className="absolute inset-0 w-full h-full object-contain scale-[1.3] mx-auto p-1.5"
                  style={{ objectPosition: "center" }}
                />
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex items-center justify-center rounded-full text-white p-2 shadow-lg hover:shadow-xl transition-transform"
              style={{
                background: "linear-gradient(140deg, var(--org-primary), var(--org-highlight))",
                border: "1px solid rgba(255, 255, 255, 0.35)",
              }}
              onClick={toggleSidebar}
            >
              <ChevronLeft
                className={`w-4 h-4 transition-transform duration-200 ${
                  isCollapsed ? "rotate-180" : ""
                }`}
              />
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
                        <AvatarFallback className="bg-gradient-to-br from-sidebar-500 to-sidebar-600 text-white font-semibold">
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
                    <AvatarFallback className="bg-gradient-to-br from-sidebar-500 to-sidebar-600 text-white font-semibold">
                      {staff.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {staff.name}
                    </p>
                    <p className="text-org-tagline text-xs truncate">
                      {staff.email}
                    </p>
                    <p className="text-org-tagline text-xs">
                      {staff.department || "Staff"}
                    </p>
                  </div>
                </div>

                {/* Role Switch for Admins */}
                {isAdmin && (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Button
                        variant={viewMode === "user" ? "default" : "ghost"}
                        size="sm"
                        className={`sidebar-user-toggle flex-1 text-xs h-8 transition-all duration-200 font-medium ${
                          viewMode === "user"
                            ? "bg-gradient-to-r from-sky-400/70 to-emerald-300/60 text-white shadow-lg scale-[1.02]"
                            : "!text-white border-2 border-white/60 bg-gradient-to-r from-sky-400/50 to-emerald-300/40 hover:from-sky-400/60 hover:to-emerald-300/50 hover:!text-white hover:shadow-lg hover:scale-[1.02] hover:border-white"
                        }`}
                        onClick={() => switchViewMode("user")}
                      >
                        <Eye className="w-3 h-3 mr-1 !text-white" />
                        <span className="!text-white">User</span>
                      </Button>
                      <Button
                        variant={viewMode === "admin" ? "default" : "ghost"}
                        size="sm"
                        className={`sidebar-user-toggle flex-1 text-xs h-8 transition-all duration-200 font-medium ${
                          viewMode === "admin"
                            ? "bg-gradient-to-r from-sky-400/70 to-emerald-300/60 text-white shadow-lg scale-[1.02]"
                            : "!text-white border-2 border-white/60 bg-gradient-to-r from-sky-400/50 to-emerald-300/40 hover:from-sky-400/60 hover:to-emerald-300/50 hover:!text-white hover:shadow-lg hover:scale-[1.02] hover:border-white"
                        }`}
                        onClick={() => switchViewMode("admin")}
                      >
                        <Shield className="w-3 h-3 mr-1 !text-white" />
                        <span className="!text-white">Admin</span>
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
                  <div
                    className={`w-8 h-1 rounded-full ${
                      viewMode === "admin" ? "bg-red-500" : "bg-sidebar-500"
                    }`}
                  />
                </div>
              )}

              {/* Current View Label */}
              {!isCollapsed && (
                <div className="px-3 py-2">
                  <Badge
                    variant="outline"
                    className={`badge-mode ${
                      viewMode === "admin"
                        ? "badge-mode--admin"
                        : "badge-mode--user"
                    }`}
                  >
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
                      <p className="text-xs font-semibold text-sidebar-300 uppercase tracking-wider">
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
                      className="sidebar-signout w-12 h-12 mx-auto flex items-center justify-center text-red-500 border-[3px] border-white bg-gradient-to-r from-sky-400/60 to-emerald-300/50 hover:from-sky-400/70 hover:to-emerald-300/60 hover:border-white hover:shadow-2xl rounded-xl transition-all duration-200 font-bold shadow-2xl ring-4 ring-white/50"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-6 h-6 text-red-500" />
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
                className="sidebar-signout w-full justify-start text-red-500 border-[3px] border-white bg-gradient-to-r from-sky-400/60 to-emerald-300/50 hover:from-sky-400/70 hover:to-emerald-300/60 hover:border-white hover:shadow-2xl transition-all duration-200 font-bold rounded-lg shadow-2xl ring-4 ring-white/50 py-3"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5 text-red-500" />
                <span className="text-red-500">Sign Out</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar - Fixed Overlay */}
      <div
        className={`fixed left-0 top-0 z-40 h-full w-72 md:hidden border-r transition-transform duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "linear-gradient(180deg, var(--org-primary-dark), var(--org-primary))",
          borderColor: "var(--org-primary-dark)",
        }}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex items-center justify-between px-4 py-6">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12 overflow-hidden rounded-full bg-white shadow-sm">
                <img
                  src={orgLogo}
                  alt={`${orgName} logo`}
                  className="absolute inset-0 w-full h-full object-contain scale-[1.3] p-1.5"
                  style={{ objectPosition: "center" }}
                />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">{orgName}</h1>
                <p className="text-xs text-org-tagline">{orgTagline}</p>
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
            <div
              className="backdrop-blur-sm rounded-xl p-4 border border-org-muted"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <Avatar className="w-12 h-12 ring-2"
                  style={{ boxShadow: "0 0 0 2px rgba(255,255,255,0.25) inset" }}
                >
                  <AvatarFallback className="bg-org-gradient text-white font-semibold">
                    {staff.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    {staff.name}
                  </p>
                  <p className="text-org-tagline text-xs truncate">
                    {staff.email}
                  </p>
                  <p className="text-org-tagline text-xs">
                    {staff.department || "Staff"}
                  </p>
                </div>
              </div>

              {/* Mobile Role Switch for Admins */}
              {isAdmin && (
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Button
                      variant={viewMode === "user" ? "default" : "ghost"}
                      size="sm"
                      className={`flex-1 text-xs h-8 transition-all duration-200 font-medium ${
                        viewMode === "user"
                          ? "bg-gradient-to-r from-sky-400/70 to-emerald-300/60 text-white shadow-lg scale-[1.02]"
                          : "!text-white border-2 border-white/60 bg-gradient-to-r from-sky-400/50 to-emerald-300/40 hover:from-sky-400/60 hover:to-emerald-300/50 hover:!text-white hover:shadow-lg hover:scale-[1.02] hover:border-white"
                      }`}
                      onClick={() => switchViewMode("user")}
                    >
                      <Eye className="w-3 h-3 mr-1 !text-white" />
                      <span className="!text-white">User</span>
                    </Button>
                    <Button
                      variant={viewMode === "admin" ? "default" : "ghost"}
                      size="sm"
                      className={`flex-1 text-xs h-8 transition-all duration-200 font-medium ${
                        viewMode === "admin"
                          ? "bg-gradient-to-r from-sky-400/70 to-emerald-300/60 text-white shadow-lg scale-[1.02]"
                          : "!text-white border-2 border-white/60 bg-gradient-to-r from-sky-400/50 to-emerald-300/40 hover:from-sky-400/60 hover:to-emerald-300/50 hover:!text-white hover:shadow-lg hover:scale-[1.02] hover:border-white"
                      }`}
                      onClick={() => switchViewMode("admin")}
                    >
                      <Shield className="w-3 h-3 mr-1 !text-white" />
                      <span className="!text-white">Admin</span>
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
                <Badge
                  className={`bg-org-gradient text-white text-xs font-medium border-org-muted`}
                >
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
                          ? "bg-gradient-to-r from-sky-400/70 to-emerald-300/60 text-white shadow-lg scale-[1.02]"
                          : `text-white/80 hover:bg-gradient-to-r hover:from-sky-400/60 hover:to-emerald-300/50 hover:text-white hover:shadow-lg hover:scale-[1.02]`
                      }`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <item.icon className="w-4 h-4 mr-3 text-white group-hover:text-white" />
                      <span className="truncate font-medium text-sm text-white">
                        {item.label}
                      </span>
                      {item.badge && (
                        <Badge
                          className="ml-auto text-xs px-2 py-0.5 min-w-[1.45rem] h-5 font-semibold text-[var(--org-primary)] shadow"
                          style={{ background: "rgba(255,255,255,0.95)" }}
                        >
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
                    <p className="text-xs font-semibold text-orange-300 uppercase tracking-wider">
                      {viewMode === "admin" ? "Admin Menu" : "User Menu"}
                    </p>
                  </div>
                  {adminNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isActivePath(item.href)
                          ? "bg-gradient-to-r from-sky-400/70 to-emerald-300/60 text-white shadow-lg scale-[1.02]"
                          : "text-white/80 hover:bg-gradient-to-r hover:from-sky-400/60 hover:to-emerald-300/50 hover:text-white hover:shadow-lg hover:scale-[1.02]"
                      }`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <item.icon className="w-4 h-4 mr-3 text-white group-hover:text-white" />
                      <span className="truncate font-medium text-sm text-white">
                        {item.label}
                      </span>
                      {item.badge && (
                        <Badge
                          className="ml-auto text-xs px-2 py-0.5 min-w-[1.45rem] h-5 font-semibold text-[var(--org-primary)] shadow"
                          style={{ background: "rgba(255,255,255,0.95)" }}
                        >
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
              className="sidebar-signout w-full justify-start text-red-500 border-[3px] border-white bg-gradient-to-r from-sky-400/60 to-emerald-300/50 hover:from-sky-400/70 hover:to-emerald-300/60 hover:border-white hover:shadow-2xl transition-all duration-200 font-bold rounded-lg shadow-2xl ring-4 ring-white/50 py-3"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5 text-red-500" />
              <span className="text-red-500">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
