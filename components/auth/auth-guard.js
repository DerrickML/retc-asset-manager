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
        const currentStaff = await getCurrentStaff()

        if (!currentStaff) {
          router.push("/login")
          return
        }

        if (requiredPermission && !permissions[requiredPermission](currentStaff)) {
          if (fallback) {
            setStaff(currentStaff)
            setLoading(false)
            return
          }
          router.push("/unauthorized")
          return
        }

        setStaff(currentStaff)
      } catch (error) {
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, requiredPermission, fallback])

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