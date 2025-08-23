// Next.js API Function for handling email notifications using Nodemailer
// This replaces the Appwrite Function approach with direct SMTP sending

import { NodemailerService } from '../../../lib/services/nodemailer.js'

// Email notification handler for Appwrite Functions or Next.js API routes
export default async function handler(req, res) {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' })
    }

    const { type, recipient, data } = req.body

    if (!type || !recipient || !data) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: type, recipient, data' 
      })
    }

    console.log(`Processing email notification: ${type} for ${recipient}`)

    // Send notification using NodemailerService
    const result = await NodemailerService.sendNotification(type, recipient, data)

    console.log('Email sent successfully:', result.messageId)

    return res.status(200).json({
      success: true,
      message: 'Email notification sent successfully',
      messageId: result.messageId,
      recipient,
      type,
    })

  } catch (error) {
    console.error('Email notification failed:', error)
    
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send email notification'
    })
  }
}

// For Appwrite Functions (if still needed)
export async function appwriteFunction({ req, res, log, error }) {
  try {
    const payload = JSON.parse(req.body || '{}')
    const { type, recipient, data } = payload

    if (!type || !recipient || !data) {
      return res.json({ success: false, error: 'Missing required fields' })
    }

    log(`Processing email notification: ${type} for ${recipient}`)

    // Send notification using NodemailerService
    const result = await NodemailerService.sendNotification(type, recipient, data)

    log('Email sent successfully:', result.messageId)

    return res.json({
      success: true,
      message: 'Email notification sent successfully',
      messageId: result.messageId,
      recipient,
      type,
    })

  } catch (err) {
    error('Email notification failed:', err)
    return res.json({ success: false, error: err.message })
  }
}

// Export the appwrite function as the default for Appwrite Functions
module.exports = appwriteFunction