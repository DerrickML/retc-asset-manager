/**
 * Authentication Integration Tests
 * Tests the complete authentication flow including middleware, session management, and protected routes
 */

import { NextResponse } from 'next/server'
import { middleware } from '../../middleware'
import { 
  getCurrentUser, 
  getCurrentStaff, 
  verifySession, 
  clearAuthCache,
  refreshSession,
  shouldRefreshSession,
  initSessionMonitoring,
  login,
  logout
} from '../../lib/utils/auth'
import { account } from '../../lib/appwrite/client'
import { staffService } from '../../lib/appwrite/provider'

// Mock dependencies
jest.mock('../../lib/appwrite/client', () => ({
  account: {
    get: jest.fn(),
    createEmailPasswordSession: jest.fn(),
    deleteSession: jest.fn(),
    getSession: jest.fn(),
  },
}))

jest.mock('../../lib/appwrite/provider', () => ({
  staffService: {
    getByUserId: jest.fn(),
  },
}))

jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn(() => ({
      headers: {
        set: jest.fn(),
      },
    })),
    redirect: jest.fn((url) => ({ 
      type: 'redirect', 
      url: url.toString(),
      headers: {
        set: jest.fn(),
      },
    })),
  },
}))

// Test data
const TEST_USER = {
  $id: 'test-user-id',
  email: 'derrickmal123@gmail.com',
  name: 'Derrick Mal',
  emailVerification: true,
}

const TEST_STAFF = {
  $id: 'test-staff-id',
  userId: TEST_USER.$id,
  name: 'Derrick Mal',
  email: 'derrickmal123@gmail.com',
  roles: ['ASSET_ADMIN'],
  departmentId: 'dept-001',
  active: true,
}

