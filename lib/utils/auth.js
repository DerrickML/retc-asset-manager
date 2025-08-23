import { account } from "../appwrite/client.js"
import { staffService } from "../appwrite/provider.js"
import { ENUMS } from "../appwrite/config.js"

// Session storage keys
const SESSION_KEYS = {
  USER: 'auth_user',
  STAFF: 'auth_staff',
  LAST_ACTIVITY: 'auth_last_activity',
  SESSION_EXPIRY: 'auth_session_expiry'
}

// Session timeout (30 minutes of inactivity)
const SESSION_TIMEOUT = 30 * 60 * 1000
const SESSION_REFRESH_THRESHOLD = 5 * 60 * 1000 // Refresh 5 minutes before expiry

// Get current user session with caching
export async function getCurrentUser() {
  try {
    // Check cached user first
    const cachedUser = getCachedUser()
    if (cachedUser && !isSessionExpired()) {
      updateLastActivity()
      return cachedUser
    }

    // Fetch fresh user data
    const user = await account.get()
    if (user) {
      cacheUser(user)
      updateLastActivity()
    }
    
    return user
  } catch (error) {
    clearAuthCache()
    return null
  }
}

// Get current staff member with roles
export async function getCurrentStaff() {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    // Check cached staff first
    const cachedStaff = getCachedStaff()
    if (cachedStaff && !isSessionExpired() && cachedStaff.userId === user.$id) {
      return cachedStaff
    }

    // Fetch fresh staff data
    const staff = await staffService.getByUserId(user.$id)
    if (staff) {
      cacheStaff(staff)
    }
    
    return staff
  } catch (error) {
    clearAuthCache()
    return null
  }
}

// Check if user has specific role
export function hasRole(staff, role) {
  if (!staff || !staff.roles) return false
  return staff.roles.includes(role)
}

// Check if user has any of the specified roles
export function hasAnyRole(staff, roles) {
  if (!staff || !staff.roles) return false
  return roles.some((role) => staff.roles.includes(role))
}

// Role-based permission checks
export const permissions = {
  isAdmin: (staff) => hasAnyRole(staff, [ENUMS.ROLES.SYSTEM_ADMIN, ENUMS.ROLES.ASSET_ADMIN]),
  isSystemAdmin: (staff) => hasRole(staff, ENUMS.ROLES.SYSTEM_ADMIN),
  canManageAssets: (staff) => hasAnyRole(staff, [ENUMS.ROLES.SYSTEM_ADMIN, ENUMS.ROLES.ASSET_ADMIN]),
  canApproveRequests: (staff) =>
    hasAnyRole(staff, [ENUMS.ROLES.SYSTEM_ADMIN, ENUMS.ROLES.ASSET_ADMIN, ENUMS.ROLES.SENIOR_MANAGER]),
  canIssueAssets: (staff) => hasAnyRole(staff, [ENUMS.ROLES.SYSTEM_ADMIN, ENUMS.ROLES.ASSET_ADMIN]),
  canManageUsers: (staff) => hasRole(staff, ENUMS.ROLES.SYSTEM_ADMIN),
  canManageSettings: (staff) => hasRole(staff, ENUMS.ROLES.SYSTEM_ADMIN),
  canViewReports: (staff) =>
    hasAnyRole(staff, [ENUMS.ROLES.SYSTEM_ADMIN, ENUMS.ROLES.ASSET_ADMIN, ENUMS.ROLES.SENIOR_MANAGER]),
  canCreateRequests: (staff) => !!staff, // Any authenticated user
}

