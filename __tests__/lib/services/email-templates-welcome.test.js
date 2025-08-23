/**
 * Welcome Email Template Tests
 */
import { renderEmailTemplate, EMAIL_TEMPLATES } from '../../../lib/services/email-templates.js'

describe('Welcome Email Template', () => {
  const mockData = {
    userName: 'John Doe',
    userEmail: 'john.doe@company.com',
    userId: 'USR123456',
    roles: ['STAFF', 'ASSET_ADMIN'],
    department: 'Information Technology',
    temporaryPassword: 'TempPass123!'
  }

  const mockBranding = {
    orgName: 'Test Organization',
    brandColor: '#2563eb',
    accentColor: '#16a34a'
  }

  test('renders welcome email template correctly', () => {
    const result = renderEmailTemplate('USER_WELCOME', mockData, mockBranding)
    
    expect(result).toHaveProperty('subject')
    expect(result).toHaveProperty('html')
    expect(typeof result.subject).toBe('string')
    expect(typeof result.html).toBe('string')
  })

  test('includes user information in welcome email', () => {
    const result = renderEmailTemplate('USER_WELCOME', mockData, mockBranding)
    
    expect(result.html).toContain(mockData.userName)
    expect(result.html).toContain(mockData.userEmail)
    expect(result.html).toContain(mockData.userId)
    expect(result.html).toContain(mockData.temporaryPassword)
    expect(result.html).toContain(mockData.department)
  })

  test('includes roles in welcome email', () => {
    const result = renderEmailTemplate('USER_WELCOME', mockData, mockBranding)
    
    expect(result.html).toContain('STAFF')
    expect(result.html).toContain('ASSET_ADMIN')
  })

  test('handles single role correctly', () => {
    const singleRoleData = {
      ...mockData,
      roles: ['STAFF']
    }
    
    const result = renderEmailTemplate('USER_WELCOME', singleRoleData, mockBranding)
    
    expect(result.html).toContain('STAFF')
    expect(result.html).toContain('Role:') // Should use singular
  })

  test('handles multiple roles correctly', () => {
    const result = renderEmailTemplate('USER_WELCOME', mockData, mockBranding)
    
    expect(result.html).toContain('Roles:') // Should use plural
  })

  test('includes admin features for admin roles', () => {
    const adminData = {
      ...mockData,
      roles: ['ADMIN', 'STAFF']
    }
    
    const result = renderEmailTemplate('USER_WELCOME', adminData, mockBranding)
    
    expect(result.html).toContain('Administration')
  })

  test('does not include admin features for non-admin roles', () => {
    const staffData = {
      ...mockData,
      roles: ['STAFF']
    }
    
    const result = renderEmailTemplate('USER_WELCOME', staffData, mockBranding)
    
    expect(result.html).not.toContain('Administration')
  })

  test('handles missing department gracefully', () => {
    const dataWithoutDept = {
      ...mockData,
      department: null
    }
    
    const result = renderEmailTemplate('USER_WELCOME', dataWithoutDept, mockBranding)
    
    expect(result.html).not.toContain('Department')
    expect(result.html).toContain(mockData.userName)
  })

  test('subject includes organization name', () => {
    const result = renderEmailTemplate('USER_WELCOME', mockData, mockBranding)
    
    expect(result.subject).toContain(mockBranding.orgName)
  })

  test('template exists in EMAIL_TEMPLATES', () => {
    expect(EMAIL_TEMPLATES).toHaveProperty('USER_WELCOME')
    expect(EMAIL_TEMPLATES.USER_WELCOME).toHaveProperty('subject')
    expect(EMAIL_TEMPLATES.USER_WELCOME).toHaveProperty('template')
  })
})