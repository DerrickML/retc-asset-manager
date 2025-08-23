import React from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * Custom render function with common providers
 */
export function renderWithProviders(ui, options = {}) {
  const { initialProps = {}, ...renderOptions } = options

  function Wrapper({ children }) {
    return (
      <div data-testid="test-wrapper">
        {children}
      </div>
    )
  }

  const result = render(ui, { wrapper: Wrapper, ...renderOptions })

  return {
    user: userEvent.setup(),
    ...result,
  }
}

/**
 * Mock factory functions for common data structures
 */
export const mockFactories = {
  user: (overrides = {}) => ({
    $id: 'mock-user-id',
    name: 'Mock User',
    email: 'mock@example.com',
    ...overrides,
  }),

  staff: (overrides = {}) => ({
    $id: 'mock-staff-id',
    userId: 'mock-user-id',
    name: 'Mock Staff',
    email: 'mock@example.com',
    roles: ['STAFF'],
    departmentId: 'mock-dept-id',
    phone: '123-456-7890',
    employeeId: 'EMP001',
    active: true,
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  asset: (overrides = {}) => ({
    $id: 'mock-asset-id',
    name: 'Mock Asset',
    assetTag: 'MOCK001',
    category: 'IT_EQUIPMENT',
    departmentId: 'mock-dept-id',
    availableStatus: 'AVAILABLE',
    currentCondition: 'GOOD',
    acquisitionDate: new Date().toISOString(),
    acquisitionCost: 1000,
    currentValue: 800,
    serialNumber: 'SN123456',
    modelNumber: 'MODEL123',
    specifications: {},
    publicImages: [],
    attachmentFileIds: [],
    isPublic: false,
    locationName: 'Mock Location',
    custodianStaffId: null,
    createdBy: 'mock-staff-id',
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  request: (overrides = {}) => ({
    $id: 'mock-request-id',
    assetId: 'mock-asset-id',
    requesterStaffId: 'mock-staff-id',
    status: 'PENDING',
    purpose: 'Mock purpose for testing',
    expectedDuration: 7,
    expected_return_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'MEDIUM',
    approval_notes: null,
    approved_by: null,
    approved_at: null,
    issued_by: null,
    issued_at: null,
    returned_at: null,
    return_condition: null,
    return_notes: null,
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  department: (overrides = {}) => ({
    $id: 'mock-dept-id',
    name: 'Mock Department',
    description: 'Mock department description',
    managerId: 'mock-manager-id',
    budgetCode: 'DEPT001',
    active: true,
    $createdAt: new Date().toISOString(),
    ...overrides,
  }),

  settings: (overrides = {}) => ({
    $id: 'mock-settings-id',
    branding: {
      orgName: 'Mock Organization',
      logoFileId: null,
      brandColor: '#2563eb',
      accentColor: '#16a34a',
      emailFromName: 'Mock Asset Management',
    },
    approval: {
      thresholds: {
        value: 1000,
        durationDays: 30,
      },
    },
    reminders: {
      preReturnDays: 2,
      overdueDays: [1, 3, 7],
    },
    guestPortal: true,
    smtpSettings: {
      host: '',
      port: 587,
      secure: false,
      user: '',
      pass: '',
    },
    ...overrides,
  }),
}

/**
 * Mock Appwrite database responses
 */
export const mockAppwriteResponse = (documents = [], total = null) => ({
  total: total !== null ? total : documents.length,
  documents,
})

/**
 * Create mock functions with common patterns
 */
export const createMockService = () => ({
  list: jest.fn().mockResolvedValue(mockAppwriteResponse([])),
  get: jest.fn().mockResolvedValue({}),
  create: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue({}),
})

/**
 * Wait for async operations to complete
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

/**
 * Mock fetch responses
 */
export const mockFetch = (response = {}, ok = true) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 400,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
  })
}

/**
 * Common test data collections
 */
export const testData = {
  users: [
    mockFactories.user({ name: 'Alice Johnson', email: 'alice@example.com' }),
    mockFactories.user({ $id: 'user-2', name: 'Bob Smith', email: 'bob@example.com' }),
  ],
  
  staff: [
    mockFactories.staff({ name: 'Alice Johnson', roles: ['SYSTEM_ADMIN'] }),
    mockFactories.staff({ 
      $id: 'staff-2', 
      name: 'Bob Smith', 
      roles: ['ASSET_ADMIN'],
      email: 'bob@example.com' 
    }),
    mockFactories.staff({ 
      $id: 'staff-3', 
      name: 'Carol Davis', 
      roles: ['STAFF'],
      email: 'carol@example.com' 
    }),
  ],

  assets: [
    mockFactories.asset({ name: 'Laptop Dell XPS 15', category: 'IT_EQUIPMENT' }),
    mockFactories.asset({ 
      $id: 'asset-2', 
      name: 'Projector Epson', 
      category: 'AV_EQUIPMENT',
      availableStatus: 'IN_USE' 
    }),
    mockFactories.asset({ 
      $id: 'asset-3', 
      name: 'Safety Helmet', 
      category: 'SAFETY_EQUIPMENT',
      isPublic: true 
    }),
  ],

  requests: [
    mockFactories.request({ purpose: 'Development work' }),
    mockFactories.request({ 
      $id: 'request-2', 
      status: 'APPROVED',
      purpose: 'Training session' 
    }),
    mockFactories.request({ 
      $id: 'request-3', 
      status: 'FULFILLED',
      purpose: 'Project demonstration' 
    }),
  ],

  departments: [
    mockFactories.department({ name: 'IT Department' }),
    mockFactories.department({ 
      $id: 'dept-2', 
      name: 'Training Department' 
    }),
  ],
}

/**
 * Test assertion helpers
 */
export const assertions = {
  toBeInDocument: (element) => expect(element).toBeInTheDocument(),
  toHaveTextContent: (element, text) => expect(element).toHaveTextContent(text),
  toHaveClass: (element, className) => expect(element).toHaveClass(className),
  toBeVisible: (element) => expect(element).toBeVisible(),
  toBeDisabled: (element) => expect(element).toBeDisabled(),
  toBeEnabled: (element) => expect(element).toBeEnabled(),
}

/**
 * Mock console methods for testing
 */
export const mockConsole = () => {
  const originalConsole = { ...console }
  
  beforeEach(() => {
    console.log = jest.fn()
    console.warn = jest.fn()
    console.error = jest.fn()
    console.info = jest.fn()
  })

  afterEach(() => {
    Object.assign(console, originalConsole)
  })

  return {
    expectLogToBeCalled: (message) => expect(console.log).toHaveBeenCalledWith(expect.stringContaining(message)),
    expectWarnToBeCalled: (message) => expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(message)),
    expectErrorToBeCalled: (message) => expect(console.error).toHaveBeenCalledWith(expect.stringContaining(message)),
  }
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { userEvent }