// Email template configurations and HTML templates

/**
 * Base email template with consistent branding
 */
const baseTemplate = (content, branding = {}) => {
  const orgName = branding.orgName || "RETC Asset Management"
  const brandColor = branding.brandColor || "#2563eb"
  const accentColor = branding.accentColor || "#16a34a"

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${orgName}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #374151;
          margin: 0;
          padding: 0;
          background-color: #f9fafb;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, ${brandColor} 0%, ${accentColor} 100%);
          color: white;
          padding: 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 32px 24px;
        }
        .footer {
          background-color: #f3f4f6;
          padding: 16px 24px;
          text-align: center;
          font-size: 14px;
          color: #6b7280;
        }
        .button {
          display: inline-block;
          background-color: ${brandColor};
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          margin: 16px 0;
        }
        .button:hover {
          background-color: ${accentColor};
        }
        .info-box {
          background-color: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 6px;
          padding: 16px;
          margin: 16px 0;
        }
        .warning-box {
          background-color: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 6px;
          padding: 16px;
          margin: 16px 0;
        }
        .success-box {
          background-color: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 6px;
          padding: 16px;
          margin: 16px 0;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }
        .details-table th,
        .details-table td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        .details-table th {
          background-color: #f9fafb;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${orgName}</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>This is an automated message from ${orgName}. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} ${orgName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Email Templates
 */
export const EMAIL_TEMPLATES = {
  REQUEST_SUBMITTED: {
    subject: "New Asset Request Submitted - {requestId}",
    template: (data, branding) => {
      const content = `
        <h2>🔔 New Asset Request</h2>
        <p>Dear Admin,</p>
        <p>A new asset request has been submitted and requires your review.</p>
        
        <div class="info-box">
          <table class="details-table">
            <tr><th>Requester:</th><td>${data.requesterName}</td></tr>
            <tr><th>Asset:</th><td>${data.assetName}</td></tr>
            <tr><th>Request ID:</th><td>#${data.requestId}</td></tr>
            <tr><th>Purpose:</th><td>${data.purpose}</td></tr>
            <tr><th>Expected Return:</th><td>${new Date(data.expectedReturnDate).toLocaleDateString()}</td></tr>
          </table>
        </div>
        
        <p>Please review this request in the admin panel:</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/requests" class="button">
          Review Request
        </a>
        
        <p>Best regards,<br>Asset Management System</p>
      `
      return baseTemplate(content, branding)
    }
  },

  REQUEST_APPROVED: {
    subject: "Asset Request Approved - {requestId}",
    template: (data, branding) => {
      const content = `
        <h2>✅ Request Approved</h2>
        <p>Dear ${data.requesterName},</p>
        <p>Great news! Your asset request has been approved.</p>
        
        <div class="success-box">
          <table class="details-table">
            <tr><th>Asset:</th><td>${data.assetName}</td></tr>
            <tr><th>Request ID:</th><td>#${data.requestId}</td></tr>
            <tr><th>Approved by:</th><td>${data.approverName}</td></tr>
            ${data.approvalNotes ? `<tr><th>Notes:</th><td>${data.approvalNotes}</td></tr>` : ''}
          </table>
        </div>
        
        <p>Your request is now pending issuance. You will receive another notification when your asset is ready for pickup.</p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/requests" class="button">
          View My Requests
        </a>
        
        <p>Best regards,<br>Asset Management Team</p>
      `
      return baseTemplate(content, branding)
    }
  },

  REQUEST_DENIED: {
    subject: "Asset Request Denied - {requestId}",
    template: (data, branding) => {
      const content = `
        <h2>❌ Request Denied</h2>
        <p>Dear ${data.requesterName},</p>
        <p>We regret to inform you that your asset request has been denied.</p>
        
        <div class="warning-box">
          <table class="details-table">
            <tr><th>Asset:</th><td>${data.assetName}</td></tr>
            <tr><th>Request ID:</th><td>#${data.requestId}</td></tr>
            <tr><th>Reviewed by:</th><td>${data.approverName}</td></tr>
            ${data.denialReason ? `<tr><th>Reason:</th><td>${data.denialReason}</td></tr>` : ''}
          </table>
        </div>
        
        <p>If you have questions about this decision or would like to submit a new request, please contact the asset management team.</p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/requests" class="button">
          View My Requests
        </a>
        
        <p>Best regards,<br>Asset Management Team</p>
      `
      return baseTemplate(content, branding)
    }
  },

  ASSET_ISSUED: {
    subject: "Asset Ready for Pickup - {requestId}",
    template: (data, branding) => {
      const content = `
        <h2>🎉 Asset Ready for Pickup</h2>
        <p>Dear ${data.requesterName},</p>
        <p>Your requested asset has been issued and is ready for pickup!</p>
        
        <div class="success-box">
          <table class="details-table">
            <tr><th>Asset:</th><td>${data.assetName}</td></tr>
            <tr><th>Request ID:</th><td>#${data.requestId}</td></tr>
            <tr><th>Issued by:</th><td>${data.issuerName}</td></tr>
            <tr><th>Expected Return:</th><td>${new Date(data.expectedReturnDate).toLocaleDateString()}</td></tr>
            ${data.issuanceNotes ? `<tr><th>Notes:</th><td>${data.issuanceNotes}</td></tr>` : ''}
          </table>
        </div>
        
        <p><strong>Important:</strong> Please return the asset by the expected return date. Late returns may affect your future request approvals.</p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/requests" class="button">
          View My Requests
        </a>
        
        <p>Best regards,<br>Asset Management Team</p>
      `
      return baseTemplate(content, branding)
    }
  },

  ASSET_ASSIGNED: {
    subject: "Asset Assigned - {assetName}",
    template: (data, branding) => {
      const content = `
        <h2>📋 Asset Assigned</h2>
        <p>Dear ${data.custodianName},</p>
        <p>You have been assigned as the custodian for the following asset:</p>
        
        <div class="success-box">
          <table class="details-table">
            <tr><th>Asset:</th><td>${data.assetName}</td></tr>
            <tr><th>Asset Tag:</th><td>${data.assetTag}</td></tr>
            <tr><th>Asset ID:</th><td>${data.assetId}</td></tr>
            <tr><th>Condition:</th><td>${data.currentCondition}</td></tr>
            <tr><th>Location:</th><td>${data.locationName}${data.roomOrArea ? ` - ${data.roomOrArea}` : ''}</td></tr>
            <tr><th>Assigned by:</th><td>${data.assignerName}</td></tr>
            <tr><th>Assignment Date:</th><td>${new Date(data.assignmentDate).toLocaleDateString()}</td></tr>
            ${data.notes ? `<tr><th>Notes:</th><td>${data.notes}</td></tr>` : ''}
          </table>
        </div>
        
        <p><strong>As the asset custodian, you are responsible for:</strong></p>
        <ul>
          <li>Ensuring the asset is properly maintained and secured</li>
          <li>Reporting any damage or issues immediately</li>
          <li>Following proper procedures for any maintenance or repairs</li>
          <li>Notifying the asset management team of any location changes</li>
        </ul>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/assets" class="button">
          View Asset Details
        </a>
        
        <p>If you have any questions about your asset custodianship responsibilities, please contact the Asset Management team.</p>
        
        <p>Best regards,<br>Asset Management Team</p>
      `
      return baseTemplate(content, branding)
    }
  },

  RETURN_REMINDER: {
    subject: "Asset Return Reminder - Due in ${daysUntilDue} days",
    template: (data, branding) => {
      const content = `
        <h2>⏰ Return Reminder</h2>
        <p>Dear ${data.requesterName},</p>
        <p>This is a friendly reminder that you have an asset due for return.</p>
        
        <div class="info-box">
          <table class="details-table">
            <tr><th>Asset:</th><td>${data.assetName}</td></tr>
            <tr><th>Request ID:</th><td>#${data.requestId}</td></tr>
            <tr><th>Due Date:</th><td>${new Date(data.expectedReturnDate).toLocaleDateString()}</td></tr>
            <tr><th>Days Until Due:</th><td>${data.daysUntilDue} day${data.daysUntilDue !== 1 ? 's' : ''}</td></tr>
          </table>
        </div>
        
        <p>Please plan to return the asset by the due date to avoid any late return issues.</p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/requests" class="button">
          View My Requests
        </a>
        
        <p>Best regards,<br>Asset Management Team</p>
      `
      return baseTemplate(content, branding)
    }
  },

  RETURN_OVERDUE: {
    subject: "OVERDUE: Asset Return Required - {requestId}",
    template: (data, branding) => {
      const content = `
        <h2>🚨 Asset Overdue</h2>
        <p>Dear ${data.requesterName},</p>
        <p><strong>URGENT:</strong> You have an overdue asset that must be returned immediately.</p>
        
        <div class="warning-box">
          <table class="details-table">
            <tr><th>Asset:</th><td>${data.assetName}</td></tr>
            <tr><th>Request ID:</th><td>#${data.requestId}</td></tr>
            <tr><th>Due Date:</th><td>${new Date(data.expectedReturnDate).toLocaleDateString()}</td></tr>
            <tr><th>Days Overdue:</th><td>${data.daysOverdue} day${data.daysOverdue !== 1 ? 's' : ''}</td></tr>
          </table>
        </div>
        
        <p>Please return this asset as soon as possible. Continued overdue returns may result in restrictions on future asset requests.</p>
        
        <p>If you need an extension or have issues returning the asset, please contact the asset management team immediately.</p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/requests" class="button">
          View My Requests
        </a>
        
        <p>Best regards,<br>Asset Management Team</p>
      `
      return baseTemplate(content, branding)
    }
  },

  MAINTENANCE_DUE: {
    subject: "Asset Maintenance Required - ${assetName}",
    template: (data, branding) => {
      const content = `
        <h2>🔧 Maintenance Required</h2>
        <p>Dear ${data.technicianName},</p>
        <p>An asset requires scheduled maintenance attention.</p>
        
        <div class="warning-box">
          <table class="details-table">
            <tr><th>Asset:</th><td>${data.assetName}</td></tr>
            <tr><th>Asset ID:</th><td>${data.assetId}</td></tr>
            <tr><th>Last Maintenance:</th><td>${data.lastMaintenance ? new Date(data.lastMaintenance).toLocaleDateString() : 'Never'}</td></tr>
            <tr><th>Due Date:</th><td>${new Date(data.nextMaintenance).toLocaleDateString()}</td></tr>
          </table>
        </div>
        
        <p>Please schedule and perform the required maintenance as soon as possible.</p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/assets/${data.assetId}" class="button">
          View Asset Details
        </a>
        
        <p>Best regards,<br>Asset Management System</p>
      `
      return baseTemplate(content, branding)
    }
  },

  ASSET_RETURNED: {
    subject: "Asset Returned - {requestId}",
    template: (data, branding) => {
      const content = `
        <h2>📦 Asset Returned</h2>
        <p>Dear Admin,</p>
        <p>An asset has been returned and requires processing.</p>
        
        <div class="info-box">
          <table class="details-table">
            <tr><th>Asset:</th><td>${data.assetName}</td></tr>
            <tr><th>Request ID:</th><td>#${data.requestId}</td></tr>
            <tr><th>Returned by:</th><td>${data.requesterName}</td></tr>
            <tr><th>Return Date:</th><td>${new Date(data.returnDate).toLocaleDateString()}</td></tr>
            <tr><th>Condition:</th><td>${data.returnCondition}</td></tr>
            ${data.returnNotes ? `<tr><th>Notes:</th><td>${data.returnNotes}</td></tr>` : ''}
          </table>
        </div>
        
        <p>Please process this return in the admin panel and update the asset status accordingly.</p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/requests" class="button">
          Process Return
        </a>
        
        <p>Best regards,<br>Asset Management System</p>
      `
      return baseTemplate(content, branding)
    }
  },

  SYSTEM_ALERT: {
    subject: "System Alert - ${alertType}",
    template: (data, branding) => {
      const content = `
        <h2>🚨 System Alert</h2>
        <p>Dear Administrator,</p>
        <p>A system alert has been triggered that requires your attention.</p>
        
        <div class="warning-box">
          <table class="details-table">
            <tr><th>Alert Type:</th><td>${data.alertType}</td></tr>
            <tr><th>Severity:</th><td>${data.severity}</td></tr>
            <tr><th>Timestamp:</th><td>${new Date().toLocaleString()}</td></tr>
            ${data.details ? `<tr><th>Details:</th><td>${data.details}</td></tr>` : ''}
          </table>
        </div>
        
        <p>Please investigate this alert and take appropriate action.</p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/dashboard" class="button">
          View Admin Dashboard
        </a>
        
        <p>Best regards,<br>Asset Management System</p>
      `
      return baseTemplate(content, branding)
    }
  },

  USER_WELCOME: {
    subject: "Welcome to {orgName} - Your Account is Ready!",
    template: (data, branding) => {
      const orgName = branding.orgName || "RETC Asset Management"
      const content = `
        <h2>🎉 Welcome to ${orgName}!</h2>
        <p>Dear ${data.userName},</p>
        <p>Welcome to the ${orgName} system! Your account has been successfully created and you can now access the platform.</p>
        
        <div class="success-box">
          <table class="details-table">
            <tr><th>Name:</th><td>${data.userName}</td></tr>
            <tr><th>Email:</th><td>${data.userEmail}</td></tr>
            <tr><th>User ID:</th><td>${data.userId}</td></tr>
            <tr><th>Role${data.roles && data.roles.length > 1 ? 's' : ''}:</th><td>${data.roles ? data.roles.join(', ') : 'Staff'}</td></tr>
            ${data.department ? `<tr><th>Department:</th><td>${data.department}</td></tr>` : ''}
          </table>
        </div>
        
        <div class="warning-box">
          <h3>🔐 Your Login Credentials</h3>
          <p><strong>Email:</strong> ${data.userEmail}</p>
          <p><strong>Temporary Password:</strong> <code style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${data.temporaryPassword}</code></p>
          <p><strong>⚠️ Important:</strong> Please change your password after your first login for security purposes.</p>
        </div>
        
        <h3>🚀 Getting Started</h3>
        <ul>
          <li><strong>Asset Requests:</strong> Submit requests for equipment and resources</li>
          <li><strong>Track Assets:</strong> Monitor your assigned assets and returns</li>
          <li><strong>Profile Management:</strong> Update your contact information and preferences</li>
          ${data.roles && data.roles.includes('ADMIN') ? '<li><strong>Administration:</strong> Manage users, assets, and system settings</li>' : ''}
        </ul>
        
        <p>Click the button below to log in to your account:</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" class="button">
          Log In to Your Account
        </a>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        
        <p>Welcome aboard!<br>
        The ${orgName} Team</p>
      `
      return baseTemplate(content, branding)
    }
  }
}

/**
 * Template renderer function
 */
export function renderEmailTemplate(templateType, data, branding = {}) {
  const template = EMAIL_TEMPLATES[templateType]
  
  if (!template) {
    throw new Error(`Email template '${templateType}' not found`)
  }

  const htmlContent = template.template(data, branding)
  let subject = template.subject

  // Replace placeholders in subject
  subject = subject.replace(/{(\w+)}/g, (match, key) => data[key] || branding[key] || match)
  subject = subject.replace(/\${(\w+)}/g, (match, key) => data[key] || branding[key] || match)

  return {
    subject,
    html: htmlContent
  }
}