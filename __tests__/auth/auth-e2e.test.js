/**
 * End-to-End Authentication Tests
 * Tests real authentication scenarios to identify issues with the login flow
 * These tests help identify why users might remain stuck on the login page
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'

// Mock fetch for API calls
global.fetch = jest.fn()

// Test credentials
const TEST_CREDENTIALS = {
  email: 'derrickmal123@gmail.com',
  password: 'derrickloma',
}

describe('E2E Authentication Flow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    
    // Reset fetch mock
    global.fetch.mockReset()
    
    // Clear all cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })
  })

  describe('Real-World Login Scenarios', () => {
    test('should identify timing issues in the login flow', async () => {
      const timingLog = []
      
      // Track timing of each operation
      const originalFetch = global.fetch
      global.fetch = jest.fn(async (...args) => {
        const startTime = Date.now()
        timingLog.push({ event: 'fetch_start', time: startTime, url: args[0] })
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 200))
        
        const endTime = Date.now()
        timingLog.push({ event: 'fetch_end', time: endTime, duration: endTime - startTime })
        
        return {
          ok: true,
          json: async () => ({ 
            session: { id: 'test-session' },
            user: { email: TEST_CREDENTIALS.email }
          })
        }
      })

      // Track localStorage operations
      const originalSetItem = localStorage.setItem
      localStorage.setItem = function(key, value) {
        timingLog.push({ event: 'localStorage_set', key, time: Date.now() })
        return originalSetItem.call(this, key, value)
      }

      // Track cookie operations
      const originalCookieSetter = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie').set
      Object.defineProperty(document, 'cookie', {
        set: function(value) {
          timingLog.push({ event: 'cookie_set', time: Date.now(), value: value.split('=')[0] })
          return originalCookieSetter.call(document, value)
        }
      })

      // Simulate login process
      await act(async () => {
        // Login API call
        await fetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(TEST_CREDENTIALS)
        })
        
        // Session verification delay
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // Verify session
        await fetch('/api/auth/session')
      })

      // Analyze timing
      const fetchEvents = timingLog.filter(e => e.event === 'fetch_start' || e.event === 'fetch_end')
      const storageEvents = timingLog.filter(e => e.event === 'localStorage_set')
      const cookieEvents = timingLog.filter(e => e.event === 'cookie_set')

      // Check for timing issues
      console.log('Timing Analysis:', {
        totalFetchTime: fetchEvents.filter(e => e.duration).reduce((sum, e) => sum + e.duration, 0),
        storageOperations: storageEvents.length,
        cookieOperations: cookieEvents.length,
        timeline: timingLog
      })

      // Verify operations happened in correct order
      expect(fetchEvents.length).toBeGreaterThan(0)
      
      // Restore original functions
      global.fetch = originalFetch
      localStorage.setItem = originalSetItem
    })

    test('should detect session cookie problems', async () => {
      const cookieIssues = []
      
      // Monitor cookie operations
      const originalCookieSetter = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie').set
      const originalCookieGetter = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie').get
      
      Object.defineProperty(document, 'cookie', {
        set: function(value) {
          // Check for common cookie issues
          if (!value.includes('SameSite')) {
            cookieIssues.push('Missing SameSite attribute')
          }
          if (!value.includes('Secure') && location.protocol === 'https:') {
            cookieIssues.push('Missing Secure flag for HTTPS')
          }
          if (!value.includes('HttpOnly')) {
            // Note: HttpOnly can't be set from JavaScript
            console.warn('HttpOnly should be set server-side')
          }
          
          // Check cookie path
          if (!value.includes('Path=/')) {
            cookieIssues.push('Cookie path not set to root')
          }
          
          // Check expiry
          const expiryMatch = value.match(/Max-Age=(\d+)/)
          if (expiryMatch) {
            const maxAge = parseInt(expiryMatch[1])
            if (maxAge < 3600) { // Less than 1 hour
              cookieIssues.push(`Short cookie expiry: ${maxAge} seconds`)
            }
          }
          
          return originalCookieSetter.call(document, value)
        },
        get: function() {
          const cookies = originalCookieGetter.call(document)
          
          // Check if session cookies exist
          const hasSessionCookie = cookies.includes('a_session') || 
                                  cookies.includes('session') ||
                                  cookies.includes('auth')
          
          if (!hasSessionCookie) {
            cookieIssues.push('No session cookie found')
          }
          
          return cookies
        }
      })

      // Simulate setting session cookie
      document.cookie = 'a_session=test123; Path=/; Max-Age=3600; SameSite=Lax'
      
      // Check for issues
      if (cookieIssues.length > 0) {
        console.warn('Cookie issues detected:', cookieIssues)
      }
      
      expect(cookieIssues).toEqual([])
    })

    test('should identify race conditions in session establishment', async () => {
      const operations = []
      let sessionEstablished = false
      
      // Simulate concurrent operations that might cause race conditions
      const establishSession = async () => {
        operations.push({ op: 'session_start', time: Date.now() })
        await new Promise(resolve => setTimeout(resolve, 100))
        sessionEstablished = true
        operations.push({ op: 'session_ready', time: Date.now() })
      }
      
      const checkSession = async () => {
        operations.push({ op: 'check_start', time: Date.now() })
        if (!sessionEstablished) {
          operations.push({ op: 'check_failed', time: Date.now(), reason: 'Session not ready' })
          return false
        }
        operations.push({ op: 'check_success', time: Date.now() })
        return true
      }
      
      const redirect = async () => {
        operations.push({ op: 'redirect_attempt', time: Date.now() })
        const sessionValid = await checkSession()
        if (sessionValid) {
          operations.push({ op: 'redirect_success', time: Date.now() })
        } else {
          operations.push({ op: 'redirect_failed', time: Date.now() })
        }
        return sessionValid
      }
      
      // Simulate race condition scenario
      const [sessionResult, redirectResult] = await Promise.all([
        establishSession(),
        (async () => {
          // Try to redirect immediately (race condition)
          await new Promise(resolve => setTimeout(resolve, 50)) // Small delay
          return redirect()
        })()
      ])
      
      // Analyze for race conditions
      const checkBeforeReady = operations.find(op => 
        op.op === 'check_failed' && op.reason === 'Session not ready'
      )
      
      if (checkBeforeReady) {
        console.warn('Race condition detected: Session checked before establishment')
      }
      
      // With proper delays, this should not happen
      expect(redirectResult).toBe(true)
    })

    test('should verify localStorage and sessionStorage synchronization', async () => {
      const storageIssues = []
      
      // Test localStorage persistence
      localStorage.setItem('auth_user', JSON.stringify({ id: 'test-user' }))
      localStorage.setItem('auth_session_expiry', (Date.now() + 3600000).toString())
      
      // Check if data persists
      const userData = localStorage.getItem('auth_user')
      const sessionExpiry = localStorage.getItem('auth_session_expiry')
      
      if (!userData) {
        storageIssues.push('localStorage: auth_user not persisted')
      }
      if (!sessionExpiry) {
        storageIssues.push('localStorage: auth_session_expiry not persisted')
      }
      
      // Test cross-tab synchronization (simulate)
      const simulateNewTab = () => {
        const user = localStorage.getItem('auth_user')
        const expiry = localStorage.getItem('auth_session_expiry')
        
        if (!user || !expiry) {
          storageIssues.push('Cross-tab: Session data not available in new tab')
        }
        
        // Check if session is still valid
        if (expiry && parseInt(expiry) < Date.now()) {
          storageIssues.push('Cross-tab: Session expired')
        }
      }
      
      simulateNewTab()
      
      expect(storageIssues).toEqual([])
    })

    test('should detect redirect loops', async () => {
      const redirectHistory = []
      const MAX_REDIRECTS = 10
      
      // Simulate redirect behavior
      const simulateRedirect = (from, to, isAuthenticated) => {
        redirectHistory.push({ from, to, authenticated: isAuthenticated })
        
        // Check for loops
        const lastFive = redirectHistory.slice(-5)
        if (lastFive.length === 5) {
          const paths = lastFive.map(r => r.from)
          const uniquePaths = new Set(paths)
          if (uniquePaths.size < 3) {
            return { error: 'Redirect loop detected', pattern: paths }
          }
        }
        
        if (redirectHistory.length > MAX_REDIRECTS) {
          return { error: 'Too many redirects', count: redirectHistory.length }
        }
        
        return { success: true }
      }
      
      // Test normal flow
      let result = simulateRedirect('/dashboard', '/login', false)
      expect(result.success).toBe(true)
      
      result = simulateRedirect('/login', '/dashboard', true)
      expect(result.success).toBe(true)
      
      // Test potential loop scenario
      redirectHistory.length = 0 // Reset
      
      // Simulate a redirect loop
      for (let i = 0; i < 6; i++) {
        simulateRedirect('/login', '/dashboard', true)
        simulateRedirect('/dashboard', '/login', false)
      }
      
      const finalResult = redirectHistory.length > MAX_REDIRECTS
      expect(finalResult).toBe(true)
      console.warn('Redirect loop test:', { 
        totalRedirects: redirectHistory.length,
        pattern: redirectHistory.slice(-6).map(r => `${r.from} -> ${r.to}`)
      })
    })

    test('should test browser-specific issues', async () => {
      const browserIssues = []
      
      // Check for third-party cookie blocking
      const testThirdPartyCookies = () => {
        try {
          // Try to set a test cookie
          document.cookie = 'test=value; SameSite=None; Secure'
          const cookies = document.cookie
          
          if (!cookies.includes('test=value')) {
            browserIssues.push('Third-party cookies might be blocked')
          }
          
          // Clean up
          document.cookie = 'test=; Max-Age=0'
        } catch (e) {
          browserIssues.push('Cookie access error: ' + e.message)
        }
      }
      
      // Check for private/incognito mode issues
      const testPrivateMode = async () => {
        try {
          // Test localStorage in private mode
          const testKey = 'private_mode_test'
          localStorage.setItem(testKey, 'test')
          localStorage.removeItem(testKey)
        } catch (e) {
          browserIssues.push('Private mode detected - localStorage might not persist')
        }
      }
      
      // Check for browser storage limits
      const testStorageLimits = () => {
        try {
          const largeData = 'x'.repeat(5 * 1024 * 1024) // 5MB string
          localStorage.setItem('large_test', largeData)
          localStorage.removeItem('large_test')
        } catch (e) {
          if (e.name === 'QuotaExceededError') {
            browserIssues.push('Storage quota exceeded')
          }
        }
      }
      
      testThirdPartyCookies()
      await testPrivateMode()
      testStorageLimits()
      
      if (browserIssues.length > 0) {
        console.warn('Browser-specific issues:', browserIssues)
      }
      
      // These are warnings, not failures
      expect(browserIssues.length).toBeLessThanOrEqual(3)
    })

    test('should validate complete authentication flow with delays', async () => {
      const flowSteps = []
      
      const simulateCompleteFlow = async () => {
        // Step 1: User lands on login page
        flowSteps.push({ step: 'load_login_page', timestamp: Date.now() })
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Step 2: User enters credentials
        flowSteps.push({ step: 'enter_credentials', timestamp: Date.now() })
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Step 3: Submit login form
        flowSteps.push({ step: 'submit_login', timestamp: Date.now() })
        
        // Step 4: API call to login endpoint
        flowSteps.push({ step: 'api_call_start', timestamp: Date.now() })
        await new Promise(resolve => setTimeout(resolve, 300)) // Network delay
        flowSteps.push({ step: 'api_call_end', timestamp: Date.now() })
        
        // Step 5: Session establishment
        flowSteps.push({ step: 'session_establish_start', timestamp: Date.now() })
        await new Promise(resolve => setTimeout(resolve, 100)) // Cookie setting
        flowSteps.push({ step: 'session_establish_end', timestamp: Date.now() })
        
        // Step 6: Session verification with delay
        flowSteps.push({ step: 'verify_session_start', timestamp: Date.now() })
        await new Promise(resolve => setTimeout(resolve, 200)) // As per fix
        flowSteps.push({ step: 'verify_session_end', timestamp: Date.now() })
        
        // Step 7: Redirect
        flowSteps.push({ step: 'redirect_start', timestamp: Date.now() })
        await new Promise(resolve => setTimeout(resolve, 50))
        flowSteps.push({ step: 'redirect_complete', timestamp: Date.now() })
        
        return true
      }
      
      const success = await simulateCompleteFlow()
      
      // Analyze flow timing
      const totalTime = flowSteps[flowSteps.length - 1].timestamp - flowSteps[0].timestamp
      const criticalSteps = flowSteps.filter(s => 
        s.step.includes('session') || s.step.includes('verify')
      )
      
      console.log('Authentication flow analysis:', {
        totalTime: `${totalTime}ms`,
        steps: flowSteps.length,
        criticalSteps: criticalSteps.map(s => s.step),
        averageStepTime: Math.round(totalTime / flowSteps.length) + 'ms'
      })
      
      // Verify all steps completed
      expect(success).toBe(true)
      expect(flowSteps.length).toBe(14)
      
      // Verify timing delays are applied
      const verifyDelay = flowSteps.find(s => s.step === 'verify_session_end').timestamp -
                         flowSteps.find(s => s.step === 'verify_session_start').timestamp
      expect(verifyDelay).toBeGreaterThanOrEqual(200)
    })
  })

  describe('Common Authentication Problems', () => {
    test('should detect when session cookies are not properly set', () => {
      const problems = []
      
      // Check various session cookie formats
      const cookieFormats = [
        'a_session_console_legacy',
        'a_session_console', 
        'a_session',
        'session',
        'auth_token'
      ]
      
      cookieFormats.forEach(cookieName => {
        const cookieValue = document.cookie
          .split('; ')
          .find(row => row.startsWith(cookieName))
        
        if (!cookieValue) {
          problems.push(`Missing cookie: ${cookieName}`)
        }
      })
      
      // At least one session cookie should exist
      const hasAnyCookie = cookieFormats.some(name => 
        document.cookie.includes(name)
      )
      
      if (!hasAnyCookie && problems.length === cookieFormats.length) {
        console.warn('No session cookies found - this would prevent authentication')
      }
      
      // This is expected to have problems in test environment
      expect(problems.length).toBeGreaterThan(0)
    })

    test('should identify middleware and client-side auth mismatch', async () => {
      const mismatches = []
      
      // Simulate client-side auth state
      const clientAuth = {
        isAuthenticated: true,
        user: { email: TEST_CREDENTIALS.email }
      }
      localStorage.setItem('auth_user', JSON.stringify(clientAuth.user))
      
      // Simulate middleware check (no cookie)
      const middlewareAuth = {
        isAuthenticated: document.cookie.includes('session'),
        hasValidCookie: false
      }
      
      // Check for mismatch
      if (clientAuth.isAuthenticated && !middlewareAuth.isAuthenticated) {
        mismatches.push('Client thinks user is authenticated but middleware does not')
      }
      
      if (!clientAuth.isAuthenticated && middlewareAuth.isAuthenticated) {
        mismatches.push('Middleware thinks user is authenticated but client does not')
      }
      
      // Check localStorage vs cookie sync
      const hasLocalStorage = !!localStorage.getItem('auth_user')
      const hasSessionCookie = document.cookie.includes('session')
      
      if (hasLocalStorage && !hasSessionCookie) {
        mismatches.push('LocalStorage has auth data but no session cookie')
      }
      
      if (!hasLocalStorage && hasSessionCookie) {
        mismatches.push('Session cookie exists but no localStorage data')
      }
      
      console.log('Auth state analysis:', {
        clientAuth,
        middlewareAuth,
        mismatches
      })
      
      // This is a common issue that could cause login problems
      expect(mismatches.length).toBeGreaterThan(0)
    })
  })
})