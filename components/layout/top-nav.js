"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { 
  Home, 
  LogOut, 
  User,
  Settings,
  Shield
} from "lucide-react"
import { getCurrentStaff, permissions, logout } from "../../lib/utils/auth.js"

export default function TopNav({ showBranding = true, brandingData = null }) {
  const [staff, setStaff] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    loadStaffData()
  }, [])

  const loadStaffData = async () => {
    try {
      const currentStaff = await getCurrentStaff()
      if (currentStaff) {
        setStaff(currentStaff)
        setIsAdmin(permissions.isAdmin(currentStaff))
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

  const defaultBranding = {
    orgName: "RETC Asset Management",
    brandColor: "#2563eb"
  }

  const branding = brandingData || defaultBranding

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo/Branding */}
          {showBranding && (
            <div className="flex items-center">
              <Link href={staff ? "/dashboard" : "/guest"} className="flex items-center space-x-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: branding.brandColor }}
                >
                  RETC
                </div>
                <div>
                  <h1 className="font-bold text-gray-900">{branding.orgName}</h1>
                  {!staff && <p className="text-sm text-gray-600">Public Catalog</p>}
                </div>
              </Link>
            </div>
          )}

          {/* Right: User Menu or Login */}
          <div className="flex items-center space-x-4">
            {staff ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {staff.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{staff.name}</p>
                      <div className="flex items-center space-x-2">
                        {isAdmin && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 z-20 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                      <Link
                        href="/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <Home className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                      
                      {isAdmin && (
                        <Link
                          href="/admin/dashboard"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Panel
                        </Link>
                      )}
                      
                      <hr className="my-1" />
                      
                      <button
                        onClick={() => {
                          setDropdownOpen(false)
                          handleLogout()
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Button asChild>
                <Link href="/login">
                  <User className="w-4 h-4 mr-2" />
                  Staff Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}