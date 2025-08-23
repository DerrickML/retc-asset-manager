/**
 * NodemailerService Welcome Email Tests
 */
import { NodemailerService } from '../../../lib/services/nodemailer.js'

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  })),
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  }))
}))

describe('NodemailerService Welcome Email', () => {
  beforeEach(() => {
    // Mock environment variables
    process.env.SMTP_HOST = 'test.smtp.com'
    process.env.SMTP_PORT = '587'
    process.env.SMTP_USER = 'test@example.com'
    process.env.SMTP_PASS = 'password'
    process.env.EMAIL_FROM = 'test@example.com'
    process.env.EMAIL_FROM_NAME = 'Test System'
  })

  test('sendNotification uses rendered template when provided', async () => {
    const mockRenderedEmail = {
      subject: 'Welcome to Test Organization - Your Account is Ready!',
      html: '<h1>Welcome Test User!</h1><p>Your temporary password is: TestPass123</p>'
    }

    // Mock the sendEmail method to check what gets called
    const sendEmailSpy = jest.spyOn(NodemailerService, 'sendEmail')
      .mockResolvedValue({ messageId: 'test-message-id' })

    await NodemailerService.sendNotification(
      'USER_WELCOME',
      'test@example.com',
      { userName: 'Test User' },
      mockRenderedEmail
    )

    expect(sendEmailSpy).toHaveBeenCalledWith({
      to: ['test@example.com'],
      subject: mockRenderedEmail.subject,
      html: mockRenderedEmail.html
    })

    sendEmailSpy.mockRestore()
  })

  test('sendNotification falls back to legacy templates when no rendered template provided', async () => {
    const sendEmailSpy = jest.spyOn(NodemailerService, 'sendEmail')
      .mockResolvedValue({ messageId: 'test-message-id' })

    await NodemailerService.sendNotification(
      'unknown_type',
      'test@example.com',
      { userName: 'Test User' }
    )

    expect(sendEmailSpy).toHaveBeenCalledWith({
      to: ['test@example.com'],
      subject: 'RETC Asset Management Notification',
      html: '<p>You have received a notification from RETC Asset Management.</p>'
    })

    sendEmailSpy.mockRestore()
  })

  test('sendNotification handles array of recipients', async () => {
    const mockRenderedEmail = {
      subject: 'Welcome to Test Organization - Your Account is Ready!',
      html: '<h1>Welcome!</h1>'
    }

    const sendEmailSpy = jest.spyOn(NodemailerService, 'sendEmail')
      .mockResolvedValue({ messageId: 'test-message-id' })

    await NodemailerService.sendNotification(
      'USER_WELCOME',
      ['user1@example.com', 'user2@example.com'],
      { userName: 'Test User' },
      mockRenderedEmail
    )

    expect(sendEmailSpy).toHaveBeenCalledWith({
      to: ['user1@example.com', 'user2@example.com'],
      subject: mockRenderedEmail.subject,
      html: mockRenderedEmail.html
    })

    sendEmailSpy.mockRestore()
  })
})