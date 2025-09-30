"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Sidebar from "./sidebar";
import TopNav from "./top-nav";
import {
  getCurrentStaff,
  initSessionMonitoring,
} from "../../lib/utils/auth.js";
import { settingsService } from "../../lib/appwrite/provider.js";

export default function LayoutProvider({ children }) {
  const pathname = usePathname();
  const [staff, setStaff] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAppData = useCallback(async () => {
    try {
      setError(null);

      // Load staff data with timeout
      const staffPromise = getCurrentStaff().catch(() => null);

      // Load settings with timeout
      const settingsPromise = settingsService.get().catch(() => null);

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

    // Initialize session monitoring for authenticated users
    const cleanup = initSessionMonitoring();

    return () => {
      cleanup();
    };
  }, [loadAppData]);

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
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
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
  const sidebarRoutes = ["/dashboard", "/admin", "/assets", "/requests"];

  const isNoLayout = noLayoutRoutes.some((route) => pathname.startsWith(route));
  const isTopNavOnly = topNavOnlyRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isSidebarRoute = sidebarRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // No layout for login/setup pages
  if (isNoLayout) {
    return <>{children}</>;
  }

  // Top navigation only (guest portal)
  if (isTopNavOnly) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav showBranding={true} brandingData={settings?.branding} />
        <main>{children}</main>
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
      <TopNav showBranding={true} brandingData={settings?.branding} />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
