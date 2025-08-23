"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { getCurrentStaff, logout, permissions } from "../../lib/utils/auth.js"
import { settingsService } from "../../lib/appwrite/provider.js"

export function Navbar() {
  const [staff, setStaff] = useState(null)
  const [settings, setSettings] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        const [currentStaff, systemSettings] = await Promise.all([getCurrentStaff(), settingsService.get()])
        setStaff(currentStaff)
        setSettings(systemSettings)
      } catch (error) {
        console.error("Failed to load navbar data:", error)
      }
    }
    loadData()
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (!staff || !settings) {
    return null
  }

  const canManageAssets = permissions.canManageAssets(staff)
  const canManageUsers = permissions.canManageUsers(staff)
  const canViewReports = permissions.canViewReports(staff)

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <Link href="/assets" className="flex items-center space-x-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: settings.branding.brandColor }}
            >
              RETC
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Asset Management</h1>
              <p className="text-xs text-gray-500">{settings.branding.orgName}</p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/assets" className="text-gray-700 hover:text-gray-900 font-medium">
            Assets
          </Link>
          <Link href="/requests" className="text-gray-700 hover:text-gray-900 font-medium">
            My Requests
          </Link>
          {canManageAssets && (
            <Link href="/admin/requests" className="text-gray-700 hover:text-gray-900 font-medium">
              Admin Queue
            </Link>
          )}
          {canViewReports && (
            <Link href="/admin/dashboard" className="text-gray-700 hover:text-gray-900 font-medium">
              Dashboard
            </Link>
          )}
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gray-100">{getInitials(staff.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{staff.name}</p>
              <p className="text-xs text-gray-500">{staff.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">Profile Settings</Link>
            </DropdownMenuItem>
            {canManageUsers && (
              <DropdownMenuItem asChild>
                <Link href="/admin/settings">System Settings</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}