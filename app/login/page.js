"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { login, verifySession, getCurrentStaff } from "../../lib/utils/auth.js"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [callbackUrl, setCallbackUrl] = useState("/dashboard")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const callback = searchParams.get('callback')
    if (callback) {
      setCallbackUrl(callback)
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    console.log('🔍 LOGIN DEBUG - Starting login process:', {
      email,
      callbackUrl,
      timestamp: new Date().toISOString()
    })

    try {
      console.log('🔍 LOGIN DEBUG - Calling login function...')
      const loginResult = await login(email, password, callbackUrl)
      console.log('🔍 LOGIN DEBUG - Login function completed:', {
        success: true,
        hasSession: !!loginResult?.session,
        hasUser: !!loginResult?.user,
        userId: loginResult?.user?.$id
      })
      
      // Wait for session to be properly established and cookies to be set
      console.log('🔍 LOGIN DEBUG - Waiting for session establishment...')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Check cookies immediately after login
      console.log('🔍 LOGIN DEBUG - Checking document cookies after login:', document.cookie)
      
      // Verify session is established before redirecting (with retries for timing issues)
      console.log('🔍 LOGIN DEBUG - Verifying session...')
      let sessionUser = await verifySession()
      let retryCount = 0
      const maxRetries = 3
      
      // Retry session verification if it fails (to handle timing issues)
      while (!sessionUser && retryCount < maxRetries) {
        retryCount++
        console.log(`🔍 LOGIN DEBUG - Session verification failed, retry ${retryCount}/${maxRetries}...`)
        await new Promise(resolve => setTimeout(resolve, 300))
        sessionUser = await verifySession()
      }
      
      console.log('🔍 LOGIN DEBUG - Final session verification result:', {
        success: !!sessionUser,
        userId: sessionUser?.$id,
        email: sessionUser?.email,
        retriesUsed: retryCount
      })
      
      if (sessionUser) {
        console.log('🔍 LOGIN DEBUG - Session verified, fetching staff details...')
        
        // Fetch complete staff details from database
        try {
          const staff = await getCurrentStaff()
          console.log('🔍 LOGIN DEBUG - Staff details fetched:', {
            hasStaff: !!staff,
            staffId: staff?.$id,
            roles: staff?.roles,
            department: staff?.department
          })
        } catch (staffError) {
          console.warn('⚠️ LOGIN DEBUG - Could not fetch staff details:', staffError.message)
        }
        
        console.log('🔍 LOGIN DEBUG - Session verified, redirecting to:', callbackUrl)
        
        // Force a small delay before redirect to ensure middleware sees the session
        await new Promise(resolve => setTimeout(resolve, 100))
        router.push(callbackUrl)
      } else {
        console.log('🔍 LOGIN DEBUG - Session verification failed after all retries')
        throw new Error("Session verification failed - please try logging in again")
      }
    } catch (err) {
      console.error('🔍 LOGIN DEBUG - Login error:', {
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      })
      setError(err.message || "Login failed. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="w-full max-w-md">
        {/* RETC Branding - Logo centered and circular */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden shadow-lg">
            <img
              src="https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a&mode=admin"
              alt="RETC Logo"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="your.email@retc.org"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button variant="link" className="text-sm text-gray-600">
                Forgot your password?
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">Need access? Contact your system administrator.</div>
      </div>
    </div>
  )
}