const TEST_SESSION = {
  $id: 'test-session-id',
  userId: TEST_USER.$id,
  expire: new Date(Date.now() + 3600000).toISOString(),
  current: true,
}

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
    // Reset fetch mock
    global.fetch = jest.fn()
  })

  describe('1. Middleware Protection', () => {
    test('should redirect unauthenticated users from protected routes to login', async () => {
      const request = {
        nextUrl: {
          pathname: '/dashboard',
          search: '',
        },
        url: 'http://localhost:3000/dashboard',
        cookies: {
          get: jest.fn().mockReturnValue(null), // No session cookie
        },
      }

      const response = await middleware(request)

      expect(response.type).toBe('redirect')
      expect(response.url).toContain('/login')
      expect(response.url).toContain('callback=%2Fdashboard')
    })

    test('should allow authenticated users to access protected routes', async () => {
      const request = {
        nextUrl: {
          pathname: '/dashboard',
          search: '',
        },
        url: 'http://localhost:3000/dashboard',
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'valid-session' }),
        },
      }

      const response = await middleware(request)

      expect(NextResponse.next).toHaveBeenCalled()
      expect(response.headers.set).toHaveBeenCalledWith('X-Frame-Options', 'DENY')
    })

    test('should redirect authenticated users from login page to dashboard', async () => {
      const request = {
        nextUrl: {
          pathname: '/login',
          search: '',
        },
        url: 'http://localhost:3000/login',
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'valid-session' }),
        },
      }

      const response = await middleware(request)

      expect(response.type).toBe('redirect')
      expect(response.url).toContain('/dashboard')
    })

    test('should handle root path redirect based on authentication', async () => {
      // Test unauthenticated
      const unauthRequest = {
        nextUrl: {
          pathname: '/',
          search: '',
        },
        url: 'http://localhost:3000/',
        cookies: {
          get: jest.fn().mockReturnValue(null),
        },
      }

      const unauthResponse = await middleware(unauthRequest)
      expect(unauthResponse.type).toBe('redirect')
      expect(unauthResponse.url).toContain('/login')

      // Test authenticated
      const authRequest = {
        nextUrl: {
          pathname: '/',
          search: '',
        },
        url: 'http://localhost:3000/',
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'valid-session' }),
        },
      }

      const authResponse = await middleware(authRequest)
      expect(authResponse.type).toBe('redirect')
      expect(authResponse.url).toContain('/dashboard')
    })

    test('should preserve callback URL with query parameters', async () => {
      const request = {
        nextUrl: {
          pathname: '/assets',
          search: '?category=IT_EQUIPMENT&status=AVAILABLE',
        },
        url: 'http://localhost:3000/assets?category=IT_EQUIPMENT&status=AVAILABLE',
        cookies: {
          get: jest.fn().mockReturnValue(null),
        },
      }

      const response = await middleware(request)

      expect(response.type).toBe('redirect')
      expect(response.url).toContain('/login')
      expect(response.url).toContain('callback=%2Fassets%3Fcategory%3DIT_EQUIPMENT%26status%3DAVAILABLE')
    })

    test('should allow access to public routes without authentication', async () => {
      const publicRoutes = ['/guest', '/guest/assets', '/api/guest/assets']

      for (const route of publicRoutes) {
        const request = {
          nextUrl: {
            pathname: route,
            search: '',
          },
          url: `http://localhost:3000${route}`,
          cookies: {
            get: jest.fn().mockReturnValue(null),
          },
        }

        const response = await middleware(request)
        expect(NextResponse.next).toHaveBeenCalled()
      }
    })

    test('should check multiple session cookie names for compatibility', async () => {
      const cookieNames = ['a_session_console_legacy', 'a_session_console', 'a_session']
      
      for (const cookieName of cookieNames) {
        const request = {
          nextUrl: {
            pathname: '/dashboard',
            search: '',
          },
          url: 'http://localhost:3000/dashboard',
          cookies: {
            get: jest.fn((name) => {
              if (name === cookieName) {
                return { value: 'valid-session' }
              }
              return null
            }),
          },
        }

        const response = await middleware(request)
        expect(NextResponse.next).toHaveBeenCalled()
      }
    })
  })

  describe('2. Session Management', () => {
    test('should establish and verify session after successful login', async () => {
      account.createEmailPasswordSession.mockResolvedValue(TEST_SESSION)
      account.get.mockResolvedValue(TEST_USER)

      const result = await login('derrickmal123@gmail.com', 'derrickloma', '/dashboard')

      expect(account.createEmailPasswordSession).toHaveBeenCalledWith(
        'derrickmal123@gmail.com',
        'derrickloma'
      )
      expect(account.get).toHaveBeenCalled()
      expect(result).toMatchObject({
        session: TEST_SESSION,
        user: TEST_USER,
        callback: '/dashboard',
      })
    })

    test('should cache user data after successful login', async () => {
      // Mock browser environment
      const originalWindow = global.window
      global.window = { localStorage: new Map() }
      global.window.localStorage.setItem = jest.fn((key, value) => {
        global.window.localStorage.set(key, value)
      })
      global.window.localStorage.getItem = jest.fn((key) => {
        return global.window.localStorage.get(key)
      })

      account.createEmailPasswordSession.mockResolvedValue(TEST_SESSION)
      account.get.mockResolvedValue(TEST_USER)

      await login('derrickmal123@gmail.com', 'derrickloma')

      expect(global.window.localStorage.setItem).toHaveBeenCalledWith(
        'auth_user',
        JSON.stringify(TEST_USER)
      )
      expect(global.window.localStorage.setItem).toHaveBeenCalledWith(
        'auth_last_activity',
        expect.any(String)
      )
      expect(global.window.localStorage.setItem).toHaveBeenCalledWith(
        'auth_session_expiry',
        expect.any(String)
      )

      global.window = originalWindow
    })

    test('should verify session is valid', async () => {
      account.get.mockResolvedValue(TEST_USER)

      const user = await verifySession()

      expect(account.get).toHaveBeenCalled()
      expect(user).toEqual(TEST_USER)
    })

    test('should return null for invalid session', async () => {
      account.get.mockRejectedValue(new Error('Session expired'))

      const user = await verifySession()

      expect(user).toBeNull()
    })

    test('should handle session refresh correctly', async () => {
      // Mock browser environment
      const originalWindow = global.window
      global.window = { localStorage: new Map() }
      
      // Set up localStorage mock with near-expiry session
      const nearExpiryTime = Date.now() + 4 * 60 * 1000 // 4 minutes from now
      global.window.localStorage.getItem = jest.fn((key) => {
        if (key === 'auth_session_expiry') {
          return nearExpiryTime.toString()
        }
        return null
      })
      global.window.localStorage.setItem = jest.fn()

      account.getSession.mockResolvedValue(TEST_SESSION)

      const shouldRefresh = shouldRefreshSession()
      expect(shouldRefresh).toBe(true)

      const refreshed = await refreshSession()
      expect(refreshed).toBe(true)
      expect(account.getSession).toHaveBeenCalledWith('current')

      global.window = originalWindow
    })

    test('should clear all auth cache on logout', async () => {
      // Mock browser environment
      const originalWindow = global.window
      global.window = { localStorage: new Map() }
      const mockRemoveItem = jest.fn()
      global.window.localStorage.removeItem = mockRemoveItem

      account.deleteSession.mockResolvedValue()

      await logout()

      expect(account.deleteSession).toHaveBeenCalledWith('current')
      expect(mockRemoveItem).toHaveBeenCalledWith('auth_user')
      expect(mockRemoveItem).toHaveBeenCalledWith('auth_staff')
      expect(mockRemoveItem).toHaveBeenCalledWith('auth_last_activity')
      expect(mockRemoveItem).toHaveBeenCalledWith('auth_session_expiry')

      global.window = originalWindow
    })
  })

  describe('3. User and Staff Data Retrieval', () => {
    test('should get current user from cache when available', async () => {
      // Mock browser environment with cached data
      const originalWindow = global.window
      global.window = { localStorage: new Map() }
      global.window.localStorage.getItem = jest.fn((key) => {
        if (key === 'auth_user') {
          return JSON.stringify(TEST_USER)
        }
        if (key === 'auth_last_activity') {
          return Date.now().toString()
        }
        if (key === 'auth_session_expiry') {
          return (Date.now() + 30 * 60 * 1000).toString()
        }
        return null
      })
      global.window.localStorage.setItem = jest.fn()

      const user = await getCurrentUser()

      expect(user).toEqual(TEST_USER)
      expect(account.get).not.toHaveBeenCalled() // Should use cache

      global.window = originalWindow
    })

    test('should fetch fresh user data when cache is expired', async () => {
      // Mock browser environment with expired cache
      const originalWindow = global.window
      global.window = { localStorage: new Map() }
      global.window.localStorage.getItem = jest.fn((key) => {
        if (key === 'auth_last_activity') {
          return (Date.now() - 31 * 60 * 1000).toString() // 31 minutes ago
        }
        return null
      })
      global.window.localStorage.setItem = jest.fn()

      account.get.mockResolvedValue(TEST_USER)

      const user = await getCurrentUser()

      expect(account.get).toHaveBeenCalled()
      expect(user).toEqual(TEST_USER)

      global.window = originalWindow
    })

    test('should get current staff with roles', async () => {
      account.get.mockResolvedValue(TEST_USER)
      staffService.getByUserId.mockResolvedValue(TEST_STAFF)

      const staff = await getCurrentStaff()

      expect(staffService.getByUserId).toHaveBeenCalledWith(TEST_USER.$id)
      expect(staff).toEqual(TEST_STAFF)
    })

    test('should return null when no staff record exists', async () => {
      account.get.mockResolvedValue(TEST_USER)
      staffService.getByUserId.mockResolvedValue(null)

      const staff = await getCurrentStaff()

      expect(staff).toBeNull()
    })
  })

  describe('4. Race Condition Prevention', () => {
    test('should prevent multiple simultaneous login attempts', async () => {
      let loginInProgress = false
      account.createEmailPasswordSession.mockImplementation(async () => {
        if (loginInProgress) {
          throw new Error('Login already in progress')
        }
        loginInProgress = true
        await new Promise(resolve => setTimeout(resolve, 100))
        loginInProgress = false
        return TEST_SESSION
      })
      account.get.mockResolvedValue(TEST_USER)

      // Attempt multiple logins simultaneously
      const promises = [
        login('derrickmal123@gmail.com', 'derrickloma'),
        login('derrickmal123@gmail.com', 'derrickloma'),
        login('derrickmal123@gmail.com', 'derrickloma'),
      ]

      const results = await Promise.allSettled(promises)
      
      const successful = results.filter(r => r.status === 'fulfilled')
      const failed = results.filter(r => r.status === 'rejected')

      expect(successful.length).toBe(1)
      expect(failed.length).toBe(2)
    })

    test('should handle session verification with proper timing delays', async () => {
      account.createEmailPasswordSession.mockResolvedValue(TEST_SESSION)
      account.get.mockResolvedValue(TEST_USER)

      const startTime = Date.now()
      await login('derrickmal123@gmail.com', 'derrickloma')
      const endTime = Date.now()

      // Should include a 100ms delay as per implementation
      expect(endTime - startTime).toBeGreaterThanOrEqual(100)
    })

    test('should prevent session verification before cookies are set', async () => {
      let cookiesSet = false
      
      account.createEmailPasswordSession.mockImplementation(async () => {
        // Simulate async cookie setting
        setTimeout(() => { cookiesSet = true }, 50)
        return TEST_SESSION
      })
      
      account.get.mockImplementation(async () => {
        if (!cookiesSet) {
          throw new Error('No session')
        }
        return TEST_USER
      })

      const result = await login('derrickmal123@gmail.com', 'derrickloma')

      // The 100ms delay in login should ensure cookies are set
      expect(result.user).toEqual(TEST_USER)
    })
  })

  describe('5. Session Monitoring', () => {
    test('should initialize session monitoring with activity tracking', () => {
      const originalDocument = global.document
      const mockAddEventListener = jest.fn()
      const mockRemoveEventListener = jest.fn()
      
      global.document = {
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      }
      global.window = {}

      const cleanup = initSessionMonitoring()

      // Should add event listeners for activity tracking
      const expectedEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
      expectedEvents.forEach(event => {
        expect(mockAddEventListener).toHaveBeenCalledWith(
          event,
          expect.any(Function),
          { passive: true }
        )
      })

      // Test cleanup
      cleanup()
      expectedEvents.forEach(event => {
        expect(mockRemoveEventListener).toHaveBeenCalledWith(
          event,
          expect.any(Function)
        )
      })

      global.document = originalDocument
      delete global.window
    })

    test('should track last activity on user interaction', () => {
      const originalWindow = global.window
      const originalDocument = global.document
      
      global.window = { localStorage: new Map() }
      const mockSetItem = jest.fn()
      global.window.localStorage.setItem = mockSetItem
      
      const listeners = {}
      global.document = {
        addEventListener: (event, handler) => {
          listeners[event] = handler
        },
        removeEventListener: jest.fn(),
      }

      initSessionMonitoring()

      // Simulate user activity
      if (listeners['mousedown']) {
        listeners['mousedown']()
      }

      expect(mockSetItem).toHaveBeenCalledWith(
        'auth_last_activity',
        expect.any(String)
      )

      global.window = originalWindow
      global.document = originalDocument
    })
  })

  describe('6. Error Recovery', () => {
    test('should recover from network errors during session verification', async () => {
      // First call fails, second succeeds
      account.get
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(TEST_USER)

      const firstAttempt = await verifySession()
      expect(firstAttempt).toBeNull()

      const secondAttempt = await verifySession()
      expect(secondAttempt).toEqual(TEST_USER)
    })

    test('should handle corrupted localStorage data gracefully', async () => {
      const originalWindow = global.window
      global.window = { localStorage: new Map() }
      global.window.localStorage.getItem = jest.fn((key) => {
        if (key === 'auth_user') {
          return 'corrupted-json-{invalid'
        }
        return null
      })

      account.get.mockResolvedValue(TEST_USER)

      const user = await getCurrentUser()

      // Should fall back to fetching fresh data
      expect(account.get).toHaveBeenCalled()
      expect(user).toEqual(TEST_USER)

      global.window = originalWindow
    })

    test('should continue working even if localStorage is unavailable', async () => {
      const originalWindow = global.window
      global.window = {
        localStorage: {
          setItem: () => { throw new Error('Storage quota exceeded') },
          getItem: () => { throw new Error('Storage unavailable') },
          removeItem: () => { throw new Error('Storage unavailable') },
        }
      }

      account.createEmailPasswordSession.mockResolvedValue(TEST_SESSION)
      account.get.mockResolvedValue(TEST_USER)

      // Should not throw even with localStorage errors
      const result = await login('derrickmal123@gmail.com', 'derrickloma')
      expect(result.user).toEqual(TEST_USER)

      const user = await getCurrentUser()
      expect(user).toEqual(TEST_USER)

      global.window = originalWindow
    })
  })
})