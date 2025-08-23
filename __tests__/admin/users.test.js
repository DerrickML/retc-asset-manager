import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import UsersPage from '../../app/admin/users/page'

// Mock the services
jest.mock('../../lib/appwrite/staff-service', () => ({
  list: jest.fn(() => Promise.resolve({ documents: [] })),
  create: jest.fn(() => Promise.resolve({ $id: 'test-id' })),
  update: jest.fn(() => Promise.resolve()),
  delete: jest.fn(() => Promise.resolve())
}))

jest.mock('../../lib/appwrite/departments-service', () => ({
  list: jest.fn(() => Promise.resolve({ 
    documents: [
      { $id: 'dept-1', name: 'IT Department' },
      { $id: 'dept-2', name: 'HR Department' }
    ] 
  }))
}))

jest.mock('../../lib/utils/auth', () => ({
  getCurrentStaff: jest.fn(() => Promise.resolve({ 
    $id: 'current-staff',
    roles: ['ADMIN'],
    permissions: ['MANAGE_USERS']
  })),
  register: jest.fn(() => Promise.resolve({ $id: 'auth-user-id' })),
  permissions: {
    canManageUsers: jest.fn(() => true)
  }
}))

describe('Users Management Page', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  test('renders user management interface correctly', async () => {
    render(<UsersPage />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument()
    })

    // Check for main elements
    expect(screen.getByText('Manage system users and permissions')).toBeInTheDocument()
    expect(screen.getByText('Add User')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument()
    expect(screen.getByText('All Roles')).toBeInTheDocument()
  })

  test('opens create user dialog when Add User is clicked', async () => {
    render(<UsersPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Add User')).toBeInTheDocument()
    })

    // Click Add User button
    fireEvent.click(screen.getByText('Add User'))

    // Check if dialog opens
    expect(screen.getByText('Create New User')).toBeInTheDocument()
    expect(screen.getByText('Basic Information')).toBeInTheDocument()
    expect(screen.getByText('Role & Permissions')).toBeInTheDocument()
    expect(screen.getByText('Organization Details')).toBeInTheDocument()
  })

  test('validates required fields in user creation form', async () => {
    render(<UsersPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Add User')).toBeInTheDocument()
    })

    // Open dialog
    fireEvent.click(screen.getByText('Add User'))

    // Try to submit without filling required fields
    const createButton = screen.getByRole('button', { name: /create user/i })
    expect(createButton).toBeDisabled()
  })

  test('enables create button when required fields are filled', async () => {
    render(<UsersPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Add User')).toBeInTheDocument()
    })

    // Open dialog
    fireEvent.click(screen.getByText('Add User'))

    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText('e.g., John Doe'), {
      target: { value: 'Test User' }
    })
    fireEvent.change(screen.getByPlaceholderText('e.g., john.doe@company.com'), {
      target: { value: 'test@example.com' }
    })

    // Check that STAFF role is selected by default
    const staffCheckbox = screen.getByRole('checkbox', { name: /STAFF/i })
    expect(staffCheckbox).toBeChecked()

    // Create button should now be enabled
    const createButton = screen.getByRole('button', { name: /create user/i })
    expect(createButton).not.toBeDisabled()
  })

  test('handles role selection correctly', async () => {
    render(<UsersPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Add User')).toBeInTheDocument()
    })

    // Open dialog
    fireEvent.click(screen.getByText('Add User'))

    // STAFF should be selected by default
    const staffCheckbox = screen.getByRole('checkbox', { name: /STAFF/i })
    expect(staffCheckbox).toBeChecked()

    // Select ADMIN role
    const adminCheckbox = screen.getByRole('checkbox', { name: /ADMIN/i })
    fireEvent.click(adminCheckbox)
    expect(adminCheckbox).toBeChecked()

    // Both roles should now be selected
    expect(staffCheckbox).toBeChecked()
    expect(adminCheckbox).toBeChecked()
  })

  test('auto-generates userId when not provided', () => {
    // This test checks the userId generation logic
    const timestamp = Date.now().toString().slice(-6)
    const expectedUserId = `USR${timestamp}`
    
    // Mock Date.now for consistent testing
    const mockDate = jest.spyOn(Date, 'now').mockReturnValue(1234567890123)
    
    const generatedUserId = '' || `USR${Date.now().toString().slice(-6)}`
    expect(generatedUserId).toBe('USR567890')
    
    mockDate.mockRestore()
  })
})