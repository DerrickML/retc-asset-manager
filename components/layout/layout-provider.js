"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Sidebar from "./sidebar";
import { Navbar } from "./navbar";
import { GuestNavbar } from "./guest-navbar";
import { getCurrentStaff } from "../../lib/utils/auth.js";
import { settingsService } from "../../lib/appwrite/provider.js";
import { useToastContext } from "../providers/toast-provider";
import { useInactivityLogout } from "../../lib/hooks/useInactivityLogout.js";

export default function LayoutProvider({ children }) {
  const pathname = usePathname();
  const toast = useToastContext();
  const [staff, setStaff] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine route types early for hook configuration
  const isNoLayout =
    pathname.startsWith("/login") || pathname.startsWith("/setup");
  const isTopNavOnly = pathname.startsWith("/guest");

  // Always call the hook (React hooks rule) but control enablement via config
  const { WarningModal } = useInactivityLogout({
    inactivityTimeout: 15 * 60 * 1000, // 15 minutes
    warningTimeout: 2 * 60 * 1000, // 2 minutes warning before logout
    enabled: !isNoLayout && !isTopNavOnly && staff !== null, // Only enable for authenticated staff
  });

  const loadAppData = useCallback(async () => {
    try {
      setError(null);

      // Load staff data with timeout
      const staffPromise = getCurrentStaff().catch((err) => {
        // Silent fail for staff - user can still use the app
        return null;
      });

      // Load settings with timeout
      const settingsPromise = settingsService.get().catch((err) => {
        // Silent fail for settings - app will use defaults
        return null;
      });

      // Wait for both with a timeout
      const [currentStaff, systemSettings] = await Promise.all([
        staffPromise,
        settingsPromise,
      ]);

      setStaff(currentStaff);
      setSettings(systemSettings);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppData();

    // Set a timeout to stop loading after 10 seconds
    const timeout = setTimeout(() => {
      if (loading) {
        // Timeout reached - stop loading
        setLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [loadAppData, loading]);

  // Listen for session warning events
  useEffect(() => {
    const handleSessionWarning = (event) => {
      toast.info(event.detail.message);
    };

    window.addEventListener("session-warning", handleSessionWarning);
    return () =>
      window.removeEventListener("session-warning", handleSessionWarning);
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error loading application</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              loadAppData();
            }}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Retrying...
              </>
            ) : (
              "Retry"
            )}
          </button>
        </div>
      </div>
    );
  }

  // Define routes that don't need any layout
  const noLayoutRoutes = ["/login", "/setup"];

  // Define routes that only need top navigation (like guest portal)
  const topNavOnlyRoutes = ["/guest"];

  // Define routes that need full sidebar layout (authenticated users)
  const sidebarRoutes = [
    "/dashboard",
    "/admin",
    "/assets",
    "/consumables",
    "/requests",
  ];

  // Re-check route types now that we have data loaded
  const finalIsNoLayout = noLayoutRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const finalIsTopNavOnly = topNavOnlyRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isSidebarRoute = sidebarRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // No layout for login/setup pages
  if (finalIsNoLayout) {
    return (
      <>
        {children}
        <WarningModal />
      </>
    );
  }

  // Top navigation only (guest portal)
  if (finalIsTopNavOnly) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GuestNavbar />
        <main>{children}</main>
        <WarningModal />
      </div>
    );
  }

  // Full sidebar layout for authenticated users
  if (staff && (isSidebarRoute || pathname === "/")) {
    return (
      <div className="flex h-screen bg-sidebar-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-auto">
            <div className="p-6">{children}</div>
          </main>
        </div>
        <WarningModal />
      </div>
    );
  }

  // Default: redirect to login if not authenticated, otherwise show with sidebar
  if (!staff) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  // Fallback layout
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <WarningModal />
    </div>
  );
}