// Login function with callback support and enhanced verification
export async function login(email, password, callback = null) {
  console.log('🔍 AUTH DEBUG - Login function started:', {
    email,
    callback,
    timestamp: new Date().toISOString()
  })

  try {
    console.log('🔍 AUTH DEBUG - Creating Appwrite session...')
    const session = await account.createEmailPasswordSession(email, password)
    console.log('🔍 AUTH DEBUG - Appwrite session created:', {
      sessionId: session.$id,
      userId: session.userId,
      providerUid: session.providerUid,
      expire: session.expire,
      current: session.current
    })
    
    if (session) {
      // Initialize session data
      console.log('🔍 AUTH DEBUG - Getting user account data...')
      const user = await account.get()
      console.log('🔍 AUTH DEBUG - User account data received:', {
        userId: user.$id,
        email: user.email,
        name: user.name,
        status: user.status,
        registration: user.registration,
        emailVerification: user.emailVerification
      })

      if (user) {
        console.log('🔍 AUTH DEBUG - Caching user data and setting session...')
        cacheUser(user)
        updateLastActivity()
        setSessionExpiry()
        
        // Manually set session cookie since Appwrite is using localStorage
        if (typeof window !== 'undefined' && session) {
          const projectId = '68926e9b000ac167ec8a'
          const cookieName = `a_session_${projectId}`
          const cookieValue = session.$id
          
          // Set the session cookie manually
          document.cookie = `${cookieName}=${cookieValue}; path=/; max-age=31536000; samesite=lax`
          
          console.log('🔍 AUTH DEBUG - Manually set session cookie:', {
            cookieName,
            cookieValue: cookieValue.substring(0, 10) + '...',
            sessionId: session.$id
          })
        }
        
        // Check browser cookies immediately after session creation
        if (typeof window !== 'undefined') {
          console.log('🔍 AUTH DEBUG - Browser cookies after session creation:', document.cookie)
          console.log('🔍 AUTH DEBUG - Looking for project-specific cookies:', {
            projectId: '68926e9b000ac167ec8a',
            expectedCookiePattern: 'a_session_68926e9b000ac167ec8a'
          })
        }
        
        // Additional wait to ensure session cookies are set properly
        console.log('🔍 AUTH DEBUG - Waiting 100ms for cookie propagation...')
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Check cookies again after wait
        if (typeof window !== 'undefined') {
          console.log('🔍 AUTH DEBUG - Browser cookies after wait:', document.cookie)
        }
        
        console.log('🔍 AUTH DEBUG - Login completed successfully')
        return { session, user, callback }
      }
    }
    
    console.error('🔍 AUTH DEBUG - Login failed - session or user data missing')
    throw new Error("Login failed - could not establish session")
  } catch (error) {
    console.error('🔍 AUTH DEBUG - Login error:', {
      error: error.message,
      code: error.code,
      type: error.type,
      stack: error.stack
    })
    clearAuthCache()
    throw error
  }
}

// Logout function with cleanup
export async function logout() {
  try {
    // Clear local cache first
    clearAuthCache()
    
    // Clear manually set session cookie
    if (typeof window !== 'undefined') {
      const projectId = '68926e9b000ac167ec8a'
      const cookieName = `a_session_${projectId}`
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      console.log('🔍 AUTH DEBUG - Cleared session cookie during logout')
    }
    
    // Delete Appwrite session
    await account.deleteSession("current")
    
    return true
  } catch (error) {
    // Even if Appwrite logout fails, clear local data
    clearAuthCache()
    
    // Still clear the cookie on error
    if (typeof window !== 'undefined') {
      const projectId = '68926e9b000ac167ec8a'
      const cookieName = `a_session_${projectId}`
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }
    
    throw error
  }
}

// Register function (for setup wizard)
export async function register(email, password, name) {
  try {
    return await account.create("unique()", email, password, name)
  } catch (error) {
    throw error
  }
}

// ================================
// Session Management Functions
// ================================

// Check if running in browser
function isBrowser() {
  return typeof window !== 'undefined'
}

// Cache user data
function cacheUser(user) {
  if (!isBrowser()) return
  
  try {
    localStorage.setItem(SESSION_KEYS.USER, JSON.stringify(user))
    setSessionExpiry()
  } catch (error) {
    console.warn('Failed to cache user:', error)
  }
}

// Get cached user
function getCachedUser() {
  if (!isBrowser()) return null
  
  try {
    const cached = localStorage.getItem(SESSION_KEYS.USER)
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    console.warn('Failed to get cached user:', error)
    return null
  }
}

// Cache staff data
function cacheStaff(staff) {
  if (!isBrowser()) return
  
  try {
    localStorage.setItem(SESSION_KEYS.STAFF, JSON.stringify(staff))
  } catch (error) {
    console.warn('Failed to cache staff:', error)
  }
}

// Get cached staff
function getCachedStaff() {
  if (!isBrowser()) return null
  
  try {
    const cached = localStorage.getItem(SESSION_KEYS.STAFF)
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    console.warn('Failed to get cached staff:', error)
    return null
  }
}

// Update last activity timestamp
function updateLastActivity() {
  if (!isBrowser()) return
  
  try {
    localStorage.setItem(SESSION_KEYS.LAST_ACTIVITY, Date.now().toString())
  } catch (error) {
    console.warn('Failed to update last activity:', error)
  }
}

// Set session expiry
function setSessionExpiry() {
  if (!isBrowser()) return
  
  try {
    const expiry = Date.now() + SESSION_TIMEOUT
    localStorage.setItem(SESSION_KEYS.SESSION_EXPIRY, expiry.toString())
  } catch (error) {
    console.warn('Failed to set session expiry:', error)
  }
}

