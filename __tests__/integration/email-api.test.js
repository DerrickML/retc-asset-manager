/**
 * Integration tests for the Email API endpoint
 * Tests the full flow from API request to template rendering
 */

import { POST, GET } from '../../app/api/notifications/email/route'
import { NextRequest } from 'next/server'

// Mock the dependencies
jest.mock('../../lib/services/email-templates', () => ({
  renderEmailTemplate: jest.fn(),
}))

jest.mock('../../lib/appwrite/server-provider', () => ({
  settingsService: {
    get: jest.fn(),
  },
}))

import { renderEmailTemplate } from '../../lib/services/email-templates'
import { settingsService } from '../../lib/appwrite/server-provider'

describe('/api/notifications/email', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock console methods to avoid test noise
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
    jest.spyOn(console, 'warn').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('POST endpoint', () => {
    it('successfully processes email request with all required fields', async () => {
      const mockBranding = {
        orgName: 'Test Organization',
        brandColor: '#2563eb',
        accentColor: '#16a34a',
      }

      const mockRenderedEmail = {
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
      }

      settingsService.get.mockResolvedValue({ branding: mockBranding })
      renderEmailTemplate.mockReturnValue(mockRenderedEmail)

      const requestBody = {
        type: 'REQUEST_SUBMITTED',
        recipient: 'test@example.com',
        data: {
          requesterName: 'John Doe',
          assetName: 'Test Asset',
          requestId: 'REQ123',
          purpose: 'Testing',
          expectedReturnDate: new Date().toISOString(),
        },
      }

      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.messageId).toMatch(/^mock_/)
      expect(settingsService.get).toHaveBeenCalled()
      expect(renderEmailTemplate).toHaveBeenCalledWith(
        'REQUEST_SUBMITTED',
        requestBody.data,
        mockBranding
      )
    })

    it('handles missing required fields', async () => {
      const requestBody = {
        type: 'REQUEST_SUBMITTED',
        // Missing recipient and data
      }

      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Missing required fields: type, recipient, data')
    })

    it('handles template rendering errors', async () => {
      renderEmailTemplate.mockImplementation(() => {
        throw new Error('Template not found')
      })

      const requestBody = {
        type: 'UNKNOWN_TEMPLATE',
        recipient: 'test@example.com',
        data: { test: 'data' },
      }

      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Failed to render email template')
    })

    it('processes admin recipients correctly', async () => {
      const mockBranding = {}
      settingsService.get.mockResolvedValue({ branding: mockBranding })
      renderEmailTemplate.mockReturnValue({
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      })

      const requestBody = {
        type: 'REQUEST_SUBMITTED',
        recipient: 'admins',
        data: { test: 'data' },
      }

      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.summary.total).toBe(1)
      expect(responseData.summary.sent).toBe(1)
    })

    it('handles multiple email recipients', async () => {
      const mockBranding = {}
      settingsService.get.mockResolvedValue({ branding: mockBranding })
      renderEmailTemplate.mockReturnValue({
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      })

      const requestBody = {
        type: 'REQUEST_SUBMITTED',
        recipient: ['admin1@example.com', 'admin2@example.com'],
        data: { test: 'data' },
      }

      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.summary.total).toBe(2)
      expect(responseData.summary.sent).toBe(2)
    })

    it('handles invalid recipient format', async () => {
      const requestBody = {
        type: 'REQUEST_SUBMITTED',
        recipient: 'invalid-email',
        data: { test: 'data' },
      }

      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('No valid recipient emails found')
    })

    it('uses provided branding over system settings', async () => {
      const systemBranding = { orgName: 'System Org' }
      const providedBranding = { orgName: 'Custom Org' }

      settingsService.get.mockResolvedValue({ branding: systemBranding })
      renderEmailTemplate.mockReturnValue({
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      })

      const requestBody = {
        type: 'REQUEST_SUBMITTED',
        recipient: 'test@example.com',
        data: { test: 'data' },
        branding: providedBranding,
      }

      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      await POST(request)

      expect(renderEmailTemplate).toHaveBeenCalledWith(
        'REQUEST_SUBMITTED',
        requestBody.data,
        providedBranding
      )
      expect(settingsService.get).not.toHaveBeenCalled()
    })
  })

  describe('GET endpoint', () => {
    it('returns template preview for valid type', async () => {
      const mockRenderedEmail = {
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
      }

      renderEmailTemplate.mockReturnValue(mockRenderedEmail)

      const request = new NextRequest('http://localhost:3000/api/notifications/email?type=REQUEST_SUBMITTED')

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.type).toBe('REQUEST_SUBMITTED')
      expect(responseData.subject).toBe('Test Subject')
      expect(responseData.html).toBe('<p>Test HTML content</p>')
      expect(responseData.data).toBeDefined()
    })

    it('returns HTML preview when preview=true', async () => {
      const mockRenderedEmail = {
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
      }

      renderEmailTemplate.mockReturnValue(mockRenderedEmail)

      const request = new NextRequest('http://localhost:3000/api/notifications/email?type=REQUEST_SUBMITTED&preview=true')

      const response = await GET(request)
      const responseText = await response.text()

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/html')
      expect(responseText).toBe('<p>Test HTML content</p>')
    })

    it('handles missing type parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/notifications/email')

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Missing template type parameter')
    })

    it('handles unknown template type', async () => {
      const request = new NextRequest('http://localhost:3000/api/notifications/email?type=UNKNOWN_TYPE')

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('No mock data available for template type: UNKNOWN_TYPE')
    })

    it('handles template rendering errors in preview', async () => {
      renderEmailTemplate.mockImplementation(() => {
        throw new Error('Template rendering failed')
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/email?type=REQUEST_SUBMITTED')

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('Failed to render template')
      expect(responseData.details).toBe('Template rendering failed')
    })

    it('provides mock data for all template types', async () => {
      const templateTypes = [
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

      renderEmailTemplate.mockReturnValue({
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      })

      for (const templateType of templateTypes) {
        const request = new NextRequest(`http://localhost:3000/api/notifications/email?type=${templateType}`)
        const response = await GET(request)
        const responseData = await response.json()

        expect(response.status).toBe(200)
        expect(responseData.type).toBe(templateType)
        expect(responseData.data).toBeDefined()
      }
    })
  })

  describe('Error handling and edge cases', () => {
    it('handles malformed JSON in POST request', async () => {
      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('handles settings service errors gracefully', async () => {
      settingsService.get.mockRejectedValue(new Error('Settings unavailable'))
      renderEmailTemplate.mockReturnValue({
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      })

      const requestBody = {
        type: 'REQUEST_SUBMITTED',
        recipient: 'test@example.com',
        data: { test: 'data' },
      }

      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(console.warn).toHaveBeenCalledWith(
        'Could not load branding settings:',
        expect.any(Error)
      )
    })
  })
})