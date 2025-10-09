"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export function GuestNavbar() {
  const [settings, setSettings] = useState(null);
  const [staff, setStaff] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const navigation = [
    { name: "Browse Assets", href: "/guest/assets", icon: Package },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand - Simple design without blue container */}
          <div className="flex items-center space-x-4">
            <Link href="/guest" className="flex items-center space-x-3 group">
              <div className="relative">
                {/* Simple logo without blue container */}
                <img
                  src="https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a&mode=admin"
                  alt="RETC Logo"
                  className="w-10 h-10 object-cover rounded-lg group-hover:scale-105 transition-all duration-300"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 font-bold text-sm hidden">
                  RETC
                </div>
              </div>
              <div>
                <h1 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                  Asset Management
                </h1>
                <p className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors duration-200">
                  {settings.branding.orgName}
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 text-gray-700 hover:text-gray-900 hover:bg-gray-50/80"
                >
                  <Icon className="w-4 h-4 text-gray-500" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
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

            {/* User Menu or Sign In Button */}
            {staff ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 group">
                    <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <span className="text-sm font-bold text-white">
                        {getInitials(staff.name)}
                      </span>
                    </div>
                    <div className="text-left hidden xl:block">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                        {staff.name.split(" ")[0]}
                      </p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-2xl rounded-2xl overflow-hidden"
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
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2"></div>

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
            ) : (
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link href="/login" className="flex items-center space-x-2">
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-sm">
          <div className="px-4 py-3 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-gray-700 hover:text-gray-900 hover:bg-gray-50/80"
                >
                  <Icon className="w-5 h-5 text-gray-500" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}