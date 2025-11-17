import { NodemailerService } from '../../../../lib/services/nodemailer.js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  // Disable test endpoint in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Test endpoint is disabled in production' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { type = 'request_submitted', recipient } = body

    if (!recipient) {
      return NextResponse.json(
        { success: false, error: 'Recipient email is required' },
        { status: 400 }
      )
    }

    // Test data for different email types
    const testData = {
      request_submitted: {
        requesterName: 'John Doe',
        assetName: 'Dell Laptop XPS 15',
        requestId: 'REQ-TEST-001',
        purpose: 'Testing email notifications',
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      request_approved: {
        requesterName: 'John Doe',
        assetName: 'Dell Laptop XPS 15',
        requestId: 'REQ-TEST-001',
        approverName: 'Jane Smith (Admin)',
        approvalNotes: 'Request approved for testing purposes',
      },
      request_denied: {
        requesterName: 'John Doe',
        assetName: 'Dell Laptop XPS 15',
        requestId: 'REQ-TEST-001',
        approverName: 'Jane Smith (Admin)',
        denialReason: 'Asset not available for testing period',
      },
      asset_issued: {
        requesterName: 'John Doe',
        assetName: 'Dell Laptop XPS 15',
        requestId: 'REQ-TEST-001',
        issuerName: 'Bob Wilson (Technician)',
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        issuanceNotes: 'Please handle with care and return on time',
      },
      return_reminder: {
        requesterName: 'John Doe',
        assetName: 'Dell Laptop XPS 15',
        requestId: 'REQ-TEST-001',
        expectedReturnDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        daysUntilDue: 2,
      },
      return_overdue: {
        requesterName: 'John Doe',
        assetName: 'Dell Laptop XPS 15',
        requestId: 'REQ-TEST-001',
        expectedReturnDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        daysOverdue: 3,
      },
    }

    const data = testData[type]
    if (!data) {
      return NextResponse.json(
        { success: false, error: `Unknown email type: ${type}. Available types: ${Object.keys(testData).join(', ')}` },
        { status: 400 }
      )
    }

    // Send the test email
    const result = await NodemailerService.sendNotification(type, recipient, data)

    return NextResponse.json({
      success: true,
      message: `Test email (${type}) sent successfully`,
      messageId: result.messageId,
      recipient,
      type,
      testData: data,
    })

  } catch (error) {
    console.error('Test email failed:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to send test email',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  // Disable test endpoint in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoint is disabled in production' },
      { status: 403 }
    )
  }

  return NextResponse.json({
    message: 'Email Test API',
    usage: 'POST with { type: "email_type", recipient: "email@example.com" }',
    availableTypes: [
      'request_submitted',
      'request_approved', 
      'request_denied',
      'asset_issued',
      'return_reminder',
      'return_overdue'
    ],
    example: {
      type: 'request_submitted',
      recipient: 'test@example.com'
    }
  })
}