// Check if session is expired
function isSessionExpired() {
  if (!isBrowser()) return false
  
  try {
    const lastActivity = localStorage.getItem(SESSION_KEYS.LAST_ACTIVITY)
    const sessionExpiry = localStorage.getItem(SESSION_KEYS.SESSION_EXPIRY)
    
    if (!lastActivity || !sessionExpiry) return true
    
    const now = Date.now()
    const lastActivityTime = parseInt(lastActivity)
    const expiryTime = parseInt(sessionExpiry)
    
    // Check if session has expired due to inactivity
    const inactivityExpired = now - lastActivityTime > SESSION_TIMEOUT
    
    // Check if absolute session has expired
    const absoluteExpired = now > expiryTime
    
    return inactivityExpired || absoluteExpired
  } catch (error) {
    console.warn('Failed to check session expiry:', error)
    return true
  }
}

// Verify current session is valid
export async function verifySession() {
  console.log('🔍 AUTH DEBUG - Verifying session started:', {
    timestamp: new Date().toISOString()
  })

  // Check browser cookies first
  if (typeof window !== 'undefined') {
    console.log('🔍 AUTH DEBUG - Current browser cookies during verification:', document.cookie)
  }

  try {
    console.log('🔍 AUTH DEBUG - Calling account.get() to verify session...')
    const user = await account.get()
    console.log('🔍 AUTH DEBUG - Account.get() successful:', {
      userId: user.$id,
      email: user.email,
      name: user.name,
      status: user.status,
      emailVerification: user.emailVerification
    })

    if (user) {
      console.log('🔍 AUTH DEBUG - Session verified, updating cache and activity')
      cacheUser(user)
      updateLastActivity()
      return user
    }

    console.log('🔍 AUTH DEBUG - No user data returned from account.get()')
    return null
  } catch (error) {
    console.error('🔍 AUTH DEBUG - Session verification failed:', {
      error: error.message,
      code: error.code,
      type: error.type,
      stack: error.stack
    })
    clearAuthCache()
    return null
  }
}

// Clear all authentication cache
export function clearAuthCache() {
  if (!isBrowser()) return
  
  try {
    Object.values(SESSION_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  } catch (error) {
    console.warn('Failed to clear auth cache:', error)
  }
}

// Check if session needs refresh
export function shouldRefreshSession() {
  if (!isBrowser()) return false
  
  try {
    const sessionExpiry = localStorage.getItem(SESSION_KEYS.SESSION_EXPIRY)
    if (!sessionExpiry) return false
    
    const now = Date.now()
    const expiryTime = parseInt(sessionExpiry)
    
    // Refresh if within threshold of expiry
    return (expiryTime - now) < SESSION_REFRESH_THRESHOLD
  } catch (error) {
    console.warn('Failed to check session refresh:', error)
    return false
  }
}

// Refresh session
export async function refreshSession() {
  try {
    // Get fresh session from Appwrite
    const session = await account.getSession('current')
    if (session) {
      setSessionExpiry()
      updateLastActivity()
      return true
    }
    return false
  } catch (error) {
    console.warn('Failed to refresh session:', error)
    clearAuthCache()
    return false
  }
}

// Initialize session monitoring
export function initSessionMonitoring() {
  if (!isBrowser()) return
  
  let activityTimer
  let refreshTimer
  
  // Track user activity
  const trackActivity = () => {
    updateLastActivity()
    
    // Clear existing timer
    if (activityTimer) {
      clearTimeout(activityTimer)
    }
    
    // Set new timer for session expiry warning
    activityTimer = setTimeout(() => {
      // Warn user of impending session expiry
      if (confirm('Your session will expire soon. Do you want to continue?')) {
        refreshSession()
      } else {
        logout()
      }
    }, SESSION_TIMEOUT - 60000) // Warn 1 minute before expiry
  }
  
  // Set up periodic session refresh
  const setupRefreshTimer = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
    }
    
    refreshTimer = setInterval(async () => {
      if (shouldRefreshSession()) {
        const refreshed = await refreshSession()
        if (!refreshed) {
          // Session refresh failed, redirect to login
          window.location.href = '/login'
        }
      }
    }, 60000) // Check every minute
  }
  
  // Add activity listeners
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
  events.forEach(event => {
    document.addEventListener(event, trackActivity, { passive: true })
  })
  
  // Setup timers
  setupRefreshTimer()
  
  // Return cleanup function
  return () => {
    events.forEach(event => {
      document.removeEventListener(event, trackActivity)
    })
    if (activityTimer) clearTimeout(activityTimer)
    if (refreshTimer) clearInterval(refreshTimer)
  }
}
