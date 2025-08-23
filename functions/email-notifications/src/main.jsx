// Appwrite Function for handling email notifications
// This would be deployed as an Appwrite Function

const sdk = require("node-appwrite")

// Email templates
const EMAIL_TEMPLATES = {
  request_submitted: {
    subject: "New Asset Request Submitted",
    template: `
      <h2>New Asset Request</h2>
      <p>A new asset request has been submitted and requires your attention.</p>
      <ul>
        <li><strong>Requester:</strong> {{requesterName}}</li>
        <li><strong>Asset:</strong> {{assetName}}</li>
        <li><strong>Purpose:</strong> {{purpose}}</li>
        <li><strong>Expected Return:</strong> {{expectedReturnDate}}</li>
      </ul>
      <p>Please review and approve/deny this request in the admin panel.</p>
    `,
  },
  request_approved: {
    subject: "Asset Request Approved",
    template: `
      <h2>Request Approved</h2>
      <p>Your asset request has been approved!</p>
      <ul>
        <li><strong>Asset:</strong> {{assetName}}</li>
        <li><strong>Approved by:</strong> {{approverName}}</li>
        <li><strong>Notes:</strong> {{approvalNotes}}</li>
      </ul>
      <p>You will receive another notification when the asset is ready for pickup.</p>
    `,
  },
  request_denied: {
    subject: "Asset Request Denied",
    template: `
      <h2>Request Denied</h2>
      <p>Unfortunately, your asset request has been denied.</p>
      <ul>
        <li><strong>Asset:</strong> {{assetName}}</li>
        <li><strong>Reviewed by:</strong> {{approverName}}</li>
        <li><strong>Reason:</strong> {{denialReason}}</li>
      </ul>
      <p>Please contact an administrator if you have questions.</p>
    `,
  },
  asset_issued: {
    subject: "Asset Ready for Pickup",
    template: `
      <h2>Asset Issued</h2>
      <p>Your requested asset has been issued and is ready for pickup.</p>
      <ul>
        <li><strong>Asset:</strong> {{assetName}}</li>
        <li><strong>Issued by:</strong> {{issuerName}}</li>
        <li><strong>Expected Return:</strong> {{expectedReturnDate}}</li>
        <li><strong>Notes:</strong> {{issuanceNotes}}</li>
      </ul>
      <p>Please arrange to collect the asset as soon as possible.</p>
    `,
  },
  return_reminder: {
    subject: "Asset Return Reminder",
    template: `
      <h2>Return Reminder</h2>
      <p>This is a friendly reminder that your borrowed asset is due for return soon.</p>
      <ul>
        <li><strong>Asset:</strong> {{assetName}}</li>
        <li><strong>Due Date:</strong> {{expectedReturnDate}}</li>
        <li><strong>Days Until Due:</strong> {{daysUntilDue}}</li>
      </ul>
      <p>Please return the asset by the due date to avoid overdue notifications.</p>
    `,
  },
  return_overdue: {
    subject: "OVERDUE: Asset Return Required",
    template: `
      <h2>Overdue Asset Return</h2>
      <p><strong>URGENT:</strong> Your borrowed asset is now overdue for return.</p>
      <ul>
        <li><strong>Asset:</strong> {{assetName}}</li>
        <li><strong>Due Date:</strong> {{expectedReturnDate}}</li>
        <li><strong>Days Overdue:</strong> {{daysOverdue}}</li>
      </ul>
      <p>Please return this asset immediately to avoid further action.</p>
    `,
  },
  maintenance_due: {
    subject: "Asset Maintenance Due",
    template: `
      <h2>Maintenance Required</h2>
      <p>An asset under your responsibility requires maintenance.</p>
      <ul>
        <li><strong>Asset:</strong> {{assetName}}</li>
        <li><strong>Last Maintenance:</strong> {{lastMaintenance}}</li>
        <li><strong>Next Maintenance:</strong> {{nextMaintenance}}</li>
      </ul>
      <p>Please schedule maintenance for this asset as soon as possible.</p>
    `,
  },
}

module.exports = async ({ req, res, log, error }) => {
  try {
    const payload = JSON.parse(req.body || "{}")
    const { type, recipient, data } = payload

    if (!type || !recipient || !data) {
      return res.json({ success: false, error: "Missing required fields" })
    }

    const template = EMAIL_TEMPLATES[type]
    if (!template) {
      return res.json({ success: false, error: "Unknown email type" })
    }

    // Replace template variables
    let emailContent = template.template
    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g")
      emailContent = emailContent.replace(regex, data[key] || "")
    })

    // In a real implementation, you would use a service like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Nodemailer with SMTP

    // Mock email sending
    log(`Sending email to ${recipient}`)
    log(`Subject: ${template.subject}`)
    log(`Content: ${emailContent}`)

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return res.json({
      success: true,
      message: "Email sent successfully",
      recipient,
      type,
    })
  } catch (err) {
    error("Email sending failed:", err)
    return res.json({ success: false, error: err.message })
  }
}
