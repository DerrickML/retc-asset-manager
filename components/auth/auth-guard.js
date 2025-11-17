"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentStaff } from "../../lib/utils/auth.js"
import { permissions } from "../../lib/utils/auth.js"

export function AuthGuard({ children, requiredPermission, fallback }) {
  const [staff, setStaff] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Auth check timeout")), 8000)
        );

        const staffPromise = getCurrentStaff();
        const currentStaff = await Promise.race([staffPromise, timeoutPromise]);

        if (!currentStaff) {
          // Check if user is authenticated but no staff record
          try {
            const { getCurrentUser } = await import("../../lib/utils/auth.js");
            const user = await getCurrentUser();
            if (user) {
              // User authenticated but no staff - redirect to unauthorized with reason
              router.push("/unauthorized?reason=no_staff_record");
              return;
            }
          } catch (userError) {
            // User not authenticated - go to login
          }
          router.push("/login");
          return;
        }

        if (requiredPermission && !permissions[requiredPermission](currentStaff)) {
          if (fallback) {
            setStaff(currentStaff);
            setLoading(false);
            return;
          }
          router.push("/unauthorized");
          return;
        }

        setStaff(currentStaff);
      } catch (error) {
        console.error("Auth check error:", error);
        // On timeout or error, redirect to login
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, requiredPermission, fallback]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!staff) {
    return null
  }

  if (requiredPermission && !permissions[requiredPermission](staff) && fallback) {
    return <>{fallback}</>
  }

  return <>{children}</>
}