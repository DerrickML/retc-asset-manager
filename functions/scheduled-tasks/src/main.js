// Scheduled task function for email reminders and maintenance alerts
// This can be deployed as an Appwrite Function or run as a Node.js cron job

import { databases } from '../../../lib/appwrite/client.js'
import { APPWRITE_CONFIG, COLLECTIONS, ENUMS } from '../../../lib/appwrite/config.js'
import { NodemailerService } from '../../../lib/services/nodemailer.js'
import { assetsService, assetRequestsService, staffService } from '../../../lib/appwrite/provider.js'
import { Query } from 'appwrite'

// Main scheduled task handler
export default async function scheduledTasks() {
  console.log('Starting scheduled tasks...')
  
  try {
    // Run all scheduled tasks in parallel
    await Promise.allSettled([
      sendReturnReminders(),
      sendOverdueNotifications(),
      sendMaintenanceReminders(),
    ])
    
    console.log('All scheduled tasks completed')
    return { success: true, message: 'Scheduled tasks completed' }
  } catch (error) {
    console.error('Scheduled tasks failed:', error)
    return { success: false, error: error.message }
  }
}

// Send return reminders for assets due back soon
async function sendReturnReminders() {
  try {
    console.log('Checking for assets due back soon...')
    
    const twoDaysFromNow = new Date()
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)
    
    // Find requests that are fulfilled and due back in 2 days
    const dueRequests = await assetRequestsService.list([
      Query.equal('status', ENUMS.REQUEST_STATUS.FULFILLED),
      Query.lessThanEqual('expectedReturnDate', twoDaysFromNow.toISOString()),
      Query.greaterThan('expectedReturnDate', new Date().toISOString()),
    ])
    
    for (const request of dueRequests.documents) {
      try {
        // Get related data
        const [requester, asset] = await Promise.all([
          staffService.get(request.requesterId),
          assetsService.get(request.assetId),
        ])
        
        // Send reminder email
        await NodemailerService.sendReturnReminder(request, requester, asset)
        console.log(`Return reminder sent for request ${request.$id}`)
      } catch (error) {
        console.error(`Failed to send reminder for request ${request.$id}:`, error)
      }
    }
    
    console.log(`Processed ${dueRequests.documents.length} return reminders`)
  } catch (error) {
    console.error('Return reminders task failed:', error)
  }
}

// Send overdue notifications for assets past due date
async function sendOverdueNotifications() {
  try {
    console.log('Checking for overdue assets...')
    
    const now = new Date()
    
    // Find requests that are fulfilled and overdue
    const overdueRequests = await assetRequestsService.list([
      Query.equal('status', ENUMS.REQUEST_STATUS.FULFILLED),
      Query.lessThan('expectedReturnDate', now.toISOString()),
    ])
    
    for (const request of overdueRequests.documents) {
      try {
        // Check if we've already sent an overdue notification recently
        const daysSinceOverdue = Math.ceil((now - new Date(request.expectedReturnDate)) / (1000 * 60 * 60 * 24))
        
        // Send notifications on days 1, 3, 7, and then weekly
        const notificationDays = [1, 3, 7, 14, 21, 28]
        if (!notificationDays.includes(daysSinceOverdue)) {
          continue
        }
        
        // Get related data
        const [requester, asset] = await Promise.all([
          staffService.get(request.requesterId),
          assetsService.get(request.assetId),
        ])
        
        // Send overdue notification
        await NodemailerService.sendReturnOverdue(request, requester, asset)
        console.log(`Overdue notification sent for request ${request.$id} (${daysSinceOverdue} days overdue)`)
      } catch (error) {
        console.error(`Failed to send overdue notification for request ${request.$id}:`, error)
      }
    }
    
    console.log(`Processed ${overdueRequests.documents.length} overdue notifications`)
  } catch (error) {
    console.error('Overdue notifications task failed:', error)
  }
}

// Send maintenance reminders for assets due for maintenance
async function sendMaintenanceReminders() {
  try {
    console.log('Checking for assets due for maintenance...')
    
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    
    // Find assets with maintenance due in the next 7 days
    const assetsDueMaintenance = await assetsService.list([
      Query.lessThanEqual('nextMaintenanceDue', sevenDaysFromNow.toISOString()),
      Query.greaterThan('nextMaintenanceDue', new Date().toISOString()),
      Query.notEqual('availableStatus', ENUMS.AVAILABLE_STATUS.RETIRED),
      Query.notEqual('availableStatus', ENUMS.AVAILABLE_STATUS.DISPOSED),
    ])
    
    for (const asset of assetsDueMaintenance.documents) {
      try {
        // Get the custodian or department manager
        let technician = null
        if (asset.custodianStaffId) {
          technician = await staffService.get(asset.custodianStaffId)
        }
        
        // Send maintenance reminder
        await NodemailerService.sendMaintenanceDue?.(asset, technician)
        console.log(`Maintenance reminder sent for asset ${asset.name}`)
      } catch (error) {
        console.error(`Failed to send maintenance reminder for asset ${asset.$id}:`, error)
      }
    }
    
    console.log(`Processed ${assetsDueMaintenance.documents.length} maintenance reminders`)
  } catch (error) {
    console.error('Maintenance reminders task failed:', error)
  }
}

// For Appwrite Functions
export async function appwriteFunction({ log, error }) {
  try {
    log('Starting scheduled email tasks...')
    
    const result = await scheduledTasks()
    
    if (result.success) {
      log(result.message)
    } else {
      error(result.error)
    }
    
    return result
  } catch (err) {
    error('Scheduled tasks failed:', err)
    return { success: false, error: err.message }
  }
}

// Export the appwrite function as the default
module.exports = appwriteFunction

