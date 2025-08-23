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
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 relative overflow-hidden animate-gradient">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 animate-pulse" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 py-24 animate-fade-in-up">
          <div className="max-w-lg">
            {/* Logo */}
            <div className="mb-12 animate-bounce-subtle">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-2xl border border-white/30 hover:shadow-3xl hover:scale-105 transition-all duration-300">
                <img
                  src="https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a&mode=admin"
                  alt="RETC Logo"
                  className="w-12 h-12 object-cover rounded-xl"
                />
              </div>
            </div>

            {/* Hero Text */}
            <div className="space-y-6 text-white">
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                Welcome to
                <span className="block text-blue-200 animate-glow">Asset Manager</span>
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                Streamline your asset management with our comprehensive platform designed for the Renewable Energy Training Center.
              </p>
              <div className="flex items-center space-x-4 pt-8 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                <div className="w-12 h-12 rounded-full bg-green-400 flex items-center justify-center hover:bg-green-300 transition-colors duration-300 hover:scale-110 transform">
                  <svg className="w-6 h-6 text-green-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-blue-100 hover:text-white transition-colors duration-300">Secure & Reliable Asset Tracking</span>
              </div>
              <div className="flex items-center space-x-4 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                <div className="w-12 h-12 rounded-full bg-orange-400 flex items-center justify-center hover:bg-orange-300 transition-colors duration-300 hover:scale-110 transform">
                  <svg className="w-6 h-6 text-orange-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-blue-100 hover:text-white transition-colors duration-300">Comprehensive Request Management</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements with Animations */}
        <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-white/5 blur-3xl animate-float"></div>
        <div className="absolute bottom-40 right-12 w-24 h-24 rounded-full bg-blue-400/20 blur-2xl animate-float-reverse"></div>
        <div className="absolute top-1/2 right-0 w-48 h-48 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-3xl animate-pulse-slow"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-gray-50 animate-fade-in">
        <div className="w-full max-w-md space-y-8 animate-slide-in-right">
          {/* Mobile Logo */}
          <div className="flex flex-col items-center lg:hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center overflow-hidden shadow-xl border-4 border-white hover:shadow-2xl hover:scale-105 transition-all duration-300 animate-bounce-subtle">
              <img
                src="https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a&mode=admin"
                alt="RETC Logo"
                className="w-10 h-10 object-cover rounded-lg"
              />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>Asset Manager</h2>
            <p className="text-gray-600 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>RETC Management System</p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden hover:shadow-3xl transition-shadow duration-300 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="px-8 py-10 lg:px-10 lg:py-12">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
                <p className="text-gray-600">Welcome back! Please enter your credentials to access your account.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="your.email@retc.org"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-2 border-gray-300 rounded transition-all duration-200"
                    />
                    <label htmlFor="remember-me" className="ml-3 text-sm font-medium text-gray-700">
                      Remember me
                    </label>
                  </div>

                  <button
                    type="button"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors duration-200"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading && (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Need access?{' '}
              <span className="font-semibold text-blue-600">Contact your system administrator</span>
            </p>
            <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
              <span>© 2024 RETC</span>
              <span>•</span>
              <span>Asset Management System</span>
              <span>•</span>
              <span>Secure Login</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}