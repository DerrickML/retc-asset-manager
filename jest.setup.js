import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }) => {
    return <a {...props}>{children}</a>
  },
}))

// Mock Appwrite client
jest.mock('./lib/appwrite/client.js', () => ({
  account: {
    get: jest.fn(),
    createEmailPasswordSession: jest.fn(),
    deleteSession: jest.fn(),
    create: jest.fn(),
  },
  databases: {
    listDocuments: jest.fn(),
    getDocument: jest.fn(),
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
  },
  storage: {
    createFile: jest.fn(),
    getFile: jest.fn(),
    getFilePreview: jest.fn(),
    getFileDownload: jest.fn(),
    deleteFile: jest.fn(),
  },
  functions: {
    createExecution: jest.fn(),
  },
  client: {},
}))

// Mock email services
jest.mock('./lib/services/email.js', () => ({
  EmailService: {
    sendNotification: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-message-id' }),
    renderTemplate: jest.fn().mockReturnValue({ subject: 'Test Subject', html: '<p>Test HTML</p>' }),
    sendRequestSubmitted: jest.fn().mockResolvedValue({ success: true }),
    sendRequestApproved: jest.fn().mockResolvedValue({ success: true }),
    sendRequestDenied: jest.fn().mockResolvedValue({ success: true }),
    sendAssetIssued: jest.fn().mockResolvedValue({ success: true }),
    sendReturnReminder: jest.fn().mockResolvedValue({ success: true }),
    sendReturnOverdue: jest.fn().mockResolvedValue({ success: true }),
    sendMaintenanceDue: jest.fn().mockResolvedValue({ success: true }),
    sendAssetReturned: jest.fn().mockResolvedValue({ success: true }),
    sendSystemAlert: jest.fn().mockResolvedValue({ success: true }),
  },
  EMAIL_TYPES: {
    REQUEST_SUBMITTED: "REQUEST_SUBMITTED",
    REQUEST_APPROVED: "REQUEST_APPROVED", 
    REQUEST_DENIED: "REQUEST_DENIED",
    ASSET_ISSUED: "ASSET_ISSUED",
    RETURN_REMINDER: "RETURN_REMINDER",
    RETURN_OVERDUE: "RETURN_OVERDUE",
    MAINTENANCE_DUE: "MAINTENANCE_DUE",
    ASSET_RETURNED: "ASSET_RETURNED",
    SYSTEM_ALERT: "SYSTEM_ALERT",
  }
}))

// Global test utilities
global.mockUser = {
  $id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
}

global.mockStaff = {
  $id: 'test-staff-id',
  userId: 'test-user-id',
  name: 'Test Staff',
  email: 'test@example.com',
  roles: ['STAFF'],
  departmentId: 'test-dept-id',
  active: true,
}

global.mockAsset = {
  $id: 'test-asset-id',
  name: 'Test Asset',
  assetTag: 'TST001',
  category: 'IT_EQUIPMENT',
  availableStatus: 'AVAILABLE',
  currentCondition: 'GOOD',
  isPublic: true,
  publicImages: [],
  attachmentFileIds: [],
  specifications: {},
  metadata: {},
  locationName: 'Test Location',
  custodianStaffId: null,
  $createdAt: new Date().toISOString(),
  $updatedAt: new Date().toISOString(),
}

global.mockRequest = {
  $id: 'test-request-id',
  assetId: 'test-asset-id',
  requesterStaffId: 'test-staff-id',
  status: 'PENDING',
  purpose: 'Test purpose',
  expectedDuration: 7,
  expected_return_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  priority: 'MEDIUM',
  $createdAt: new Date().toISOString(),
  $updatedAt: new Date().toISOString(),
}

// Console suppression for tests
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' && 
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
  
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' && 
      (args[0].includes('componentWillReceiveProps') || 
       args[0].includes('componentWillUpdate'))
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})