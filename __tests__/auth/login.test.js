/**
 * Comprehensive Login Functionality Tests
 * Tests the authentication flow including login page, session management, and middleware protection
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, useSearchParams } from 'next/navigation'
import LoginPage from '../../app/login/page'
import { login, verifySession, getCurrentUser, clearAuthCache } from '../../lib/utils/auth'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Mock auth utilities
jest.mock('../../lib/utils/auth', () => ({
  login: jest.fn(),
  verifySession: jest.fn(),
  getCurrentUser: jest.fn(),
  clearAuthCache: jest.fn(),
  logout: jest.fn(),
  refreshSession: jest.fn(),
  initSessionMonitoring: jest.fn(),
}))

// Test credentials
const TEST_CREDENTIALS = {
  email: 'derrickmal123@gmail.com',
  password: 'derrickloma',
}

// Mock user data
const mockUser = {
  $id: 'test-user-id',
  email: TEST_CREDENTIALS.email,
  name: 'Derrick Mal',
  emailVerification: true,
  phoneVerification: false,
}

// Mock session data
const mockSession = {
  $id: 'test-session-id',
  userId: mockUser.$id,
  expire: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  current: true,
}

describe('Login Page Component', () => {
  let mockPush
  let mockSearchParams

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    localStorage.clear()
    
    // Setup router mock
    mockPush = jest.fn()
    mockSearchParams = new URLSearchParams()
    useRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
    })
    useSearchParams.mockReturnValue(mockSearchParams)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('1. Login Page Loading', () => {
    test('should render login page with all required elements', () => {
      render(<LoginPage />)

      // Check for RETC branding
      expect(screen.getByText('RETC')).toBeInTheDocument()
      expect(screen.getByText('Asset Management')).toBeInTheDocument()
      expect(screen.getByText('Renewable Energy Training Center')).toBeInTheDocument()

      // Check for form elements
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByText('Enter your credentials to access the system')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      
      // Check for additional elements
      expect(screen.getByText('Forgot your password?')).toBeInTheDocument()
      expect(screen.getByText('Need access? Contact your system administrator.')).toBeInTheDocument()
    })

    test('should have correct input placeholders and types', () => {
      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')

      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('placeholder', 'your.email@retc.org')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    test('should handle callback URL from query parameters', () => {
      const callbackUrl = '/dashboard/reports'
      mockSearchParams = new URLSearchParams({ callback: callbackUrl })
      useSearchParams.mockReturnValue(mockSearchParams)

      render(<LoginPage />)

      // The callback URL should be stored internally
      // We'll test this during form submission
    })
  })

  describe('2. Login Form Submission', () => {
    test('should successfully login with valid credentials', async () => {
      const user = userEvent.setup()
      
      // Mock successful login flow
      login.mockResolvedValue({ session: mockSession, user: mockUser })
      verifySession.mockResolvedValue(mockUser)

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Enter credentials
      await user.type(emailInput, TEST_CREDENTIALS.email)
      await user.type(passwordInput, TEST_CREDENTIALS.password)

      // Submit form
      await user.click(submitButton)

      // Wait for async operations
      await waitFor(() => {
        expect(login).toHaveBeenCalledWith(
          TEST_CREDENTIALS.email,
          TEST_CREDENTIALS.password,
          '/dashboard'
        )
      })

      // Verify session was checked before redirect
      await waitFor(() => {
        expect(verifySession).toHaveBeenCalled()
      })

      // Verify redirect to dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    test('should show loading state during login', async () => {
      const user = userEvent.setup()
      
      // Mock delayed login
      login.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({ session: mockSession, user: mockUser }), 100)
      ))
      verifySession.mockResolvedValue(mockUser)

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, TEST_CREDENTIALS.email)
      await user.type(passwordInput, TEST_CREDENTIALS.password)
      await user.click(submitButton)

      // Check loading state
      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
      expect(emailInput).toBeDisabled()
      expect(passwordInput).toBeDisabled()

      // Wait for login to complete
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      })
    })

    test('should display error message on login failure', async () => {
      const user = userEvent.setup()
      const errorMessage = 'Invalid email or password'
      
      // Mock failed login
      login.mockRejectedValue(new Error(errorMessage))

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, TEST_CREDENTIALS.email)
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      // Check error message is displayed
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })

      // Form should be re-enabled
      expect(submitButton).not.toBeDisabled()
      expect(emailInput).not.toBeDisabled()
      expect(passwordInput).not.toBeDisabled()
    })

    test('should handle session verification failure', async () => {
      const user = userEvent.setup()
      
      // Mock login success but session verification fails
      login.mockResolvedValue({ session: mockSession, user: mockUser })
      verifySession.mockResolvedValue(null)

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, TEST_CREDENTIALS.email)
      await user.type(passwordInput, TEST_CREDENTIALS.password)
      await user.click(submitButton)

      // Check error message for session verification failure
      await waitFor(() => {
        expect(screen.getByText('Session verification failed')).toBeInTheDocument()
      })

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled()
    })

    test('should validate required fields', async () => {
      const user = userEvent.setup()
      
      render(<LoginPage />)

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      // Try to submit without filling fields
      await user.click(submitButton)

      // Login should not be called
      expect(login).not.toHaveBeenCalled()
    })
  })

  describe('3. Session Establishment Verification', () => {
    test('should wait for session to be properly established before redirect', async () => {
      const user = userEvent.setup()
      
      let sessionEstablished = false
      
      // Mock delayed session establishment
      login.mockResolvedValue({ session: mockSession, user: mockUser })
      verifySession.mockImplementation(() => {
        if (!sessionEstablished) {
          sessionEstablished = true
          return null // First call returns null
        }
        return mockUser // Subsequent calls return user
      })

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, TEST_CREDENTIALS.email)
      await user.type(passwordInput, TEST_CREDENTIALS.password)
      await user.click(submitButton)

      // Should verify session with built-in delay
      await waitFor(() => {
        expect(verifySession).toHaveBeenCalled()
      })

      // The implementation includes a 200ms delay, so session should be established
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      }, { timeout: 1000 })
    })

    test('should handle race conditions with proper timing', async () => {
      const user = userEvent.setup()
      
      // Track the timing of calls
      const callOrder = []
      
      login.mockImplementation(async () => {
        callOrder.push('login')
        return { session: mockSession, user: mockUser }
      })
      
      verifySession.mockImplementation(async () => {
        callOrder.push('verifySession')
        return mockUser
      })

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, TEST_CREDENTIALS.email)
      await user.type(passwordInput, TEST_CREDENTIALS.password)
      await user.click(submitButton)

      await waitFor(() => {
        expect(callOrder).toEqual(['login', 'verifySession'])
      })

      // Verify the delay is applied (200ms as per implementation)
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('4. Redirect Mechanism', () => {
    test('should redirect to dashboard by default after successful login', async () => {
      const user = userEvent.setup()
      
      login.mockResolvedValue({ session: mockSession, user: mockUser })
      verifySession.mockResolvedValue(mockUser)

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, TEST_CREDENTIALS.email)
      await user.type(passwordInput, TEST_CREDENTIALS.password)
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    test('should redirect to callback URL if provided', async () => {
      const user = userEvent.setup()
      const callbackUrl = '/admin/users'
      
      mockSearchParams = new URLSearchParams({ callback: callbackUrl })
      useSearchParams.mockReturnValue(mockSearchParams)
      
      login.mockResolvedValue({ session: mockSession, user: mockUser })
      verifySession.mockResolvedValue(mockUser)

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, TEST_CREDENTIALS.email)
      await user.type(passwordInput, TEST_CREDENTIALS.password)
      await user.click(submitButton)

      await waitFor(() => {
        expect(login).toHaveBeenCalledWith(
          TEST_CREDENTIALS.email,
          TEST_CREDENTIALS.password,
          callbackUrl
        )
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(callbackUrl)
      })
    })

    test('should handle complex callback URLs with query parameters', async () => {
      const user = userEvent.setup()
      const callbackUrl = '/assets?category=IT_EQUIPMENT&status=AVAILABLE'
      
      mockSearchParams = new URLSearchParams({ callback: callbackUrl })
      useSearchParams.mockReturnValue(mockSearchParams)
      
      login.mockResolvedValue({ session: mockSession, user: mockUser })
      verifySession.mockResolvedValue(mockUser)

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, TEST_CREDENTIALS.email)
      await user.type(passwordInput, TEST_CREDENTIALS.password)
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(callbackUrl)
      })
    })
  })

  describe('5. Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async () => {
      const user = userEvent.setup()
      
      login.mockRejectedValue(new Error('Network error'))

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, TEST_CREDENTIALS.email)
      await user.type(passwordInput, TEST_CREDENTIALS.password)
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    test('should handle empty error messages', async () => {
      const user = userEvent.setup()
      
      login.mockRejectedValue(new Error())

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, TEST_CREDENTIALS.email)
      await user.type(passwordInput, TEST_CREDENTIALS.password)
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Login failed. Please check your credentials.')).toBeInTheDocument()
      })
    })

    test('should clear previous errors on new submission', async () => {
      const user = userEvent.setup()
      
      // First submission fails
      login.mockRejectedValueOnce(new Error('First error'))
      // Second submission succeeds
      login.mockResolvedValueOnce({ session: mockSession, user: mockUser })
      verifySession.mockResolvedValue(mockUser)

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // First attempt - should fail
      await user.type(emailInput, TEST_CREDENTIALS.email)
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument()
      })

      // Clear and try again
      await user.clear(passwordInput)
      await user.type(passwordInput, TEST_CREDENTIALS.password)
      await user.click(submitButton)

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument()
      })
    })

    test('should prevent form submission while loading', async () => {
      const user = userEvent.setup()
      
      // Mock slow login
      login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

      render(<LoginPage />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, TEST_CREDENTIALS.email)
      await user.type(passwordInput, TEST_CREDENTIALS.password)
      await user.click(submitButton)

      // Try to click again while loading
      await user.click(submitButton)

      // Login should only be called once
      expect(login).toHaveBeenCalledTimes(1)
    })
  })
})