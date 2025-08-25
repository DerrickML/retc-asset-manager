import { Client, Functions, Databases, Query } from "appwrite"
import { DATABASE_ID, COLLECTIONS } from "../appwrite/config"
import { EmailService } from "./email"

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)

const functions = new Functions(client)
const databases = new Databases(client)

// Scheduler service for automated tasks
export class SchedulerService {
  // Check for overdue returns (run daily)
  static async checkOverdueReturns() {
    try {
      const today = new Date()
      const requests = await databases.listDocuments(DATABASE_ID, COLLECTIONS.REQUESTS, [
        Query.equal("status", "Issued"),
        Query.lessThan("expected_return_date", today.toISOString()),
      ])

      for (const request of requests.documents) {
        // Get requester and asset details
        const [requester, asset] = await Promise.all([
          databases.getDocument(DATABASE_ID, COLLECTIONS.STAFF, request.requester_id),
          databases.getDocument(DATABASE_ID, COLLECTIONS.ASSETS, request.asset_id),
        ])

        await EmailService.sendReturnOverdue(request, requester, asset)

        // Log the overdue notification
        await databases.createDocument(DATABASE_ID, COLLECTIONS.ACTIVITY_LOGS, "unique()", {
          entity_type: "request",
          entity_id: request.$id,
          action: "overdue_notification_sent",
          user_id: "system",
          details: {
            days_overdue: Math.ceil((today - new Date(request.expected_return_date)) / (1000 * 60 * 60 * 24)),
          },
          created_at: new Date().toISOString(),
        })
      }

      console.log(`Processed ${requests.documents.length} overdue returns`)
    } catch (error) {
      console.error("Error checking overdue returns:", error)
    }
  }

  // Send return reminders (run daily)
  static async sendReturnReminders() {
    try {
      const reminderDate = new Date()
      reminderDate.setDate(reminderDate.getDate() + 3) // 3 days before due

      const requests = await databases.listDocuments(DATABASE_ID, COLLECTIONS.REQUESTS, [
        Query.equal("status", "Issued"),
        Query.equal("expected_return_date", reminderDate.toISOString().split("T")[0]),
      ])

      for (const request of requests.documents) {
        const [requester, asset] = await Promise.all([
          databases.getDocument(DATABASE_ID, COLLECTIONS.STAFF, request.requester_id),
          databases.getDocument(DATABASE_ID, COLLECTIONS.ASSETS, request.asset_id),
        ])

        await EmailService.sendReturnReminder(request, requester, asset)

        // Log the reminder
        await databases.createDocument(DATABASE_ID, COLLECTIONS.ACTIVITY_LOGS, "unique()", {
          entity_type: "request",
          entity_id: request.$id,
          action: "return_reminder_sent",
          user_id: "system",
          details: {
            reminder_days: 3,
          },
          created_at: new Date().toISOString(),
        })
      }

      console.log(`Sent ${requests.documents.length} return reminders`)
    } catch (error) {
      console.error("Error sending return reminders:", error)
    }
  }

  // Check for maintenance due (run weekly)
  static async checkMaintenanceDue() {
    try {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)

      const assets = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSETS, [
        Query.lessThan("next_maintenance", nextWeek.toISOString()),
        Query.notEqual("status", "Disposed"),
      ])

      for (const asset of assets.documents) {
        // Find assigned technician (in a real app, this would be a proper assignment)
        const technician = null // Would query technician assignments

        await EmailService.sendMaintenanceDue(asset, technician)

        // Log the maintenance reminder
        await databases.createDocument(DATABASE_ID, COLLECTIONS.ACTIVITY_LOGS, "unique()", {
          entity_type: "asset",
          entity_id: asset.$id,
          action: "maintenance_reminder_sent",
          user_id: "system",
          details: {
            next_maintenance: asset.next_maintenance,
          },
          created_at: new Date().toISOString(),
        })
      }

      console.log(`Sent ${assets.documents.length} maintenance reminders`)
    } catch (error) {
      console.error("Error checking maintenance due:", error)
    }
  }

  // Generate usage reports (run monthly)
  static async generateMonthlyReports() {
    try {
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)

      // Generate summary statistics
      const [assets, requests, activeUsers] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.ASSETS),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.REQUESTS, [
          Query.greaterThan("created_at", lastMonth.toISOString()),
        ]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.STAFF, [Query.equal("active", true)]),
      ])

      const reportData = {
        period: `${lastMonth.toLocaleDateString()} - ${new Date().toLocaleDateString()}`,
        totalAssets: assets.total,
        newRequests: requests.total,
        activeUsers: activeUsers.total,
        utilizationRate: ((requests.total / assets.total) * 100).toFixed(1),
      }

      // Send report to system administrators
      await EmailService.sendNotification("monthly_report", "admins", reportData)

      console.log("Monthly report generated and sent")
    } catch (error) {
      console.error("Error generating monthly reports:", error)
    }
  }
}
