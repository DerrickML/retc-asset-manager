import { NodemailerService } from '../../../../lib/services/nodemailer.js'
import { renderEmailTemplate } from "../../../../lib/services/email-templates.js"
import { settingsService } from "../../../../lib/appwrite/server-provider.js"
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { type, recipient, data, branding } = body

    if (!type || !recipient || !data) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, recipient, data' },
        { status: 400 }
      )
    }

    console.log(`Processing email notification: ${type} for ${recipient}`)

    // Get system branding settings if not provided
    let emailBranding = branding
    if (!emailBranding) {
      try {
        const settings = await settingsService.get()
        emailBranding = settings?.branding || {}
      } catch (error) {
        console.warn("Could not load branding settings:", error)
        emailBranding = {}
      }
    }

    // Render the email template
    let renderedEmail
    try {
      renderedEmail = renderEmailTemplate(type, data, emailBranding)
    } catch (error) {
      console.error("Template rendering error:", error)
      return NextResponse.json(
        { success: false, error: "Failed to render email template", details: error.message },
        { status: 500 }
      )
    }

    // Send notification using NodemailerService with rendered template
    const result = await NodemailerService.sendNotification(type, recipient, data, renderedEmail)

    console.log('Email sent successfully:', result.messageId)

    return NextResponse.json({
      success: true,
      message: 'Email notification sent successfully',
      messageId: result.messageId,
      recipient,
      type,
    })

  } catch (error) {
    console.error('Email notification failed:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send email notification' },
      { status: 500 }
    )
  }
}

// GET endpoint for email preview/testing
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const preview = searchParams.get("preview") === "true"

  if (!type) {
    return NextResponse.json(
      { error: "Missing template type parameter" },
      { status: 400 }
    )
  }

  // Mock data for preview
  const mockData = {
    REQUEST_SUBMITTED: {
      requesterName: "John Doe",
      assetName: "Dell Laptop XPS 15",
      requestId: "REQ123456",
      purpose: "Software development project",
      expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    REQUEST_APPROVED: {
      requesterName: "John Doe",
      assetName: "Dell Laptop XPS 15", 
      requestId: "REQ123456",
      approverName: "Jane Smith",
      approvalNotes: "Approved for development work"
    },
    REQUEST_DENIED: {
      requesterName: "John Doe",
      assetName: "Dell Laptop XPS 15",
      requestId: "REQ123456",
      approverName: "Jane Smith",
      denialReason: "Asset is currently under maintenance"
    },
    ASSET_ISSUED: {
      requesterName: "John Doe",
      assetName: "Dell Laptop XPS 15",
      requestId: "REQ123456",
      issuerName: "Bob Johnson",
      expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      issuanceNotes: "Laptop includes charger and case"
    },
    ASSET_ASSIGNED: {
      custodianName: "John Doe",
      assetName: "Dell Laptop XPS 15",
      assetTag: "RETC-001234",
      assetId: "AST789012",
      assignerName: "Jane Smith",
      assignmentDate: new Date().toISOString(),
      notes: "Assigned for development project",
      locationName: "IT Department",
      roomOrArea: "Room 205",
      currentCondition: "GOOD"
    },
    RETURN_REMINDER: {
      requesterName: "John Doe",
      assetName: "Dell Laptop XPS 15",
      requestId: "REQ123456",
      expectedReturnDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntilDue: 2
    },
    RETURN_OVERDUE: {
      requesterName: "John Doe",
      assetName: "Dell Laptop XPS 15",
      requestId: "REQ123456",
      expectedReturnDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      daysOverdue: 3
    },
    MAINTENANCE_DUE: {
      assetName: "Dell Laptop XPS 15",
      assetId: "AST789012",
      lastMaintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      nextMaintenance: new Date().toISOString(),
      technicianName: "Tech Support Team"
    },
    ASSET_RETURNED: {
      requesterName: "John Doe",
      assetName: "Dell Laptop XPS 15",
      requestId: "REQ123456",
      returnDate: new Date().toISOString(),
      returnCondition: "GOOD",
      returnNotes: "Asset returned in excellent condition"
    },
    SYSTEM_ALERT: {
      alertType: "Low Storage",
      severity: "WARNING",
      details: "File storage is at 85% capacity",
      timestamp: new Date().toISOString()
    },
    USER_WELCOME: {
      userName: "John Doe",
      userEmail: "john.doe@company.com",
      userId: "USR123456",
      roles: ["STAFF", "ASSET_ADMIN"],
      department: "Information Technology",
      temporaryPassword: "TempPass123!"
    }
  }

  const data = mockData[type]
  if (!data) {
    return NextResponse.json(
      { error: `No mock data available for template type: ${type}` },
      { status: 400 }
    )
  }

  try {
    const mockBranding = {
      orgName: "RETC Asset Management",
      brandColor: "#2563eb",
      accentColor: "#16a34a"
    }

    const renderedEmail = renderEmailTemplate(type, data, mockBranding)
    
    if (preview) {
      // Return HTML for preview
      return new Response(renderedEmail.html, {
        headers: { "Content-Type": "text/html" }
      })
    } else {
      // Return JSON with template data
      return NextResponse.json({
        type,
        subject: renderedEmail.subject,
        html: renderedEmail.html,
        data
      })
    }
  } catch (error) {
    console.error("Template preview error:", error)
    return NextResponse.json(
      { error: "Failed to render template", details: error.message },
      { status: 500 }
    )
  }
}