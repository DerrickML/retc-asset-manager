"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Home,
  LogOut,
  User,
  Settings,
  Shield,
  Bell,
  ChevronDown,
  Search,
} from "lucide-react";
import { getCurrentStaff, permissions, logout } from "../../lib/utils/auth.js";

export default function TopNav({ showBranding = true, brandingData = null }) {
  const [staff, setStaff] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    loadStaffData();
  }, []);

  const loadStaffData = async () => {
    try {
      const currentStaff = await getCurrentStaff();
      if (currentStaff) {
        setStaff(currentStaff);
        setIsAdmin(permissions.isAdmin(currentStaff));
      }
    } catch (error) {
      console.error("Failed to load staff data:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const defaultBranding = {
    orgName: "RETC Asset Management",
    brandColor: "#2563eb",
  };

  const branding = brandingData || defaultBranding;

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200/50 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 w-full">
          {/* Left: Logo/Branding - Extreme Left */}
          {showBranding && (
            <div className="flex items-center animate-fade-in-up flex-shrink-0">
              <Link
                href={staff ? "/dashboard" : "/guest"}
                className="flex items-center space-x-3 group"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <img
                      src="https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a&mode=admin"
                      alt="RETC Logo"
                      className="w-12 h-12 object-cover rounded-xl"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "block";
                      }}
                    />
                    <span className="hidden">RETC</span>
                  </div>
                </div>
                <div>
                  <h1 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                    {branding.orgName}
                  </h1>
                  {!staff && (
                    <p className="text-sm font-semibold text-primary-600 group-hover:text-primary-700 transition-colors duration-200">
                      Assets Register
                    </p>
                  )}
                </div>
              </Link>
            </div>
          )}

          {/* Center: Search Bar (for authenticated users) */}
          {staff && (
            <div className="hidden md:flex flex-1 justify-center px-6 animate-fade-in">
              <div className="w-full max-w-lg">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl leading-5 bg-white/50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:bg-white/80"
                    placeholder="Search assets, requests, or staff..."
                    type="search"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Right: Actions & User Menu - Extreme Right */}
          <div className="flex items-center space-x-3 animate-slide-in-right flex-shrink-0 ml-auto">
            {staff ? (
              <>
                {/* Notifications Bell */}
                <button className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100/80 rounded-xl transition-all duration-200 group">
                  <Bell className="h-5 w-5 group-hover:animate-bounce" />
                  <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-3 p-2 text-sm rounded-xl hover:bg-gray-100/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <span className="text-sm font-bold text-white">
                            {staff.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="text-left hidden lg:block">
                        <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                          {staff.name}
                        </p>
                        <div className="flex items-center space-x-2">
                          {isAdmin && (
                            <Badge className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs px-2 py-1 shadow-sm">
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                          dropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {/* Enhanced Dropdown Menu */}
                  {dropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setDropdownOpen(false)}
                      />
                      <div className="absolute right-0 z-20 mt-3 w-64 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden animate-fade-in-up">
                        {/* User Info Header */}
                        <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200/50">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                              <span className="text-lg font-bold text-white">
                                {staff.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {staff.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {staff.email}
                              </p>
                              {isAdmin && (
                                <Badge className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs px-2 py-1 shadow-sm mt-1">
                                  Administrator
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          <Link
                            href="/dashboard"
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50/80 hover:text-blue-700 transition-all duration-200 group"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <Home className="w-5 h-5 mr-3 text-gray-500 group-hover:text-blue-600 transition-colors duration-200" />
                            <div>
                              <p className="font-medium">Dashboard</p>
                              <p className="text-xs text-gray-500">
                                Overview & analytics
                              </p>
                            </div>
                          </Link>

                          {isAdmin && (
                            <Link
                              href="/admin/dashboard"
                              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50/80 hover:text-purple-700 transition-all duration-200 group"
                              onClick={() => setDropdownOpen(false)}
                            >
                              <Shield className="w-5 h-5 mr-3 text-gray-500 group-hover:text-purple-600 transition-colors duration-200" />
                              <div>
                                <p className="font-medium">Admin Panel</p>
                                <p className="text-xs text-gray-500">
                                  System management
                                </p>
                              </div>
                            </Link>
                          )}

                          <Link
                            href="/profile"
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50/80 hover:text-gray-900 transition-all duration-200 group"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <Settings className="w-5 h-5 mr-3 text-gray-500 group-hover:text-gray-600 transition-colors duration-200" />
                            <div>
                              <p className="font-medium">Profile Settings</p>
                              <p className="text-xs text-gray-500">
                                Account preferences
                              </p>
                            </div>
                          </Link>
                        </div>

                        <div className="border-t border-gray-200/50 bg-gray-50/50">
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              handleLogout();
                            }}
                            className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50/80 hover:text-red-700 transition-all duration-200 group"
                          >
                            <LogOut className="w-5 h-5 mr-3 group-hover:text-red-700 transition-colors duration-200" />
                            <div className="text-left">
                              <p className="font-medium">Sign Out</p>
                              <p className="text-xs text-red-500">
                                End your session
                              </p>
                            </div>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <Button
                asChild
                className="bg-gradient-to-r from-primary-600 via-primary-700 to-sidebar-600 hover:from-primary-700 hover:via-sidebar-600 hover:to-primary-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 px-6 py-3"
              >
                <Link href="/login" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span className="font-semibold">Staff Sign In</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
