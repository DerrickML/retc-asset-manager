"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import {
  Package,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { getCurrentStaff, logout, permissions } from "../../lib/utils/auth.js";
import { settingsService } from "../../lib/appwrite/provider.js";
import { useOrgTheme } from "../providers/org-theme-provider";

export function Navbar() {
  const [staff, setStaff] = useState(null);
  const [settings, setSettings] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useOrgTheme();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [currentStaff, systemSettings] = await Promise.all([
          getCurrentStaff(),
          settingsService.get(),
        ]);
        setStaff(currentStaff);
        setSettings(systemSettings);
      } catch (error) {
        console.error("Failed to load navbar data:", error);
      }
    };
    loadData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!staff || !settings) {
    return (
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center">
            <div className="animate-pulse flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-xl"></div>
              <div className="w-32 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const canManageAssets = permissions.canManageAssets(staff);
  const canManageUsers = permissions.canManageUsers(staff);
  const canViewReports = permissions.canViewReports(staff);

  const navigation = [
    {
      name: "Assets",
      href: "/assets",
      icon: Package,
      current: pathname === "/assets",
    },
    {
      name: "My Requests",
      href: "/requests",
      icon: FileText,
      current: pathname === "/requests",
    },
    ...(canManageAssets
      ? [
          {
            name: "Admin Queue",
            href: "/admin/requests",
            icon: Users,
            current: pathname === "/admin/requests",
          },
        ]
      : []),
    ...(canViewReports
      ? [
          {
            name: "Dashboard",
            href: "/admin/dashboard",
            icon: BarChart3,
            current: pathname === "/admin/dashboard",
          },
        ]
      : []),
  ];

  const orgLogo =
    theme?.branding?.logoProxy ||
    theme?.branding?.logo ||
    settings?.branding?.logo ||
    "https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a";
  const systemName = "Assets Manager";
  const orgDisplayName = theme?.name || settings.branding.orgName || "Asset Workspace";
  const orgTagline =
    theme?.branding?.tagline || settings.branding.tagline || "Unified asset workspace";
  const orgCode = theme?.code || "RETC";

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4 animate-fade-in-up">
            <Link href="/assets" className="flex items-center space-x-3 group">
              <div className="flex items-center space-x-3 p-2 rounded-2xl shadow-lg transition-all duration-300 group-hover:shadow-xl"
                style={{
                  background: "linear-gradient(135deg, var(--org-primary), var(--org-primary-dark))",
                }}
              >
                <div className="relative w-10 h-10 overflow-hidden rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <img
                    src={orgLogo}
                    alt={`${orgDisplayName} logo`}
                    className="w-7 h-7 object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <div className="hidden text-sm font-semibold text-white">{orgDisplayName}</div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
                    {orgCode}
                  </span>
                  <span className="text-lg font-bold text-white leading-tight">
                    {systemName}
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1 animate-fade-in">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105
                    ${
                      item.current
                        ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-200/50"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-50/80"
                    }
                  `}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      item.current ? "text-blue-600" : "text-gray-500"
                    } transition-colors duration-200`}
                  />
                  <span>{item.name}</span>
                  {item.current && (
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3 animate-slide-in-right">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-xl transition-all duration-200"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 group">
                  <div className="relative">
                    <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <span className="text-sm font-bold text-white">
                        {getInitials(staff.name)}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="text-left hidden xl:block">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                      {staff.name.split(" ")[0]}
                    </p>
                    {permissions.isAdmin(staff) && (
                      <Badge className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs px-2 py-0.5">
                        Admin
                      </Badge>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500 hidden xl:block transition-transform duration-200 group-hover:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-64 bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-2xl rounded-2xl overflow-hidden animate-fade-in-up"
                align="end"
              >
                {/* User Info Header */}
                <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-lg font-bold text-white">
                        {getInitials(staff.name)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {staff.name}
                      </p>
                      <p className="text-sm text-gray-600">{staff.email}</p>
                      {permissions.isAdmin(staff) && (
                        <Badge className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs px-2 py-1 shadow-sm mt-1">
                          Administrator
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  {canManageUsers && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin/settings"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50/80 hover:text-purple-700 transition-all duration-200 group"
                      >
                        <Settings className="w-5 h-5 mr-3 text-gray-500 group-hover:text-purple-600 transition-colors duration-200" />
                        <div>
                          <p className="font-medium">System Settings</p>
                          <p className="text-xs text-gray-500">
                            Admin configuration
                          </p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  )}
                </div>

                <div className="border-t border-gray-200/50 bg-gray-50/50">
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50/80 hover:text-red-700 transition-all duration-200 group cursor-pointer"
                  >
                    <LogOut className="w-5 h-5 mr-3 group-hover:text-red-700 transition-colors duration-200" />
                    <div className="text-left">
                      <p className="font-medium">Sign Out</p>
                      <p className="text-xs text-red-500">End your session</p>
                    </div>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-sm animate-fade-in">
          <div className="px-4 py-3 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                    ${
                      item.current
                        ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-200/50"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-50/80"
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      item.current ? "text-blue-600" : "text-gray-500"
                    }`}
                  />
                  <span>{item.name}</span>
                  {item.current && (
                    <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
