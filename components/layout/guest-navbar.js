"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { settingsService } from "../../lib/appwrite/provider.js";
import { getCurrentStaff, logout } from "../../lib/utils/auth.js";
import { Package, LogIn, Menu, X, Settings, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useOrgTheme } from "../providers/org-theme-provider";

export function GuestNavbar() {
  const [settings, setSettings] = useState(null);
  const [staff, setStaff] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { theme } = useOrgTheme();
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [systemSettings, currentStaff] = await Promise.all([
          settingsService.get(),
          getCurrentStaff().catch(() => null),
        ]);
        setSettings(systemSettings);
        setStaff(currentStaff);
      } catch (error) {
        console.error("Failed to load navbar data:", error);
      }
    };
    loadData();
  }, []);

  const orgLogo =
    theme?.branding?.logoProxy ||
    theme?.branding?.logo ||
    settings?.branding?.logo ||
    "https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a";
  const brandName = theme?.name || settings?.branding?.orgName || "Asset Management";
  const brandTagline =
    theme?.branding?.tagline || settings?.branding?.orgName || "Unified asset workspace";

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

  if (!settings) {
    return (
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/30 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="animate-pulse flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl"></div>
              <div className="w-40 h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const navigation = [
    { name: "Browse Assets", href: "/guest/assets", icon: Package },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/30 sticky top-0 z-50 shadow-xl">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-primary-200/20 to-blue-200/20 rounded-full blur-xl animate-pulse"></div>
        <div
          className="absolute -bottom-10 -left-10 w-16 h-16 bg-gradient-to-br from-cyan-200/20 to-purple-200/20 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Enhanced Logo and Brand */}
          <div className="flex items-center space-x-5">
            <Link href="/guest" className="flex items-center space-x-4 group">
              <div className="relative">
                {/* Enhanced logo with glassmorphism effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-200/30 to-blue-200/30 rounded-2xl blur-sm group-hover:blur-md transition-all duration-500"></div>
                <div className="relative bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-2 shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <img
                    src={orgLogo}
                    alt={`${brandName} logo`}
                    className="w-12 h-12 object-cover rounded-xl group-hover:scale-110 transition-all duration-300"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg hidden group-hover:scale-110 transition-all duration-300">
                    {brandName?.split(" ")[0]?.[0] || "A"}
                  </div>
                </div>
              </div>
              <div className="group-hover:translate-x-1 transition-transform duration-300">
                <h1 className="font-bold text-xl bg-gradient-to-r from-gray-900 via-primary-700 to-blue-600 bg-clip-text text-transparent group-hover:from-primary-600 group-hover:to-blue-500 transition-all duration-300">
                  {brandName}
                </h1>
                <p className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300 font-medium">
                  {brandTagline}
                </p>
              </div>
            </Link>
          </div>

          {/* Enhanced Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group relative flex items-center space-x-3 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 text-gray-700 hover:text-white hover:scale-105 bg-white/60 backdrop-blur-sm border border-gray-200/50 hover:border-primary-300/50 hover:bg-gradient-to-r hover:from-primary-600 hover:to-blue-600 shadow-lg hover:shadow-xl"
                >
                  <Icon className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors duration-300" />
                  <span>{item.name}</span>
                  {/* Hover effect background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              );
            })}
          </div>

          {/* Enhanced Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Enhanced Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-3 text-gray-600 hover:text-white hover:bg-gradient-to-r hover:from-primary-600 hover:to-blue-600 bg-white/60 backdrop-blur-sm border border-gray-200/50 hover:border-primary-300/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {/* Enhanced User Menu or Sign In Button */}
            {staff ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="group flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 hover:border-primary-300/50 rounded-2xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-2 transition-all duration-300 hover:scale-105">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/30 to-blue-500/30 rounded-2xl blur-sm group-hover:blur-md transition-all duration-500"></div>
                      <div className="relative w-12 h-12 bg-gradient-to-r from-primary-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                        <span className="text-lg font-bold text-white">
                          {getInitials(staff.name)}
                        </span>
                      </div>
                    </div>
                    <div className="text-left hidden xl:block group-hover:translate-x-1 transition-transform duration-300">
                      <p className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors duration-300">
                        {staff.name.split(" ")[0]}
                      </p>
                      <p className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors duration-300">
                        {staff.email.split("@")[0]}
                      </p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-72 bg-white/90 backdrop-blur-md border border-gray-200/30 shadow-2xl rounded-3xl overflow-hidden"
                  align="end"
                >
                  {/* Enhanced User Info Header */}
                  <div className="px-6 py-6 bg-gradient-to-br from-primary-50/80 to-blue-50/80 border-b border-gray-200/30">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-400/30 to-blue-400/30 rounded-2xl blur-sm"></div>
                        <div className="relative w-16 h-16 bg-gradient-to-r from-primary-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
                          <span className="text-xl font-bold text-white">
                            {getInitials(staff.name)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg text-gray-900 mb-1">
                          {staff.name}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          {staff.email}
                        </p>
                        <div className="mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full inline-block">
                          Active
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Menu Items */}
                  <div className="py-3">
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center px-6 py-4 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100/50 hover:text-red-700 transition-all duration-300 group cursor-pointer mx-3 rounded-2xl"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-red-200/30 rounded-xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                        <div className="relative w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <LogOut className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      </div>
                      <div className="text-left ml-4">
                        <p className="font-semibold text-base">Sign Out</p>
                        <p className="text-xs text-red-500 font-medium">
                          End your session
                        </p>
                      </div>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                asChild
                className="group relative bg-gradient-to-r from-primary-600 via-primary-700 to-blue-600 hover:from-primary-700 hover:via-blue-600 hover:to-primary-800 text-white px-6 py-3 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <Link
                  href="/login"
                  className="flex items-center space-x-3 relative z-10"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-lg blur-sm group-hover:blur-md transition-all duration-500"></div>
                    <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <span className="font-semibold">Sign In</span>
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200/30 bg-white/90 backdrop-blur-md shadow-xl">
          <div className="px-6 py-6 space-y-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="group flex items-center space-x-4 px-6 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-primary-600 hover:to-blue-600 bg-white/60 backdrop-blur-sm border border-gray-200/50 hover:border-primary-300/50 shadow-lg hover:shadow-xl"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-500"></div>
                    <div className="relative w-10 h-10 bg-white/80 group-hover:bg-transparent rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <Icon className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors duration-300" />
                    </div>
                  </div>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
