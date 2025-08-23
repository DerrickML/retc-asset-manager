import { renderEmailTemplate, EMAIL_TEMPLATES } from '../../../lib/services/email-templates'

describe('Email Templates', () => {
  const mockBranding = {
    orgName: 'Test Organization',
    brandColor: '#2563eb',
    accentColor: '#16a34a',
  }

  describe('renderEmailTemplate', () => {
    it('renders REQUEST_SUBMITTED template correctly', () => {
      const data = {
        requesterName: 'John Doe',
        assetName: 'Test Asset',
        requestId: 'REQ123',
        purpose: 'Testing purpose',
        expectedReturnDate: new Date('2024-02-01').toISOString(),
      }

      const result = renderEmailTemplate('REQUEST_SUBMITTED', data, mockBranding)

      expect(result.subject).toBe('New Asset Request Submitted - #REQ123')
      expect(result.html).toContain('John Doe')
      expect(result.html).toContain('Test Asset')
      expect(result.html).toContain('REQ123')
      expect(result.html).toContain('Testing purpose')
      expect(result.html).toContain('Test Organization')
      expect(result.html).toContain('#2563eb')
    })

    it('renders REQUEST_APPROVED template correctly', () => {
      const data = {
        requesterName: 'Jane Smith',
        assetName: 'Laptop',
        requestId: 'REQ456',
        approverName: 'Admin User',
        approvalNotes: 'Approved for development',
      }

      const result = renderEmailTemplate('REQUEST_APPROVED', data, mockBranding)

      expect(result.subject).toBe('Asset Request Approved - #REQ456')
      expect(result.html).toContain('Jane Smith')
      expect(result.html).toContain('Laptop')
      expect(result.html).toContain('Admin User')
      expect(result.html).toContain('Approved for development')
      expect(result.html).toContain('✅ Request Approved')
    })

    it('renders REQUEST_DENIED template correctly', () => {
      const data = {
        requesterName: 'Bob Johnson',
        assetName: 'Projector',
        requestId: 'REQ789',
        approverName: 'Manager',
        denialReason: 'Asset under maintenance',
      }

      const result = renderEmailTemplate('REQUEST_DENIED', data, mockBranding)

      expect(result.subject).toBe('Asset Request Denied - #REQ789')
      expect(result.html).toContain('Bob Johnson')
      expect(result.html).toContain('Projector')
      expect(result.html).toContain('Manager')
      expect(result.html).toContain('Asset under maintenance')
      expect(result.html).toContain('❌ Request Denied')
    })

    it('renders ASSET_ISSUED template correctly', () => {
      const data = {
        requesterName: 'Alice Brown',
        assetName: 'Camera',
        requestId: 'REQ101',
        issuerName: 'Asset Manager',
        expectedReturnDate: new Date('2024-02-15').toISOString(),
        issuanceNotes: 'Includes memory card',
      }

      const result = renderEmailTemplate('ASSET_ISSUED', data, mockBranding)

      expect(result.subject).toBe('Asset Ready for Pickup - #REQ101')
      expect(result.html).toContain('Alice Brown')
      expect(result.html).toContain('Camera')
      expect(result.html).toContain('Asset Manager')
      expect(result.html).toContain('Includes memory card')
      expect(result.html).toContain('🎉 Asset Ready for Pickup')
    })

    it('renders RETURN_REMINDER template correctly', () => {
      const data = {
        requesterName: 'Charlie Wilson',
        assetName: 'Tablet',
        requestId: 'REQ202',
        expectedReturnDate: new Date('2024-01-30').toISOString(),
        daysUntilDue: 2,
      }

      const result = renderEmailTemplate('RETURN_REMINDER', data, mockBranding)

      expect(result.subject).toBe('Asset Return Reminder - Due in 2 days')
      expect(result.html).toContain('Charlie Wilson')
      expect(result.html).toContain('Tablet')
      expect(result.html).toContain('2 days')
      expect(result.html).toContain('⏰ Return Reminder')
    })

    it('renders RETURN_OVERDUE template correctly', () => {
      const data = {
        requesterName: 'Diana Green',
        assetName: 'Monitor',
        requestId: 'REQ303',
        expectedReturnDate: new Date('2024-01-20').toISOString(),
        daysOverdue: 5,
      }

      const result = renderEmailTemplate('RETURN_OVERDUE', data, mockBranding)

      expect(result.subject).toBe('OVERDUE: Asset Return Required - #REQ303')
      expect(result.html).toContain('Diana Green')
      expect(result.html).toContain('Monitor')
      expect(result.html).toContain('5 days')
      expect(result.html).toContain('🚨 Asset Overdue')
    })

    it('renders MAINTENANCE_DUE template correctly', () => {
      const data = {
        assetName: 'Printer',
        assetId: 'AST404',
        lastMaintenance: new Date('2023-12-01').toISOString(),
        nextMaintenance: new Date('2024-02-01').toISOString(),
        technicianName: 'Tech Team',
      }

      const result = renderEmailTemplate('MAINTENANCE_DUE', data, mockBranding)

      expect(result.subject).toBe('Asset Maintenance Required - Printer')
      expect(result.html).toContain('Printer')
      expect(result.html).toContain('AST404')
      expect(result.html).toContain('Tech Team')
      expect(result.html).toContain('🔧 Maintenance Required')
    })

    it('renders ASSET_RETURNED template correctly', () => {
      const data = {
        requesterName: 'Eva Martinez',
        assetName: 'Keyboard',
        requestId: 'REQ505',
        returnDate: new Date().toISOString(),
        returnCondition: 'GOOD',
        returnNotes: 'Returned in good condition',
      }

      const result = renderEmailTemplate('ASSET_RETURNED', data, mockBranding)

      expect(result.subject).toBe('Asset Returned - #REQ505')
      expect(result.html).toContain('Eva Martinez')
      expect(result.html).toContain('Keyboard')
      expect(result.html).toContain('GOOD')
      expect(result.html).toContain('Returned in good condition')
      expect(result.html).toContain('📦 Asset Returned')
    })

    it('renders SYSTEM_ALERT template correctly', () => {
      const data = {
        alertType: 'Low Storage',
        severity: 'WARNING',
        details: 'Storage at 85% capacity',
        timestamp: new Date().toISOString(),
      }

      const result = renderEmailTemplate('SYSTEM_ALERT', data, mockBranding)

      expect(result.subject).toBe('System Alert - Low Storage')
      expect(result.html).toContain('Low Storage')
      expect(result.html).toContain('WARNING')
      expect(result.html).toContain('Storage at 85% capacity')
      expect(result.html).toContain('🚨 System Alert')
    })

    it('throws error for unknown template type', () => {
      const data = { test: 'data' }

      expect(() => {
        renderEmailTemplate('UNKNOWN_TEMPLATE', data, mockBranding)
      }).toThrow("Email template 'UNKNOWN_TEMPLATE' not found")
    })

    it('uses default branding when not provided', () => {
      const data = {
        requesterName: 'Test User',
        assetName: 'Test Asset',
        requestId: 'TEST123',
        purpose: 'Testing',
        expectedReturnDate: new Date().toISOString(),
      }

      const result = renderEmailTemplate('REQUEST_SUBMITTED', data)

      expect(result.html).toContain('RETC Asset Management')
      expect(result.html).toContain('#2563eb')
      expect(result.html).toContain('#16a34a')
    })

    it('replaces placeholder variables in subject lines', () => {
      const data = {
        requesterName: 'Test User',
        assetName: 'Test Asset',
        requestId: 'PLACEHOLDER_TEST',
        daysUntilDue: 3,
      }

      const result = renderEmailTemplate('RETURN_REMINDER', data, mockBranding)

      expect(result.subject).toBe('Asset Return Reminder - Due in 3 days')
      expect(result.subject).not.toContain('${')
      expect(result.subject).not.toContain('#{')
    })
  })

  describe('Template structure validation', () => {
    const requiredTemplates = [
      'REQUEST_SUBMITTED',
      'REQUEST_APPROVED',
      'REQUEST_DENIED',
      'ASSET_ISSUED',
      'RETURN_REMINDER',
      'RETURN_OVERDUE',
      'MAINTENANCE_DUE',
      'ASSET_RETURNED',
      'SYSTEM_ALERT',
    ]

    requiredTemplates.forEach((templateType) => {
      it(`${templateType} template has required properties`, () => {
        expect(EMAIL_TEMPLATES[templateType]).toBeDefined()
        expect(EMAIL_TEMPLATES[templateType].subject).toBeDefined()
        expect(EMAIL_TEMPLATES[templateType].template).toBeDefined()
        expect(typeof EMAIL_TEMPLATES[templateType].template).toBe('function')
      })
    })
  })

  describe('HTML structure validation', () => {
    const mockData = {
      requesterName: 'Test User',
      assetName: 'Test Asset',
      requestId: 'TEST123',
      purpose: 'Testing',
      expectedReturnDate: new Date().toISOString(),
    }

    it('generates valid HTML structure', () => {
      const result = renderEmailTemplate('REQUEST_SUBMITTED', mockData, mockBranding)

      expect(result.html).toContain('<!DOCTYPE html>')
      expect(result.html).toContain('<html lang="en">')
      expect(result.html).toContain('<head>')
      expect(result.html).toContain('<body>')
      expect(result.html).toContain('</html>')
    })

    it('includes responsive styling', () => {
      const result = renderEmailTemplate('REQUEST_SUBMITTED', mockData, mockBranding)

      expect(result.html).toContain('max-width: 600px')
      expect(result.html).toContain('font-family:')
      expect(result.html).toContain('line-height:')
    })

    it('includes branding elements', () => {
      const result = renderEmailTemplate('REQUEST_SUBMITTED', mockData, mockBranding)

      expect(result.html).toContain(mockBranding.orgName)
      expect(result.html).toContain(mockBranding.brandColor)
      expect(result.html).toContain(mockBranding.accentColor)
    })

    it('includes unsubscribe information', () => {
      const result = renderEmailTemplate('REQUEST_SUBMITTED', mockData, mockBranding)

      expect(result.html).toContain('automated message')
      expect(result.html).toContain('do not reply')
    })

    it('includes copyright information', () => {
      const result = renderEmailTemplate('REQUEST_SUBMITTED', mockData, mockBranding)
      const currentYear = new Date().getFullYear()

      expect(result.html).toContain(`&copy; ${currentYear}`)
      expect(result.html).toContain(mockBranding.orgName)
    })
  })
})